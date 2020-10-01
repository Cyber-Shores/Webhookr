import { MachinaFunctionDefinition, MachinaArgsTypes, MachinaArgsTypeNames } from "./machinaFunction";
import { Message } from "discord.js";
import { Machina } from "../machina";
import { checkArgsAgainstCriteria, convertArgType, MachinaArgsInfo, exists, arrify, sameObj } from "./machinaUtility";
import { MachinaMessage } from "./machinaMessage";
import wrap from "word-wrap"

/**
 * Add crucial information to the function. This is required. Look at machinaFunction.ts for options
 * @param info Information about the function itself. Monikers and Description is required, everything else is optional.
 */
export const machinaDecoratorInfo = (info: MachinaFunctionDefinition & Required<Pick<MachinaFunctionDefinition, 'description' | 'monikers'>>) => 
/** 
 * This is where you put your function and its info that would have been given if you were using decorators + classes
 * @param target The name of the class
 * @param propertyKey The name of the function
 * @param f The function itself 
 */
(target, propertyKey: string, f?: Function) => {
    if(arrify(info.monikers).some(m => m.includes(".")))
        throw "Machina Decorator: . is a reserved for denoting sub commands, please use another symbol" // USE . to denote sub commands!

    if(typeof target == "string")
        target = {name: target, [propertyKey]: f}
    
    let _target = target[propertyKey]
    let newInfo = []
    if(info.strictArgs && !exists(info.args))
        throw "You cannot have strictArgs as true and not have any arguments, see the \"" + propertyKey + "\" function in the \"" + target.name + "\" file"
    
    let _duplicates: MachinaArgsTypeNames[][]
    if(exists(info.args) && (_duplicates = findDuplicates(arrify(info.args).map(a => arrify(a).map(_a => _a.type)))).length > 0)
        // IF YOU HAVE TO SINGLE ARGUMENTS WITH THE SAME TYPE, THIS ERROR WILL RUN. [arg1, arg2, arg3] have to be different types, or else the bot doesnt know which one is being called
        throw (`Error, you have two args or args[] that have the exact same types. The name of the args in question are: ${JSON.stringify(_duplicates.map(d => arrify(info.args).filter(_ => sameObj(arrify(_).map(__ => __.type), d))).map(_ => _.map(__ => arrify(__).map(___ => ___.name))).flat(1))} in ${propertyKey} of ${target.name}`)

    target[propertyKey] = async (...args) => { // Hash, Message
        const [Bot, msg] = args as [Machina, Message]
        let c = Machina.subCommandMiddleware(msg?.content, info.separator, 1)
        const _args = msg["params"] || Machina.getArgs(c, info.separator || " ").map(convertArgType).filter(exists) // TODO UPDATE SUBCOMMANDS TO THIS FORMAT -> # potato.splat instead of # potato splat
        let subs, sub = null 

        if(info.subs && (subs = arrify(info.subs).filter(s => s.monikers.includes("" + _args[0]))).length > 0)
            if(subs.length > 1)
                Machina.multipleCommands(msg, subs)
            else {
                msg["_name"] = _args[0]
                sub = subs[0]
                _args.shift()
                msg["params"] = _args 
                return sub(Bot, msg)
            }

        // checks the arguments, errors out if it doesnt match
        let results = info.args ? checkArgsAgainstCriteria(_args, info.args) : null
        if(info.strictArgs) // When it errors out
        if(!results?.value || !exists(results)) {
            await new MachinaMessage({title: `Parameter Error${msg["_name"] ? ": " + msg["_name"] : ""}`, description: wrap((_args.length == 0 ? "You did not input any arguments, please try again." : "Your arguments did not match any of the required arguments.") + " Arguments for this command are listed below."), fields: arrify(info.args).map(arrify).map((a, i) => ({name: "Option " + (i+1), value: arrify(a).map(_a => `${_a.name} - ${_a.type}`).join("\n"), inline: true}))}, msg).error()
            
            return console.log("this is the part where it would error to the user: " + propertyKey + " in " + target.name)
        }

        _target({info, Bot, msg, args: _args, argsInfo: results} as MachinaFunctionParameters)
    }
    
    Object.defineProperty(target[propertyKey], 'name', { value: propertyKey })
    
    info.class = info.class || target.name
    Object.keys(info).forEach(i => newInfo[i] = {value: info[i]})
    newInfo["monikers"].writable = true
    newInfo["class"].writable = true
    Object.defineProperties(target[propertyKey], newInfo as any) 

    return target[propertyKey] as typeof target
}

/**
 * Use this when you want to take the name of a class and put it on a function, or overried it.
 * @example When you are importing a command into a class and you want to force the class to change
 */
export const machinaDecoratorClassName = (target, propertyKey: string) => {
    exists(target[propertyKey]["class"]) ? target[propertyKey]["class"] = target.name : Object.defineProperty(target[propertyKey], 'class', { value: target.name})
    return target[propertyKey]
}

// info: MachinaFunctionDefinition, Hash: Machina, msg: Message, args: MachinaArgsTypes[], argInfo: MachinaResponse<boolean>
const findDuplicates = (arr) => {
    let sorted_arr = arr.slice().sort()
    let results = []
    for (let i = 0; i < sorted_arr.length - 1; i++) {
      if (sameObj(sorted_arr[i + 1], sorted_arr[i])) {
        results.push(sorted_arr[i]);
      }
    }
    return results;
  }

/**
 * Defines the parameters of a Machina Function
 */
export interface MachinaFunctionParameters {
    /** Information about the command that was inputted in the decorator */
    info: MachinaFunctionDefinition, 
    /** The instance of the Machina class (the bot) */
    Bot: Machina,
    /** The users message (discord.js message) */
    msg: Message, 
    /** The Users arguments */
    args: MachinaArgsTypes[],
    /** Information about the inputted argumets */
    argsInfo: MachinaArgsInfo
}
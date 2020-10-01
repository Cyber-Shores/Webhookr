"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.machinaDecoratorClassName = exports.machinaDecoratorInfo = void 0;
const machina_1 = require("../machina");
const machinaUtility_1 = require("./machinaUtility");
const machinaMessage_1 = require("./machinaMessage");
const word_wrap_1 = __importDefault(require("word-wrap"));
/**
 * Add crucial information to the function. This is required. Look at machinaFunction.ts for options
 * @param info Information about the function itself. Monikers and Description is required, everything else is optional.
 */
exports.machinaDecoratorInfo = (info) => 
/**
 * This is where you put your function and its info that would have been given if you were using decorators + classes
 * @param target The name of the class
 * @param propertyKey The name of the function
 * @param f The function itself
 */
(target, propertyKey, f) => {
    if (machinaUtility_1.arrify(info.monikers).some(m => m.includes(".")))
        throw "Machina Decorator: . is a reserved for denoting sub commands, please use another symbol"; // USE . to denote sub commands!
    if (typeof target == "string")
        target = { name: target, [propertyKey]: f };
    let _target = target[propertyKey];
    let newInfo = [];
    if (info.strictArgs && !machinaUtility_1.exists(info.args))
        throw "You cannot have strictArgs as true and not have any arguments, see the \"" + propertyKey + "\" function in the \"" + target.name + "\" file";
    let _duplicates;
    if (machinaUtility_1.exists(info.args) && (_duplicates = findDuplicates(machinaUtility_1.arrify(info.args).map(a => machinaUtility_1.arrify(a).map(_a => _a.type)))).length > 0)
        // IF YOU HAVE TO SINGLE ARGUMENTS WITH THE SAME TYPE, THIS ERROR WILL RUN. [arg1, arg2, arg3] have to be different types, or else the bot doesnt know which one is being called
        throw (`Error, you have two args or args[] that have the exact same types. The name of the args in question are: ${JSON.stringify(_duplicates.map(d => machinaUtility_1.arrify(info.args).filter(_ => machinaUtility_1.sameObj(machinaUtility_1.arrify(_).map(__ => __.type), d))).map(_ => _.map(__ => machinaUtility_1.arrify(__).map(___ => ___.name))).flat(1))} in ${propertyKey} of ${target.name}`);
    target[propertyKey] = async (...args) => {
        const [Bot, msg] = args;
        let c = machina_1.Machina.subCommandMiddleware(msg === null || msg === void 0 ? void 0 : msg.content, info.separator, 1);
        const _args = msg["params"] || machina_1.Machina.getArgs(c, info.separator || " ").map(machinaUtility_1.convertArgType).filter(machinaUtility_1.exists); // TODO UPDATE SUBCOMMANDS TO THIS FORMAT -> # potato.splat instead of # potato splat
        let subs, sub = null;
        if (info.subs && (subs = machinaUtility_1.arrify(info.subs).filter(s => s.monikers.includes("" + _args[0]))).length > 0)
            if (subs.length > 1)
                machina_1.Machina.multipleCommands(msg, subs);
            else {
                msg["_name"] = _args[0];
                sub = subs[0];
                _args.shift();
                msg["params"] = _args;
                return sub(Bot, msg);
            }
        // checks the arguments, errors out if it doesnt match
        let results = info.args ? machinaUtility_1.checkArgsAgainstCriteria(_args, info.args) : null;
        if (info.strictArgs) // When it errors out
            if (!(results === null || results === void 0 ? void 0 : results.value) || !machinaUtility_1.exists(results)) {
                await new machinaMessage_1.MachinaMessage({ title: `Parameter Error${msg["_name"] ? ": " + msg["_name"] : ""}`, description: word_wrap_1.default((_args.length == 0 ? "You did not input any arguments, please try again." : "Your arguments did not match any of the required arguments.") + " Arguments for this command are listed below."), fields: machinaUtility_1.arrify(info.args).map(machinaUtility_1.arrify).map((a, i) => ({ name: "Option " + (i + 1), value: machinaUtility_1.arrify(a).map(_a => `${_a.name} - ${_a.type}`).join("\n"), inline: true })) }, msg).error();
                return console.log("this is the part where it would error to the user: " + propertyKey + " in " + target.name);
            }
        _target({ info, Bot, msg, args: _args, argsInfo: results });
    };
    Object.defineProperty(target[propertyKey], 'name', { value: propertyKey });
    info.class = info.class || target.name;
    Object.keys(info).forEach(i => newInfo[i] = { value: info[i] });
    newInfo["monikers"].writable = true;
    newInfo["class"].writable = true;
    Object.defineProperties(target[propertyKey], newInfo);
    return target[propertyKey];
};
/**
 * Use this when you want to take the name of a class and put it on a function, or overried it.
 * @example When you are importing a command into a class and you want to force the class to change
 */
exports.machinaDecoratorClassName = (target, propertyKey) => {
    machinaUtility_1.exists(target[propertyKey]["class"]) ? target[propertyKey]["class"] = target.name : Object.defineProperty(target[propertyKey], 'class', { value: target.name });
    return target[propertyKey];
};
// info: MachinaFunctionDefinition, Hash: Machina, msg: Message, args: MachinaArgsTypes[], argInfo: MachinaResponse<boolean>
const findDuplicates = (arr) => {
    let sorted_arr = arr.slice().sort();
    let results = [];
    for (let i = 0; i < sorted_arr.length - 1; i++) {
        if (machinaUtility_1.sameObj(sorted_arr[i + 1], sorted_arr[i])) {
            results.push(sorted_arr[i]);
        }
    }
    return results;
};

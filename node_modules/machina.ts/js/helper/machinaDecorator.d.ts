import { MachinaFunctionDefinition, MachinaArgsTypes } from "./machinaFunction";
import { Message } from "discord.js";
import { Machina } from "../machina";
import { MachinaArgsInfo } from "./machinaUtility";
/**
 * Add crucial information to the function. This is required. Look at machinaFunction.ts for options
 * @param info Information about the function itself. Monikers and Description is required, everything else is optional.
 */
export declare const machinaDecoratorInfo: (info: MachinaFunctionDefinition & Required<Pick<MachinaFunctionDefinition, 'description' | 'monikers'>>) => (target: any, propertyKey: string, f?: Function) => any;
/**
 * Use this when you want to take the name of a class and put it on a function, or overried it.
 * @example When you are importing a command into a class and you want to force the class to change
 */
export declare const machinaDecoratorClassName: (target: any, propertyKey: string) => any;
/**
 * Defines the parameters of a Machina Function
 */
export interface MachinaFunctionParameters {
    /** Information about the command that was inputted in the decorator */
    info: MachinaFunctionDefinition;
    /** The instance of the Machina class (the bot) */
    Bot: Machina;
    /** The users message (discord.js message) */
    msg: Message;
    /** The Users arguments */
    args: MachinaArgsTypes[];
    /** Information about the inputted argumets */
    argsInfo: MachinaArgsInfo;
}

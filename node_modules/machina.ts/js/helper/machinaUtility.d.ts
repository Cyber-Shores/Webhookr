import { MachinaArgsTypes, MachinaArgs } from "./machinaFunction";
import { MachinaResponse } from "./machinaResponse";
/**
 * Converts an object into an array if it isnt one already
 * @param thing the thing that is either an array or a single object
 */
export declare const arrify: <T>(thing: T | T[]) => T[];
/**
 * Flattens an array while keeping the good bits then expands it to a number
 * @param thing An array or object
 * @param dimensions how many arrays deep, ex: [[[]]] would be 3
 */
export declare const mulitpleArrify: <T>(thing: T, dimensions: number) => any;
/**
 * Make an array with a single item a single item, else leave it be
 * @param thing Something that is an array with 1 or more items
 */
export declare const singleOut: <T>(thing: T[]) => T | T[];
/**
 * Imports a file, multiple files, or an entire dir (blacklist available)
 * @param type  what you want, a single file, mutliple files, or an entire dir
 * @param path  the path to the things
 * @param ignore  if you are importing a dir, this is the blacklist
 */
export declare const extractClasses: (type: "file" | "files" | "dir", path: string | string[], ignore?: string | string[]) => any[];
/**
 * Takes a string and converts it to its respective type (number, boolean) or keeps it as a string
 * @param arg The string to be converted to its respective type
 */
export declare const convertArgType: (arg: string) => MachinaArgsTypes;
/**
 * Checks to see if two objects have the same attributes
 * @param x Object 1
 * @param y Object 2
 */
export declare const sameObj: (x: any, y: any) => boolean;
/**
 * Checks to see if the arguments meet the criteria, and returns if they do not.
 * @note If you have something like this: [[arg, arg2], arg5, arg6] => it is treated as [[arg, arg2], [arg5], [arg6]] and not [[arg, arg2], [arg5, arg6]]
 * @param args The arguments
 * @param argDefs The criteria forthe arguments
 * @returns {MachinaArgsInfo} value: matches a set argument, extra: index of the param it matches, results: the param info and the user sent param info, extraResults: extra params that the user sent
 */
export declare const checkArgsAgainstCriteria: (convertedArgs: MachinaArgsTypes[], argDefs: MachinaArgs | MachinaArgs[] | (MachinaArgs | MachinaArgs[])[]) => MachinaArgsInfo;
export declare type MachinaReason<E, R = E> = {
    result: boolean;
    expected: E;
    recieved: R;
};
export declare type MachinaArgsInfo = MachinaResponse<boolean> & {
    results: MachinaReason<MachinaArgs, MachinaArgsTypes>[];
    extraResults?: MachinaArgsTypes[];
};
interface typeArryTopology {
    unifiedTopology: boolean;
    topologyBreaks: Set<[number, number]>;
    dimensions: number;
}
/** Checks to see if an array is symetric (like this: [[],[]]  and not [[[][]], []])*/
export declare const checkArrayTopology: <T>(arr: T, data?: typeArryTopology, setDim?: number, index?: number) => typeArryTopology;
/**
 * Takes a value that could either be soemthing or undefined. If it is undefined, return null. Else, return the value.
 * @param data anything
 */
export declare const nullify: (data: any) => any;
/**
 * Returns true if the data is not undefined nor null
 * @param data anything
 */
export declare const exists: (data: any) => boolean;
export declare const log: (filepath: any, ...data: any[]) => void;
export {};

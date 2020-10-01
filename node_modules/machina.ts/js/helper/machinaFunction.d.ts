import { PermissionResolvable } from "discord.js";
export interface MachinaFunctionDefinition {
    /** What the user has to type to call that commnad (without spaces or colons) */
    monikers?: string | string[];
    /** Where the command belongs */
    class?: string;
    /** What the user has to seperate each argument with */
    separator?: " " | " | ";
    /** The arguments for the command.
     * @example arg // for one arg.
     * @example [arg, arg, arg, ...] // for multiple single args
     * @example [[arg, arg, arg, ...]] // for one set of multiple args.
     * @example [[arg, arg, arg, ...], [arg, arg, ...], arg, ...] // for multiple sets of multiple args and/or single args
    */
    args?: MachinaArgs | MachinaArgs[] | (MachinaArgs | MachinaArgs[])[];
    /** Should the bot error out if the user doesnt put correct arguments */
    strictArgs?: boolean;
    /** The perms the bot needs to carry out a command */
    selfPermissions?: PermissionResolvable | PermissionResolvable[];
    /** where you whitelist or blacklist people, guilds, etc. */
    permissions?: {
        /** The whitelist (if allow and disallow have overlap, the overlap is asummed to be blacklisted) */
        allow?: MachinaPermission | MachinaPermission[];
        /** The blacklist */
        disallow?: MachinaPermission | MachinaPermission[];
    };
    /** sub commands */
    subs?: MachinaFunction | MachinaFunction[];
    /** the description of the function */
    description?: string;
    /** any hints for the user when they want it */
    hints?: string | string[];
    /** any examples for the user when they want it */
    examples?: string | string[];
    /** dont mess with this, helps combat commands that have the same names */
    containsUUID?: boolean;
    /** any extra stuff you want to put on the function */
    extra?: any;
}
/** A Machina function */
export declare type MachinaFunction = MachinaFunctionDefinition & Function;
/** MachinaArgs's types as strings */
export declare type MachinaArgsTypeNames = "string" | "number" | "boolean";
/** MachinaArgs's actual types (string, number, boolean) */
export declare type MachinaArgsTypes = string | number | boolean;
export interface MachinaArgs {
    /** The name of the argument */
    name: string;
    /** The type of the argument (number, string, or boolean) */
    type: MachinaArgsTypeNames;
    /** The description of the argument */
    description?: string;
}
export interface MachinaPermission {
    /** The names of the users */
    users?: string | string[];
    /** The names of the channels */
    channels?: string | string[];
    /** The names of the guilds */
    guilds?: string | string[];
    /** The names of the roles */
    roles?: string | string[];
    /** The permissions */
    permissions?: PermissionResolvable | PermissionResolvable[];
}

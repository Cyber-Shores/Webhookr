import { PermissionResolvable } from "discord.js";

export interface MachinaFunctionDefinition {
    /** What the user has to type to call that commnad (without spaces or colons) */
    monikers?: string | string[], // basically the name of the function. if more are provided, the first is seen as the name and the others as the aliases (a uuid is added to remove the chance of naming conflicts)
    /** Where the command belongs */
    class?: string, // which class it comes from
    /** What the user has to seperate each argument with */
    separator?: " " | " | ", // what will separate each argument
    /** The arguments for the command. 
     * @example arg // for one arg.
     * @example [arg, arg, arg, ...] // for multiple single args 
     * @example [[arg, arg, arg, ...]] // for one set of multiple args. 
     * @example [[arg, arg, arg, ...], [arg, arg, ...], arg, ...] // for multiple sets of multiple args and/or single args
    */
    args?: MachinaArgs | MachinaArgs[] | (MachinaArgs | MachinaArgs[])[], // basically used to check if the correct number of args are set 
    /** Should the bot error out if the user doesnt put correct arguments */
    strictArgs?: boolean, // determines if the decorators check the functions and error out if the user doesnt put correct arguments
    /** The perms the bot needs to carry out a command */
    selfPermissions?: PermissionResolvable | PermissionResolvable[], // what permissions the command requires to run. ex: ability to manage messages
    /** where you whitelist or blacklist people, guilds, etc. */
    permissions?: { // basically whitelisting / blacklisting
        /** The whitelist (if allow and disallow have overlap, the overlap is asummed to be blacklisted) */
        allow?: MachinaPermission | MachinaPermission[]
        /** The blacklist */
        disallow?: MachinaPermission | MachinaPermission[]
    },

    /** sub commands */
    subs?: MachinaFunction | MachinaFunction[], // ooh spooky circular, but this is for sub commands
    /** the description of the function */
    description?: string, // what should be said during help / all commands
    /** any hints for the user when they want it */
    hints?: string | string[], // what should be hinted at on error
    /** any examples for the user when they want it */
    examples?: string | string[], // what should be said during help

    /** dont mess with this, helps combat commands that have the same names */
    containsUUID?: boolean // helper, just to check if it already has a uuid since the uuid is appeneded to the monikers

    /** any extra stuff you want to put on the function */
    extra?: any
}

/** A Machina function */
export type MachinaFunction = MachinaFunctionDefinition & Function
/** MachinaArgs's types as strings */
export type MachinaArgsTypeNames = "string" | "number" | "boolean" // | "array" // NOTE: I dont know how you would take a message and turn it into an array with other types like string, array, boolean, array. Like i guess you could add markers, but that seems like a lot of work.
/** MachinaArgs's actual types (string, number, boolean) */
export type MachinaArgsTypes = string | number | boolean
// export type MachinaArgsTypes<T> = Array<T>
export interface MachinaArgs {
    /** The name of the argument */
    name: string, 
    /** The type of the argument (number, string, or boolean) */
    type: MachinaArgsTypeNames,
    // optional?: boolean, // NOTE: this is commented out because if the argument is optional, you can make another list without it. It makes things clearer. 
    /** The description of the argument */
    description?: string
}

export interface MachinaPermission {
    /** The names of the users */
    users?: string | string[],
    /** The names of the channels */
    channels?: string | string[],
    /** The names of the guilds */
    guilds?: string | string[],

    /** The names of the roles */
    roles?: string | string[],
    /** The permissions */
    permissions?: PermissionResolvable | PermissionResolvable[]
}


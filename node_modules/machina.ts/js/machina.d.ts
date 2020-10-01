import { Client, Message } from "discord.js";
import { MachinaPermission, MachinaFunction } from "./helper/machinaFunction";
import { MachinaResponse } from "./helper/machinaResponse";
import { MachinaMessage } from "./helper/machinaMessage";
/**
 * Discord bot wrapper
 * Calling order: Constructor, LoadCommands, Initialize, and done
 */
export declare class Machina {
    /** The bot's token */
    TOKEN: string;
    /** The bot's prefix */
    PREFIX: string;
    /** Data about the author */
    AUTHOR: {
        name: string;
        icon: string;
    };
    /** The discord.js client */
    client: Client;
    /** The classes of all the commands */
    classes: any[];
    /** The commands */
    commands: MachinaFunction[];
    /** Unique identifiers for commands */
    uuids: Set<number>;
    /**
     *
     * @param TOKEN Your bot's token (use env files)
     * @param PREFIX The bots prefix (ex: "# ")
     * @param AUTHOR Data about the author
     */
    constructor(TOKEN: string, PREFIX: string, AUTHOR?: {
        name: string;
        icon: string;
    });
    /**
     * Starts the bot and anything else that needs to be started
     * @param anything_else Anything else that needs to be ran at initialization
     * @returns {Client} The bots client
     */
    initizalize(anything_else?: Function): Promise<Client>;
    /** Creates a UUID */
    createUUID(f: MachinaFunction): any;
    /**
     * Loads the commands into the bot
     * @param commands The functions that are going to be added
     */
    loadClasses(...classes: any[]): void;
    /**
     * Adds inputted commands to the bot
     * @param commands The commands you wish to add as an array
     */
    loadCommands(...commands: MachinaFunction[]): void;
    /**
     * Returns true if the author of the message has the perms that were passed in
     * @param permission The permission handler to check
     * @param allow if you are checking allow
     * @param msg message so perms can be checked
     */
    static matchesPermissions(permissions: MachinaPermission, allow: boolean, msg: Message): MachinaResponse<boolean>;
    /**
     * Returns if the user is permitted to use a command
     * @param member the user that needs to be found
     * @param command the command in question
     */
    static isAuthorized(msg: Message, command: MachinaFunction): MachinaResponse<boolean>;
    /**
     * Takes a message and returns the list of commands that it can call
     * @param msg Message that is being evaluted
     * @param checkPrefix should it check for the given prefix of the bot (false if you want custom prefixes)
     * @param check a function that returns true or null for a pass. A fail will exit this function, a pass will continue.
     */
    evaluateMsg(msg: Message, checkPrefix?: boolean, check?: (Message: any) => boolean): MachinaResponse<MachinaFunction | MachinaFunction[]>;
    /**
     * Gets the arguments out of the content
     * @param content The content of the message in which you want to extract the
     * @param separator
     */
    static getArgs: (content?: string, separator?: string) => string[];
    /** Function to call if you have multiple command options */
    static multipleCommands: (msg: Message, commands: MachinaFunction[]) => Promise<MachinaMessage | Message>;
    /** Function to call if you have no command options*/
    static noCommands: (msg: Message, command: string) => Promise<MachinaMessage | Message>;
    /** Fixes sub commands */
    static subCommandMiddleware: (content: string, seperator?: string, index?: number) => string;
}

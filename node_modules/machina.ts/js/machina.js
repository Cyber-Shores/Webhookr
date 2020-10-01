"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Machina = void 0;
const discord_js_1 = require("discord.js");
const machinaUtility_1 = require("./helper/machinaUtility");
const machinaMessage_1 = require("./helper/machinaMessage");
const word_wrap_1 = __importDefault(require("word-wrap"));
// TODO ADD UNLOADING
/**
 * Discord bot wrapper
 * Calling order: Constructor, LoadCommands, Initialize, and done
 */
class Machina {
    /**
     *
     * @param TOKEN Your bot's token (use env files)
     * @param PREFIX The bots prefix (ex: "# ")
     * @param AUTHOR Data about the author
     */
    constructor(TOKEN, PREFIX, AUTHOR) {
        /** The discord.js client */
        this.client = new discord_js_1.Client();
        /** The classes of all the commands */
        this.classes = [];
        /** The commands */
        this.commands = [];
        /** Unique identifiers for commands */
        this.uuids = new Set();
        this.TOKEN = TOKEN;
        this.PREFIX = PREFIX;
        this.AUTHOR = AUTHOR;
        globalThis.PREFIX = this.PREFIX;
        globalThis.commands = new Proxy(this.commands, { get: (target, prop) => target[prop] });
    }
    /**
     * Starts the bot and anything else that needs to be started
     * @param anything_else Anything else that needs to be ran at initialization
     * @returns {Client} The bots client
     */
    async initizalize(anything_else) {
        console.log("Machina.initialize, Starting bot");
        if (anything_else instanceof Function)
            anything_else();
        await this.client.login(this.TOKEN);
        console.log("Bot started!", this.uuids);
        return this.client;
    }
    /** Creates a UUID */
    createUUID(f) {
        // console.log(this)
        if (f.containsUUID)
            return;
        let uuid = Math.floor(Math.random() * 1000 + 1);
        if (this.uuids.has(uuid))
            return this.createUUID(f);
        f.monikers = [...machinaUtility_1.arrify(f.monikers), uuid.toString()];
        f.containsUUID = true;
        this.uuids.add(uuid);
    }
    /**
     * Loads the commands into the bot
     * @param commands The functions that are going to be added
     */
    loadClasses(...classes) {
        const allClasses = classes.flat().map(c => Object.values(c)).flat(2);
        const flatClasses = [...new Set(allClasses)];
        const allCommands = flatClasses.map(fC => Object.values(fC)).flat(2);
        const flatCommands = [...new Set(allCommands)];
        if (allClasses.length > flatClasses.length)
            console.error("notice: you are probably loading the same class multiple times");
        if (allCommands.length > flatClasses.length)
            console.error("notice: your class(es) have the same command more than once");
        flatClasses.forEach((fClass) => this.classes.includes(fClass) ? console.error((fClass === null || fClass === void 0 ? void 0 : fClass.name) + " is already added") : this.classes.push(fClass));
        flatCommands.forEach(fCommand => this.commands.includes(fCommand) ? console.error(fCommand.name + " is already added") : this.commands.push(fCommand));
        flatCommands.forEach(this.createUUID.bind(this));
    }
    /**
     * Adds inputted commands to the bot
     * @param commands The commands you wish to add as an array
     */
    loadCommands(...commands) {
        const flatCommands = [...new Set(commands)];
        flatCommands.forEach(fCommand => this.commands.includes(fCommand) ? console.error(fCommand.name + " is already added") : this.commands.push(fCommand));
        flatCommands.forEach(this.createUUID.bind(this));
    }
    /**
     * Returns true if the author of the message has the perms that were passed in
     * @param permission The permission handler to check
     * @param allow if you are checking allow
     * @param msg message so perms can be checked
     */
    static matchesPermissions(permissions, allow = true, msg) {
        var _a;
        if (permissions == undefined)
            return { value: false, reason: "permission is undefined" };
        // console.log(permissions)
        const user = msg.author;
        const member = msg.member;
        const userPermissions = msg === null || msg === void 0 ? void 0 : msg.member.permissionsIn(msg.channel);
        let returning = { value: true };
        let updateReturning = (value, reason, extra) => { returning.value = value; returning.reason = (returning.reason || "") + reason; returning.extra = returning.extra || extra; };
        let not = (thing) => allow ? !thing : thing;
        if ((permissions === null || permissions === void 0 ? void 0 : permissions.users) && not(machinaUtility_1.arrify(permissions.users).includes(user.username)))
            updateReturning(false, "user, ");
        if (((permissions === null || permissions === void 0 ? void 0 : permissions.channels) && msg.channel.type == "text") && not(machinaUtility_1.arrify(permissions.channels).includes(msg.channel.name)))
            updateReturning(false, "channel, ");
        if (((permissions === null || permissions === void 0 ? void 0 : permissions.guilds) && msg.guild) && not(machinaUtility_1.arrify(permissions.guilds).includes(msg.guild.name)))
            updateReturning(false, "guild, ");
        if (((permissions === null || permissions === void 0 ? void 0 : permissions.roles) && msg.channel.type == "text") && !not(member.roles.cache.array().some(r => permissions.roles.includes(r.name))))
            updateReturning(false, "roles, ");
        if (((permissions === null || permissions === void 0 ? void 0 : permissions.permissions) && msg.channel.type == "text") && not(userPermissions.toArray().some(_ => machinaUtility_1.arrify(permissions.permissions).includes(_))))
            updateReturning(false, "permissions, ");
        if ((_a = returning.reason) === null || _a === void 0 ? void 0 : _a.includes(", "))
            returning.reason = returning.reason.substr(0, returning.reason.length - 2);
        return returning;
    }
    /**
     * Returns if the user is permitted to use a command
     * @param member the user that needs to be found
     * @param command the command in question
     */
    static isAuthorized(msg, command) {
        var _a, _b;
        let nallow = [];
        let ydisallow = [];
        if (!command.permissions)
            return { value: true, reason: "no permissions required" };
        if (((_a = command === null || command === void 0 ? void 0 : command.permissions) === null || _a === void 0 ? void 0 : _a.disallow) && !machinaUtility_1.arrify(command.permissions.disallow).some(dP => { let p = Machina.matchesPermissions(dP, false, msg); ydisallow.push(p.reason); return p.value; }))
            return { value: false, reason: "blacklisted", extra: ydisallow.sort((a, b) => a.length - b.length).pop() };
        if (((_b = command === null || command === void 0 ? void 0 : command.permissions) === null || _b === void 0 ? void 0 : _b.allow) && !machinaUtility_1.arrify(command.permissions.allow).some(dP => { let p = Machina.matchesPermissions(dP, true, msg); nallow.push(p.reason); return p.value; }))
            return { value: false, reason: "not whitelisted", extra: nallow.sort((a, b) => a.length - b.length).pop() };
        return { value: true, reason: "passed authorization" };
    }
    /**
     * Takes a message and returns the list of commands that it can call
     * @param msg Message that is being evaluted
     * @param checkPrefix should it check for the given prefix of the bot (false if you want custom prefixes)
     * @param check a function that returns true or null for a pass. A fail will exit this function, a pass will continue.
     */
    evaluateMsg(msg, checkPrefix = true, check) {
        if (msg.author.username == this.client.user.username)
            return { value: null, reason: "msg author is the same as bot" };
        if (checkPrefix && !msg.content.includes(this.PREFIX))
            return { value: null, reason: "msg does not include the set prefix" };
        if (checkPrefix && !msg.content.startsWith(this.PREFIX))
            return { value: null, reason: "msg does not start with correct prefix" };
        if (check && typeof check == "function") {
            let c = check(msg);
            if (typeof check == "undefined" || c === false)
                return { value: undefined, reason: "didnt pass given check", extra: check };
        }
        const content = Machina.subCommandMiddleware(msg.content.substring(this.PREFIX.length));
        let reasons = [];
        let commands = this.commands.filter(mF => mF.monikers.includes(content.split(" ")[0]));
        let available = commands.filter(c => { let r = Machina.isAuthorized(msg, c); if (!r.value)
            reasons.push(r.extra); return r.value; });
        let previousAvailable = available;
        available.filter(mF => { let y = !mF.selfPermissions || msg.guild.me.permissionsIn(msg.channel).has(mF.selfPermissions); if (!y)
            reasons.push("bot doesnt have permission"); return y; });
        // console.log(content, commands, available)
        if (commands.length <= 0)
            return { value: undefined, reason: "no commands available", extra: content };
        else if (available.length <= 0 && reasons[reasons.length - 1] == "bot doesnt have permission")
            return { value: undefined, reason: "bot permission check failed", extra: previousAvailable[0].selfPermissions };
        else if (available.length <= 0)
            return { value: undefined, reason: "permission check failed", extra: reasons.sort((a, b) => a.length - b.length).pop() }; // sorry, you dont have permissions: here is the longest log 
        else if (available.length == 1)
            return { value: available[0], reason: "permission check passed" };
        else
            return { value: available, reason: "permission check passed multiple" };
    }
}
exports.Machina = Machina;
/**
 * Gets the arguments out of the content
 * @param content The content of the message in which you want to extract the
 * @param separator
 */
Machina.getArgs = (content = "", separator = " ") => (content.substring(0, globalThis.PREFIX.length) == globalThis.PREFIX ? content.substring(globalThis.PREFIX.length) : content).split(" ").filter((v, i) => i > 0).join(" ").split(separator);
/** Function to call if you have multiple command options */
Machina.multipleCommands = (msg, commands) => new machinaMessage_1.MachinaMessage({ title: "Multiple Commands Available", description: word_wrap_1.default("Your query matches mutiple commands. Please use another moniker of the command, or use the number uuid. Listed below are the matched commands and their monikers:"), fields: machinaUtility_1.arrify(commands).map((v, i) => ({ name: "Command #" + (i + 1), value: machinaUtility_1.arrify(v.monikers).join(", ") })) }, msg).error();
/** Function to call if you have no command options*/
Machina.noCommands = (msg, command) => new machinaMessage_1.MachinaMessage({ title: "No Commands Found", description: `Command ${command} was not found. Make sure you spelled it correctly and try again.` }, msg).error();
/** Fixes sub commands */
Machina.subCommandMiddleware = (content, seperator = " ", index = 0) => content.split(" ").map((v, i, a) => v.includes(":") && i == index ? "" + v.replace(":", " ").replace(/:/g, seperator) + (!a[i + 1].includes(":") ? seperator == " | " ? " |" : "" : "") : v).join(" "); // CHANGE THE ":" TO CHANGE THE SUBCOMMAND SYMBOL

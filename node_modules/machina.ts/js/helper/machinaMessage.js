"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachinaMessage = void 0;
const discord_js_1 = require("discord.js");
class MachinaMessage {
    /**
     * Creates a MachinaMessage!
     * @param data The message data
     * @param msg The user's sent message
     * @param useDefault Should the message use default settings like color is the same as the users, etc.
     * @param customDefault A function that returns data that will be used as the default rather than the Machina default
     */
    constructor(data, msg, useDefault = true, customDefault) {
        /** Default Embed Options */
        this.default = () => { var _a; return ({ color: ((_a = this.msg) === null || _a === void 0 ? void 0 : _a.member.displayHexColor) || "#000000", timestamp: new Date(), footer: { text: (this.msg.member.nickname || this.msg.author.username) + " • " + this.msg.cleanContent } }); };
        /**
         * Sends a message to the channel or the message's channel with the data from current
         * @param channel The text channel or dm channel you want to send the message to
         */
        this.send = async (channel) => { this.sent = await (channel || this.msg.channel).send(this.current); return this; };
        /**
         * Edits the sent message with the data from current
         */
        this.edit = async () => { this.sent = await (this.sent ? this.sent.edit(this.current) : (await this.send(this.msg.channel)).sent); return this; };
        /**
         * Resets (edits) the sent message with the data from original (the data what this was constructed)
         */
        this.reset = async () => { this.sent = await this.sent.edit(this.original); return this; };
        this.updateValue = (name, data, keepOriginal = false) => this[name] = keepOriginal ? new discord_js_1.MessageEmbed(Object.assign(Object.assign({}, this[name]), data)) : new discord_js_1.MessageEmbed(data);
        /**
         * Edits the original variable, and updates it to the data sent (keepOriginal decideds if it keeps original)
         * @param data A MessageEmbed or MessageEmbedOptions
         * @param keepOriginal Should the message keep the original data and edit only the fields that are edited, or should the message edit all fields and only have the new data
         */
        this.editOriginal = (data, keepOriginal = true) => { this.updateValue("original", data, keepOriginal); return this; };
        /**
         * Edits the current variable, and edits with the data sent (keepOriginal decideds if it keeps original)
         * @param data A MessageEmbed or MessageEmbedOptions
         * @param keepOriginal Should the message keep the original current data and edit only the fields that are edited, or should the message edit all fields and only have the new data
         */
        this.editCurrent = (data, keepOriginal = true) => { this.updateValue("current", data, keepOriginal); return this; };
        /**
         * Turns the message color into red
         * @param timeout If a timeout is there, then it deletes the mesasge after a set amount of time
         */
        this.error = async (timeout) => { this.editCurrent({ color: "#ff0000" }, true); await this.edit(); if (timeout) {
            return this.sent.delete({ timeout });
        }
        else
            return this; };
        this.msg = msg;
        this.current = useDefault ? new discord_js_1.MessageEmbed(Object.assign(Object.assign({}, (customDefault || this.default)(this.msg)), data)) : new discord_js_1.MessageEmbed(data);
    }
}
exports.MachinaMessage = MachinaMessage;

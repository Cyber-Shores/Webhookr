import { MessageEmbed, MessageEmbedOptions, Message, TextChannel, DMChannel } from "discord.js";

export class MachinaMessage {
    /** The orginal message object, stays the same when current is changed */
    original: MEO
    /** The discord message object of the user's message */
    msg: Message

    /** The current message object, changes when edited */
    current: MEO
    /** The sent message as a Discord.js Message */
    sent: Message

    /**
     * Creates a MachinaMessage!
     * @param data The message data
     * @param msg The user's sent message
     * @param useDefault Should the message use default settings like color is the same as the users, etc.
     * @param customDefault A function that returns data that will be used as the default rather than the Machina default
     */
    constructor(data: MEO, msg: Message, useDefault = true, customDefault?: (msg: Message) => MEO) {
        this.msg = msg
        this.current = useDefault ? new MessageEmbed({...(customDefault || this.default)(this.msg), ...data}): new MessageEmbed(data)
    }

    /** Default Embed Options */
    default: () => MessageEmbedOptions = () => ({color: this.msg?.member.displayHexColor || "#000000", timestamp: new Date(), footer: {text: (this.msg.member.nickname || this.msg.author.username) + " • " + this.msg.cleanContent}})
    
    /**
     * Sends a message to the channel or the message's channel with the data from current
     * @param channel The text channel or dm channel you want to send the message to
     */
    send = async (channel?: TextChannel | DMChannel) => {this.sent = await (channel || this.msg.channel).send(this.current); return this}
    /**
     * Edits the sent message with the data from current
     */
    edit = async () => {this.sent = await (this.sent ? this.sent.edit(this.current) : (await this.send(this.msg.channel as TextChannel | DMChannel)).sent); return this}
    /**
     * Resets (edits) the sent message with the data from original (the data what this was constructed)
     */
    reset = async () => {this.sent = await this.sent.edit(this.original); return this}
    
    private updateValue = (name: string, data: MEO, keepOriginal = false) => this[name] = keepOriginal ? new MessageEmbed({...this[name], ...data}) : new MessageEmbed(data)
    /**
     * Edits the original variable, and updates it to the data sent (keepOriginal decideds if it keeps original)
     * @param data A MessageEmbed or MessageEmbedOptions
     * @param keepOriginal Should the message keep the original data and edit only the fields that are edited, or should the message edit all fields and only have the new data
     */
    editOriginal = (data: MEO, keepOriginal = true) => {this.updateValue("original", data, keepOriginal); return this}
    /**
     * Edits the current variable, and edits with the data sent (keepOriginal decideds if it keeps original)
     * @param data A MessageEmbed or MessageEmbedOptions
     * @param keepOriginal Should the message keep the original current data and edit only the fields that are edited, or should the message edit all fields and only have the new data
     */
    editCurrent = (data: MEO, keepOriginal = true) => {this.updateValue("current", data, keepOriginal); return this}

    /**
     * Turns the message color into red
     * @param timeout If a timeout is there, then it deletes the mesasge after a set amount of time
     */
    error = async (timeout?: number) => {this.editCurrent({color: "#ff0000"}, true); await this.edit(); if(timeout) {return this.sent.delete({timeout})} else return this}
}

export type MEO = MessageEmbed | MessageEmbedOptions
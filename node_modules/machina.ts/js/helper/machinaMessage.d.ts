import { MessageEmbed, MessageEmbedOptions, Message, TextChannel, DMChannel } from "discord.js";
export declare class MachinaMessage {
    /** The orginal message object, stays the same when current is changed */
    original: MEO;
    /** The discord message object of the user's message */
    msg: Message;
    /** The current message object, changes when edited */
    current: MEO;
    /** The sent message as a Discord.js Message */
    sent: Message;
    /**
     * Creates a MachinaMessage!
     * @param data The message data
     * @param msg The user's sent message
     * @param useDefault Should the message use default settings like color is the same as the users, etc.
     * @param customDefault A function that returns data that will be used as the default rather than the Machina default
     */
    constructor(data: MEO, msg: Message, useDefault?: boolean, customDefault?: (msg: Message) => MEO);
    /** Default Embed Options */
    default: () => MessageEmbedOptions;
    /**
     * Sends a message to the channel or the message's channel with the data from current
     * @param channel The text channel or dm channel you want to send the message to
     */
    send: (channel?: TextChannel | DMChannel) => Promise<this>;
    /**
     * Edits the sent message with the data from current
     */
    edit: () => Promise<this>;
    /**
     * Resets (edits) the sent message with the data from original (the data what this was constructed)
     */
    reset: () => Promise<this>;
    private updateValue;
    /**
     * Edits the original variable, and updates it to the data sent (keepOriginal decideds if it keeps original)
     * @param data A MessageEmbed or MessageEmbedOptions
     * @param keepOriginal Should the message keep the original data and edit only the fields that are edited, or should the message edit all fields and only have the new data
     */
    editOriginal: (data: MEO, keepOriginal?: boolean) => this;
    /**
     * Edits the current variable, and edits with the data sent (keepOriginal decideds if it keeps original)
     * @param data A MessageEmbed or MessageEmbedOptions
     * @param keepOriginal Should the message keep the original current data and edit only the fields that are edited, or should the message edit all fields and only have the new data
     */
    editCurrent: (data: MEO, keepOriginal?: boolean) => this;
    /**
     * Turns the message color into red
     * @param timeout If a timeout is there, then it deletes the mesasge after a set amount of time
     */
    error: (timeout?: number) => Promise<this | Message>;
}
export declare type MEO = MessageEmbed | MessageEmbedOptions;

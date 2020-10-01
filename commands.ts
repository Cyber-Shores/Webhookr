import { Collection, TextChannel, MessageEmbed, Message } from 'discord.js';
import { machinaDecoratorInfo, MachinaFunction, MachinaFunctionParameters, MachinaMessage } from "machina.ts";

export const embed: MachinaFunction = machinaDecoratorInfo
({monikers: ["add"], description: "adds a webhook to users inventory"})
("webhook-commands", "add", async (params: MachinaFunctionParameters) => {
    console.log('ran')
});
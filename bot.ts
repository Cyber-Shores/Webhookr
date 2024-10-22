require('dotenv').config();
import { Machina, extractClasses, arrify, MachinaFunction, MachinaMessage } from "machina.ts";
const Bot = new Machina(process.env.TOKEN, "wb ");
import { GuildMember, Message, MessageEmbed, TextChannel } from 'discord.js';
import fs = require('fs');
const mongoose = require('mongoose');
const Guild = require('./models/Guild');
const Markov = require('js-markov');
let markov = new Markov();
mongoose.connect(process.env.MONGOLINK, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
});
Bot.loadCommands(...(Object.values(require("./commands.ts")) as MachinaFunction[]));
Bot.initizalize();

Bot.client.on('ready', async () => {
    try {
        let link = await Bot.client.generateInvite({ permissions: ["ADD_REACTIONS", "VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "MANAGE_WEBHOOKS", "USE_EXTERNAL_EMOJIS"]});
        console.log(`Generated bot invite link: ${link}`);
    } catch(e) {
        console.log(e.stack);
    }
        console.log('Hello World!'); 
});

Bot.client.on('message', async msg => {
    if(msg.author.bot) return;
    if(msg.channel.type === 'dm') return;
    try {
        let command = Bot.evaluateMsg(msg, false, (msg) => msg.content.startsWith(`<@!${Bot.client.user.id}>`) || msg.content.startsWith('wb '), (msg) => { return msg.content.split(' ').slice(1).join(' ').trim()} );
        if(command.reason == "no commands available") {
            let hook = (await msg.guild.fetchWebhooks()).find(w => w.owner == Bot.client.user);
            if(!hook){
                hook = await msg.channel.createWebhook('Webhookr Proxy Hook');
            }
            let args = command.extra.split(' ');
            if(args[0] == 'stop') return;
            let user: GuildMember;
            if(args[0] == 'wb')
                user = msg.member;
            else
                user = msg.mentions.members.first() || (!args[0] ? null : (await msg.guild.members.fetch({query: args[0], limit: 1})).array()[0]);
            if(user == undefined)
                return msg.channel.send("```Could not find that user```");
            let req = await Guild.findOne({ id: user.user.id });
            if(req != null && !req.mimickable) return msg.channel.send(`\`\`\`User "${user.user.username}" has mimicking turned off\`\`\``)
            if(args[1] == undefined && msg.attachments.size == 0) {
                let msgArr = msg.channel.messages.cache.filter(m => m.author == user.user && !m.content.startsWith("wb")).array();
                let punctuation = ['.','...','?','!'][Math.floor(Math.random()*4)];
                let sentenceArr = [];
                msgArr.forEach(m => sentenceArr.push(m.content));
                markov.clearState();
                setTimeout(() => {}, 1000)
                markov.addStates(sentenceArr);
                markov.train();
                await hook.edit({ channel: msg.channel.id }).then(w => w.send((markov.generateRandom(100) || "Hello")+punctuation, { username: user.nickname || user.user.username, avatarURL: user.user.displayAvatarURL(), files: msg.attachments.array() }));
            
            }
            else
                await hook.edit({ channel: msg.channel.id }).then(w => w.send(args.slice(1).join(' ').trim(), { username: user.nickname || user.user.username, avatarURL: user.user.displayAvatarURL(), files: msg.attachments.array() }));
            msg.delete();
        }
        else if(command.reason == "permission check passed multiple")
            return Machina.multipleCommands(msg, arrify(command.value))
    
        if(command.value) {
            let hook = (await msg.guild.fetchWebhooks()).find(w => w.owner == Bot.client.user);
            if(!hook){
                msg.channel.createWebhook('Webhookr Proxy Hook');
            }
            arrify(command.value).forEach(f => f(Bot, msg));
        }
    }
    catch(e) {
        console.log(e.stack);
    }
})
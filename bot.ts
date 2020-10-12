import { Machina, extractClasses, arrify, MachinaFunction, MachinaMessage } from "machina.ts";
const Bot = new Machina("NzYxMzQwMzk2NjM4ODMwNjI0.X3ZLfw.-50Ch3C_A0sbp1qyoE1C1U2mRFo", "wb ");
import { GuildMember, Message, MessageEmbed, TextChannel } from 'discord.js';
import fs = require('fs');
const mongoose = require('mongoose');
const Guild = require('./models/Guild');
const Markov = require('js-markov');
let markov = new Markov();
// fs.readdir('./cmd/', (err, files) => {
//     if(err) console.error(err);

//     const tsfiles = files.filter(f => f.split('.').pop() === 'ts');
//     if(tsfiles.length <= 0) {
//         console.log(`No commands to load in ./cmd/!`);
//         return;
//     }

//     console.log(`Loading ${tsfiles.length} commands from ./cmd/!`);

//     tsfiles.forEach((f, i) => {
//         const props = require(`./cmd/${f}`);
//         console.log(`${i + 1} ${f}!`);
//         Bot.loadCommands(...(Object.values(props) as MachinaFunction[]));
//     });
// });

mongoose.connect("mongodb+srv://admin:12KuxLmPkYlptxj3@cluster0.h4bxo.mongodb.net/webhookrdb?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
});
Bot.loadCommands(...(Object.values(require("./commands.ts")) as MachinaFunction[]));
Bot.initizalize();

Bot.client.on('ready', async () => {
    try {
        let link = await Bot.client.generateInvite(["ADMINISTRATOR"]);
        console.log(`Generated bot invite link: ${link}`);
    } catch(e) {
        console.log(e.stack);
    }
        console.log('Hello World!');

    
});

Bot.client.on('message', async msg => {
    if(msg.author.bot) return;
    if(msg.channel.type === 'dm') return;
    // if(!msg.content.startsWith("wb ")) markov.addStates(msg.content);
    try {
        let command = Bot.evaluateMsg(msg);
        if(command.reason == "no commands available") {
            // console.log(`Extras: ${command.extra}`)
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
                user = msg.mentions.members.first() || (!args[0] ? null : (await msg.guild.members.fetch({query: args[0], limit: 1})).array()[0]) || msg.member;
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
import { Machina, extractClasses, arrify, MachinaFunction, MachinaMessage } from "machina.ts";
const Bot = new Machina("NzYxMzQwMzk2NjM4ODMwNjI0.X3ZLfw.-50Ch3C_A0sbp1qyoE1C1U2mRFo", "wb ");
import { Message, MessageEmbed, TextChannel } from 'discord.js';
import fs = require('fs');

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
    try {
        let command = Bot.evaluateMsg(msg);
        if(command.reason == "no commands available") {
            msg.delete();
            console.log(`Extras: ${command.extra}`)
            let hook = (await msg.guild.fetchWebhooks()).find(w => w.owner == Bot.client.user);
            if(!hook){
                hook = await msg.channel.createWebhook('Webhookr Proxy Hook');
            }
            let args = command.extra.split(' ');
            let user = msg.mentions.members.first() || (!args[0] ? null : (await msg.guild.members.fetch({query: args[0], limit: 1})).array()[0]) || msg.member;
            if(!args[1]) {
                let msgArr = msg.channel.messages.cache.filter(m => m.author == user.user).array();
                let randMsg = msgArr[Math.floor(Math.random()*msgArr.length)]
                hook.edit({ channel: msg.channel.id }).then(w => w.send(randMsg, { username: user.nickname || user.user.username, avatarURL: user.user.displayAvatarURL(), files: msg.attachments.array() }));
            }
            else
                console.log(`Sent: ${args.slice(1).join(' ').trim()}`)
                hook.edit({ channel: msg.channel.id }).then(w => w.send(args.slice(1).join(' ').trim(), { username: user.nickname || user.user.username, avatarURL: user.user.displayAvatarURL(), files: msg.attachments.array() }));
            //return Machina.noCommands(msg, command.extra)
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
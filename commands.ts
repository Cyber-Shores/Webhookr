import { createHook } from 'async_hooks';
import { Collection, TextChannel, MessageEmbed, Message, MessageAttachment, BufferResolvable, ClientUser, GuildMember } from 'discord.js';
import { machinaDecoratorInfo, MachinaFunction, MachinaFunctionParameters, MachinaMessage } from "machina.ts";
import { Document } from 'mongoose';
import { listenerCount } from 'process';
const Persona = module.require('./models/Persona');

function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
}



export const inventory: MachinaFunction = machinaDecoratorInfo
({monikers: ["i"], description: "displays a users webhook inventory in a menu", subs: 
    [
        machinaDecoratorInfo({monikers: ["remove"], description: "removes a webhook from users inventory"})
        ("webhook-commands", "remove", async (params: MachinaFunctionParameters) => {
            let req = await Persona.findOne({ id: params.msg.author.id, name: params.args[0] });
            if(!req) {
                return params.msg.channel.send("```Could not find that persona.```")
            }
            Persona.deleteOne({ id: params.msg.author.id, name: params.args[0] }, function (err: any) {
                if(err) params.msg.channel.send("```Oops! Error occured persona could not be deleted.```");
                return params.msg.channel.send("```Successfuly deleted!```")
            })
        }),
        machinaDecoratorInfo({monikers: ["add"], description: "adds a webhook to users inventory"})
        ("webhook-commands", "add", async (params: MachinaFunctionParameters) => {
            // console.log(`DEBUG - args: ${params.args}`);
            // console.log(`DEBUG - attach: ${params.msg.attachments.array()[0]}`);
            let req = await Persona.findOne({ id: params.msg.author.id, name: params.args[0] });
            if(req) {
                return params.msg.channel.send("```Oops! this Persona already exists!```")
            }
            let doc: Document;
            if(params.msg.attachments.size != 0) {
                doc = new Persona({ id: params.msg.author.id, name: params.args[0], image: params.msg.attachments.array()[0].url });
                await doc.save();
            } else if(params.args[1] != undefined && validURL(params.args[1])) {
                doc = new Persona({ id: params.msg.author.id, name: params.args[0], image: params.args[1] });
                await doc.save();
            } else {
                let m = await params.msg.channel.send("```Please send the link or image that should be the profile pic for this persona```");

                await params.msg.channel.awaitMessages(m => m.author == params.msg.author && (m.attachments.size != 0 || validURL(m.content)), { max: 1, time: 60000, errors: ['time'] })
                    .then(async collected => {
                        let link: string;
                        if(collected.first().attachments.size != 0)
                            link = collected.first().attachments.array()[0].url;
                        else
                            link = collected.first().content
                        // console.log(link)
                        doc = new Persona({ id: params.msg.author.id, name: params.args[0], image: link})
                        let mNew = await m.edit("```Recieved!```");
                        await doc.save();
                        setTimeout(() => { mNew.delete() }, 5000);
                    }).catch(e => {
                        params.msg.channel.send("```No image recieved! Cancelling process...```")
                        console.log(e.stack)
                    });
            }
            if(doc != undefined) {
                // console.log(doc);
                return await params.msg.channel.send( new MessageEmbed({
                    title: 'New Persona Created!',
                    color: params.msg.member.displayHexColor,
                    fields: [
                        { name: 'Name:', value: doc.name }
                    ],
                    image: {
                        url: doc.image
                    }
                }))
            }
        }),
        machinaDecoratorInfo({monikers: ["start"], description: "begins relaying messages as a given persona"})
        ("webhook-commands", "start", async (params: MachinaFunctionParameters) => {
            if(params.args[0] == undefined) return params.msg.channel.send("```Please specify a persona```");
            let req = await Persona.findOne({ id: params.msg.author.id, name: params.args[0] });
            if(!req) {
                return params.msg.channel.send("```Could not find the persona```")
            }
            const collector = params.msg.channel.createMessageCollector(m => m.author == params.msg.author);
            params.msg.channel.send("```The bot will now begin relaying your messages ```")
            collector.on('collect', async message => {
                if(message.content == 'wb stop') return collector.stop();
                // if(message.content.startsWith('{') && message.content.endsWith('}')) {
        
                // }
                message.delete();
                let hook = (await message.guild.fetchWebhooks()).find(w => w.owner == params.Bot.client.user);
                hook.edit({ channel: message.channel.id }).then(w => w.send(message.content, { username: req.name, avatarURL: req.image, files: message.attachments.array() }));
            });
        })
    ]
})
("webhook-commands", "inventory", async (params: MachinaFunctionParameters) => {
    if(params.args[0] == undefined) {
        let personas = []
        let req = await Persona.find({ id: params.msg.author.id })
    
        req.forEach(doc => {
            personas.push(doc.name)
        });
        let embed = new MessageEmbed({
            title: `${params.msg.author.username}'s Webhook Inventory:`,
            color: params.msg.member.displayHexColor,
            description: `Total: ${req.length}`,
        });
    
    
        personas.forEach((p, i) => {
            embed.addField(`${i+1}. `, p, true);
        });
        await params.msg.channel.send(embed);
    }else{
        let req = await Persona.findOne({ id: params.msg.author.id, name: params.args[0] });
        if(!req) {
            return params.msg.channel.send("Could not find the persona")
        }
        let hook = (await params.msg.guild.fetchWebhooks()).find(w => w.owner == params.Bot.client.user);
        params.msg.delete();
        hook.edit({ channel: params.msg.channel.id }).then(w => w.send(params.args.slice(1, params.args.length).join(" ") || "Hello! :D", { username: req.name, avatarURL: req.image, files: params.msg.attachments.array() }));
    }
});

export const random: MachinaFunction = machinaDecoratorInfo
({monikers: ["rand", "random"], description: "mimics a random person in the server"})
("webhook-commands", "random", async (params: MachinaFunctionParameters) => {
    const user = (params.msg.guild.members.cache.random(1))[0];
    const hook = (await params.msg.guild.fetchWebhooks()).find(w => w.owner == params.Bot.client.user);
    if(params.args[0] == undefined) {
        let msgArr = params.msg.channel.messages.cache.filter(m => m.author == user.user).array();
        let randMsg = msgArr[Math.floor(Math.random()*msgArr.length)]
        hook.edit({ channel: params.msg.channel.id }).then(w => w.send(randMsg || "Hello! :D", { username: user.nickname || user.user.username, avatarURL: user.user.displayAvatarURL(), files: params.msg.attachments.array() }));
    }
    else
        hook.edit({ channel: params.msg.channel.id }).then(w => w.send(params.args.slice(1).join(' ').trim(), { username: user.nickname || user.user.username, avatarURL: user.user.displayAvatarURL(), files: params.msg.attachments.array() }));
});

// export const command: MachinaFunction = machinaDecoratorInfo
// ({monikers: ["command"], description: "N/A", subs: 
//     [
    
//     machinaDecoratorInfo({monikers: ["subcommandone"], description: "N/A"})
//     ("commands", "subcommandone", async (params: MachinaFunctionParameters) => {
//         console.log("ran subcommandone")
//     }),
//     machinaDecoratorInfo({monikers: ["subcommandtwo"], description: "N/A"})
//     ("commands", "subcommandtwo", async (params: MachinaFunctionParameters) => {
//         console.log("ran subcommandtwo")
//     })

//     ]
// })
// ("commands", "command", async (params: MachinaFunctionParameters) => {
//     console.log("ran command")
// });
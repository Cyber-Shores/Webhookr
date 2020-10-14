import { createHook } from 'async_hooks';
import { SSL_OP_EPHEMERAL_RSA } from 'constants';
import { Collection, TextChannel, MessageEmbed, Message, MessageAttachment, BufferResolvable, ClientUser, GuildMember } from 'discord.js';
import { machinaDecoratorInfo, MachinaFunction, MachinaFunctionParameters, MachinaMessage } from "machina.ts";
import { Document } from 'mongoose';
import { listenerCount } from 'process';
const Persona = module.require('./models/Persona');
const Guild = module.require('./models/Guild');

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
            if(params.args[0] == undefined) return params.msg.channel.send('```ERROR: Persona must have a name```');
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
                
                let hook = (await message.guild.fetchWebhooks()).find(w => w.owner == params.Bot.client.user);
                await hook.edit({ channel: message.channel.id }).then(w => w.send(message.content, { username: req.name, avatarURL: req.image, files: message.attachments.array() }));
                message.delete();
            });
        })
    ]
})
("webhook-commands", "inventory", async (params: MachinaFunctionParameters) => {
    if(params.args[0] == undefined) {
        const MAX = 3;
        let personas = []
        let req = await Persona.find({ id: params.msg.author.id })
    
        req.forEach(doc => {
            personas.push(doc.name)
        });
        
        let fields = [];
        personas.forEach((p,i) => {
            fields.push({ name: `${i+1}.`, value: `\`\`\`${['css','yaml','http','arm'][Math.floor(Math.random()*4)]}\n${p}\`\`\``, inline: false});
        });
        let embeds = [];
        for(let i = 0; i<=Math.floor(fields.length/MAX); i++) {
            embeds[i] = new MessageEmbed({
                title: `${params.msg.author.username}'s ${['Cool', 'Awesome', 'Epic'][Math.floor(Math.random()*3)]} Inventory:`,
                color: params.msg.member.displayHexColor,
                thumbnail: {
                    url: params.msg.author.displayAvatarURL(),
                },
                description: `Total: ${req.length}`,
                footer: {
                    text: 'Menu Running!'
                },
                image: {
                    url: "https://i.imgur.com/Y0bVdO4.jpg"
                }
            });
            embeds[i].addFields(fields.slice(i*MAX,(MAX*(i+1)) || (fields.length+i*MAX)));
        }

        setTimeout(() => {}, 1000)
        let menu = await params.msg.channel.send(embeds[0]);
        if(fields.length>10) {
            let count = 0;
            const left = '◀️';
            const right = '▶️';
            menu.react(left).then(() => menu.react(right));
            const collector = menu.createReactionCollector((reaction, user) => user == params.msg.author && (reaction.emoji.name == left || reaction.emoji.name == right), {time: 45000});
            collector.on('collect', r => {
                switch(r.emoji.name) {
                    case left:
                        if(count != 0) {
                            count--;
                            menu.edit(embeds[count]);
                        }
                        break;
                    case right:
                        if(count != embeds.length-1) {
                            count++;
                            menu.edit(embeds[count]);
                        }
                        break;
                }
                menu.reactions.removeAll().then(() => menu.react(left).then(() => menu.react(right)));
            });
            collector.on('end', () => menu.edit(menu.embeds[0].setFooter('Menu Closed!')));
            
        }
    }else{
        if(!params.args.slice(1, params.args.length).join(" ") && params.msg.attachments.size == 0) return params.msg.channel.send("```Cannot send an empty message```")
        let req = await Persona.findOne({ id: params.msg.author.id, name: params.args[0] });
        if(!req) {
            let personas = []
            await Persona.find({ id: params.msg.author.id }).then(p => p.forEach(doc => {
                personas.push(doc)
            }));
            if(!personas[(params.args[0] as number)-1]) return params.msg.channel.send("Could not find the persona");
            req = personas[(params.args[0] as number)-1];
        }
        let hook = (await params.msg.guild.fetchWebhooks()).find(w => w.owner == params.Bot.client.user);
        await hook.edit({ channel: params.msg.channel.id }).then(w => w.send(params.args.slice(1, params.args.length).join(" "), { username: req.name, avatarURL: req.image, files: params.msg.attachments.array()}));
        params.msg.delete();
    }
});

export const random: MachinaFunction = machinaDecoratorInfo
({monikers: ["rand", "random"], description: "mimics a random person in the server"})
("webhook-commands", "random", async (params: MachinaFunctionParameters) => {
    // let users = [];
    async function genUsers(mArr) {
        const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));
        let users = [];
        mArr.forEach(async m => {
            let req = await Guild.findOne({ id: m.user.id });
            if(req == null || req.mimickable) users.push(m);
        })
        await sleep(500);
        return users;   
    }
    let users = await genUsers(params.msg.guild.members.cache.array());
    // params.msg.guild.members.cache.array().forEach(async m => {

    // })
    if(users.length == 0) return params.msg.channel.send("```There are no mimicable users!```")
    let user = users[Math.floor(Math.random()*users.length)];
    const hook = (await params.msg.guild.fetchWebhooks()).find(w => w.owner == params.Bot.client.user);
    if(params.args[0] == undefined && params.msg.attachments.size == 0) {
        let msgArr = params.msg.channel.messages.cache.filter(m => m.author == user.user && !m.content.startsWith('wb')).array();
        let randMsg = msgArr[Math.floor(Math.random()*msgArr.length)]
        await hook.edit({ channel: params.msg.channel.id }).then(w => w.send(randMsg || "Hello! :D", { username: user.nickname || user.user.username, avatarURL: user.user.displayAvatarURL(), files: params.msg.attachments.array() }));
    }
    else
        await hook.edit({ channel: params.msg.channel.id }).then(w => w.send(params.args.slice(1).join(' ').trim(), { username: user.nickname || user.user.username, avatarURL: user.user.displayAvatarURL(), files: params.msg.attachments.array() }));
    params.msg.delete();
});

export const mimic: MachinaFunction = machinaDecoratorInfo
({monikers: ["mimic"], description: "allows user to set whether or not they can be mimicked"})
("webhook-commands", "mimic", async (params: MachinaFunctionParameters) => {
    let req = await Guild.findOne({ id: params.msg.author.id })
    if(params.args[0] == undefined) {
        console.log("NO ARGS");
        if(req != null){
            return params.msg.channel.send(`\`\`\`Mimickable state: ${req.mimickable}\`\`\``)
        }
        const doc = new Guild({ id: params.msg.author.id });
        await doc.save();
        return params.msg.channel.send("```Your document has been created with default values.```")
    }
    console.log(typeof params.args[0]);
    if(typeof params.args[0] != "boolean") return params.msg.channel.send('```The only two allowed inputs for preferences are "true" or "false" ```')
    var prefrence = params.args[0]
    if(req == null) {
        const doc = new Guild({ id: params.msg.author.id, mimickable: prefrence });
        await doc.save();
        return params.msg.channel.send("```Your document has been updated!```")
    }else{
        await Guild.findOneAndUpdate({ id: params.msg.author.id }, { $set: { mimickable: prefrence } }, { new: true });
        return params.msg.channel.send(`\`\`\`Prefrence updated to: ${prefrence}\`\`\``);
    }
});

export const help: MachinaFunction = machinaDecoratorInfo
({monikers: ["help"], description: "displays the commands"})
("webhook-commands", "help", async (params: MachinaFunctionParameters) => {
    // let embed = new MachinaMessage({
    //     title: "Commands:",
    //     color: params.msg.member.displayHexColor,
    //     description: 'Remove brackets "{}" when performing a command'
    //     fields: [
    //         {name: ''}
    //     ]
    // }, params.msg)
    params.msg.channel.send(`\`\`\`
    Commands and Usage:
    wb {username, mention or "wb"} {message or nothing for random}
    "wb ravenr hello! im ravenr!"
    will send a provided message (random if not provided) using a webhook with the name and pfp of a given member

    wb i
    "wb i"
    will display your inventory of Personas

    wb i add {name of new Persona} {image or link}
    "wb i add denton https://i.imgur.com/8zHiOK2.jpeg"
    will create a Persona with the name  and pfp provided. If no image/link is provided, will wait 60 seconds for you to provide one in a message

    wb i remove {name of Persona}
    "wb i remove denton"
    will remove the Persona with the provided name from your inventory

    wb i {name or number of Persona} {message}
    "wb i denton hello!!"
    will send your message as the chosen persona

    wb random {message or nothing for random}
    "wb random hahahahah im so cool"
    will pick a random person in the server and send a given message as them
    
    wb start {Persona to be used}
    "wb start denton"
    whenever you send a message in this channel, the bot will delete it and resend it as the provided Persona
    to stop, type "wb stop"

    wb mimic {true or false or nothing to check status}
    "wb mimic false"
    set whether or not you want others to be able to mimic you
    
    wb help
    "wb help"
    sends this help menu
    \`\`\``)
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
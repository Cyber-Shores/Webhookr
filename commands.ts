import { createHook } from 'async_hooks';
import { SSL_OP_EPHEMERAL_RSA } from 'constants';
import { Collection, TextChannel, MessageEmbed, Message, MessageAttachment, BufferResolvable, ClientUser, GuildMember } from 'discord.js';
import { checkArgsAgainstCriteria, machinaDecoratorInfo, MachinaFunction, MachinaFunctionParameters, MachinaMessage } from "machina.ts";
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
({monikers: ["i","inv", "inventory"], description: "displays a users webhook inventory in a menu", subs: 
    [
        machinaDecoratorInfo({monikers: ["remove", "r"], description: "removes a webhook from users inventory"})
        ("webhook-commands", "remove", async (params: MachinaFunctionParameters) => {
            let req = await Persona.findOne({ id: params.msg.author.id, name: params.args.join(' ') });
            if(!req) {
                return params.msg.channel.send("```Could not find that persona.```")
            }
            Persona.deleteOne({ id: params.msg.author.id, name: params.args.join(' ') }, function (err: any) {
                if(err) params.msg.channel.send("```Oops! Error occured persona could not be deleted.```");
                return params.msg.channel.send("```Successfuly deleted!```")
            })
        }),
        machinaDecoratorInfo({monikers: ["add"], description: "adds a webhook to users inventory"})
        ("webhook-commands", "add", async (params: MachinaFunctionParameters) => {
            let personaList = await Persona.find({ id: params.msg.author.id })
            let prem = await Guild.findOne({ id: params.msg.author.id })
            if(personaList.length >= 3 && !prem.premium) return params.msg.channel.send('```oops, sorry, you need premium in order to store more than 3 personas!```', { files: [ "https://i.imgur.com/Y0bVdO4.jpg" ] });
            if(params.args[0] == undefined) return params.msg.channel.send('```ERROR: Persona must have a name```');
            let req = await Persona.findOne({ id: params.msg.author.id, name: params.args.join(' ') });
            if(req) {
                return params.msg.channel.send("```Oops! this Persona already exists!```")
            }
            let doc: { save: () => any; name: any; image: any; };
            if(params.args.join(' ').length > 32) return params.msg.channel.send('```oops! that name is too long, personas ```');
            if(params.msg.attachments.size != 0) {
                doc = new Persona({ id: params.msg.author.id, name: params.args.join(' '), image: params.msg.attachments.array()[0].url });
                await doc.save();
            } else if (validURL(params.args[params.args.length-1])) {
                const url = params.args.pop();
                doc = new Persona({ id: params.msg.author.id, name: params.args.join(' '), image: url });
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
                        doc = new Persona({ id: params.msg.author.id, name: params.args.join(' '), image: link})
                        let mNew = await m.edit("```Recieved!```");
                        await doc.save();
                        setTimeout(() => { mNew.delete() }, 5000);
                    }).catch(e => {
                        params.msg.channel.send("```No image recieved! Cancelling process...```")
                        console.log(e.stack)
                    });
            }
            if(doc != undefined) {
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
        machinaDecoratorInfo({monikers: ["start", "relay"], description: "begins relaying messages as a given persona"})
        ("webhook-commands", "start", async (params: MachinaFunctionParameters) => {
            if(params.args[0] == undefined) return params.msg.channel.send("```Please specify a persona```");
            let req = await Persona.findOne({ id: params.msg.author.id, name: params.args.join(' ') });
            if(!req) {
                let personas = []
                await Persona.find({ id: params.msg.author.id }).then(p => p.forEach(doc => {
                    personas.push(doc)
                }));
                if(!personas[(params.args[0] as number)-1]) return params.msg.channel.send("Could not find the persona");
                req = personas[(params.args[0] as number)-1];
            }
            const collector = params.msg.channel.createMessageCollector(m => m.author == params.msg.author);
            let m = await params.msg.channel.send("```The bot will now begin relaying your messages ```")
            setTimeout(() => m.delete(), 2000)
            params.msg.delete();
            let count = 0;
            let myTimer: NodeJS.Timeout;
            collector.on('collect', async message => {
                clearTimeout(myTimer);
                count++;
                myTimer = setTimeout(() => count = 0, 3000)
                if(count>4 || message.content.startsWith('wb ')) return console.log(`Ignored "${message.content}"`);
                if(message.content == 'stop')   return collector.stop();
                let hook = (await message.guild.fetchWebhooks()).find(w => w.owner == params.Bot.client.user);
                await hook.edit({ channel: message.channel.id }).then(w => w.send(message.content, { username: req.name, avatarURL: req.image, files: message.attachments.array() }));
                message.delete();
            });
        })
    ]
})
("webhook-commands", "inventory", async (params: MachinaFunctionParameters) => {
    if(params.args[0] == undefined) {

        let prem = await Guild.findOne({ id: params.msg.author.id })
        if(prem == null) {
            let m = await params.msg.channel.send("```Creating document...```");
            const doc = new Guild({ id: params.msg.author.id });
            await doc.save();
            m.delete();
            prem = await Guild.findOne({ id: params.msg.author.id })
        }
        let MAX = 3;
        let inline = false;
        let image = "https://i.imgur.com/Y0bVdO4.jpg";
        if(prem.premium) {
            MAX = 9;
            inline = true;
            image = null;
        }
        let personas = []
        let req = await Persona.find({ id: params.msg.author.id })
    
        req.forEach(doc => {
            personas.push(doc.name)
        });
        if(personas.length == 0) return params.msg.channel.send('```Oops! looks like you don\'t have any Personas in your inventory!```');
        
        let fields = [];
        personas.forEach((p,i) => {
            fields.push({ name: `${i+1}.`, value: `\`\`\`${['css','yaml','http','arm'][Math.floor(Math.random()*4)]}\n${p}\`\`\``, inline: inline});
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
                    url: image
                }
            });
            embeds[i].addFields(fields.slice(i*MAX,(MAX*(i+1)) || (fields.length+i*MAX)));
        }
        if(fields.length%MAX == 0) embeds.pop();
        setTimeout(() => {}, 1000)
        let menu = await params.msg.channel.send(embeds[0]);
        if(fields.length>MAX) {
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
        if(params.args.indexOf("-m") == -1 && params.msg.attachments.size == 0) return params.msg.channel.send('```Cannot send an empty message, please include a "-m" flag with a message following it or attach an image ```')

        const flagIndex = params.args.indexOf('-m');
        if(flagIndex == -1) {
            let req = await Persona.findOne({ id: params.msg.author.id, name: params.args.join(' ') });
            if(!req) {
                let personas = []
                await Persona.find({ id: params.msg.author.id }).then(p => p.forEach(doc => {
                    personas.push(doc)
                }));
                if(!personas[(params.args[0] as number)-1]) return params.msg.channel.send("Could not find the persona");
                req = personas[(params.args[0] as number)-1];
            }
            let hook = (await params.msg.guild.fetchWebhooks()).find(w => w.owner == params.Bot.client.user);
            await hook.edit({ channel: params.msg.channel.id }).then(w => w.send({ username: req.name, avatarURL: req.image, files: params.msg.attachments.array()}));
            params.msg.delete();
        } else {
            let req = await Persona.findOne({ id: params.msg.author.id, name: params.args.slice(0,flagIndex).join(' ') });
            if(!req) {
                let personas = []
                await Persona.find({ id: params.msg.author.id }).then(p => p.forEach(doc => {
                    personas.push(doc)
                }));
                if(!personas[(params.args[0] as number)-1]) return params.msg.channel.send("Could not find the persona");
                req = personas[(params.args[0] as number)-1];
            }
            let hook = (await params.msg.guild.fetchWebhooks()).find(w => w.owner == params.Bot.client.user);
            await hook.edit({ channel: params.msg.channel.id }).then(w => w.send(params.args.slice(flagIndex+1, params.args.length).join(" ") || null, { username: req.name, avatarURL: req.image, files: params.msg.attachments.array()}));
            params.msg.delete();
        }

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
        await hook.edit({ channel: params.msg.channel.id }).then(w => w.send(params.args.slice(0).join(' ').trim(), { username: user.nickname || user.user.username, avatarURL: user.user.displayAvatarURL(), files: params.msg.attachments.array() }));
    params.msg.delete();
});

export const mimic: MachinaFunction = machinaDecoratorInfo
({monikers: ["mimicToggle"], description: "allows user to set whether or not they can be mimicked"})
("webhook-commands", "mimic", async (params: MachinaFunctionParameters) => {
    let req = await Guild.findOne({ id: params.msg.author.id })
    if(req == null) {
        let m = await params.msg.channel.send("```Creating document...```");
        const doc = new Guild({ id: params.msg.author.id });
        await doc.save();
        m.delete();
        req = await Guild.findOne({ id: params.msg.author.id })
    }
    if(params.args[0] == undefined) {
        return params.msg.channel.send(`\`\`\`Mimickable state: ${req.mimickable}\`\`\``)
    }
    if(!req.premium) return params.msg.channel.send('``` oops, sorry, this is a premium only feature! ```');
    if(typeof params.args[0] != "boolean") return params.msg.channel.send('```The only two allowed inputs for preferences are "true" or "false" ```')
    var preference = params.args[0]
    if(req == null) {
        const doc = new Guild({ id: params.msg.author.id, mimickable: preference });
        await doc.save();
        return params.msg.channel.send("```Your document has been updated!```")
    }else{
        await Guild.findOneAndUpdate({ id: params.msg.author.id }, { $set: { mimickable: preference } }, { new: true });
        return params.msg.channel.send(`\`\`\`preference updated to: ${preference}\`\`\``);
    }
});

export const premium: MachinaFunction = machinaDecoratorInfo
({monikers: ["premium"], description: "allows specific users to set the premium status of other users"})
("webhook-commands", "premium", async (params: MachinaFunctionParameters) => {
    let accepted = ['265499320894095371', '393247221505851412', '568087768530419732', '735322421862727760'];
    if(!accepted.includes(params.msg.author.id)) return params.msg.channel.send('```Please contact PremiumDoggo#5101 for premium features!```');

    if(params.args[0] == undefined) return params.msg.channel.send('```Must provide an id and, optionally, a boolean to set the status to```');
    if(!params.Bot.client.users.cache.get(String(params.args[0]))) return params.msg.channel.send('```Oops! couldn\'t find that user, make sure you are using a valid id```');
    let req = await Guild.findOne({ id: String(params.args[0]) })
    if(req == null) {
        let m = await params.msg.channel.send("```Creating document...```");
        const doc = new Guild({ id: String(params.args[0]) });
        await doc.save();
        m.delete();
        req = await Guild.findOne({ id: String(params.args[0]) })
    }
    if(params.args[1] == undefined) return params.msg.channel.send(`\`\`\`Premium status of ${params.Bot.client.users.cache.get(String(params.args[0])).username}: ${req.premium}\`\`\``);
    

    if(typeof params.args[1] != "boolean") return params.msg.channel.send('```The only two allowed inputs for premium status are "true" or "false" ```');
    await Guild.findOneAndUpdate({ id: String(params.args[0]) }, { $set: { premium: params.args[1] } }, { new: true });
    return params.msg.channel.send(`\`\`\`Premium status of ${params.Bot.client.users.cache.get(String(params.args[0])).username} updated to: ${params.args[1]}\`\`\``);
    
});

export const donate: MachinaFunction = machinaDecoratorInfo
({monikers: ["donate"], description: "allows users to donate to recieve premium"})
("webhook-commands", "donate", async (params: MachinaFunctionParameters) => {
    const embed = new MessageEmbed({
        color: 0xf9e3f9,
        description: "Buy PremiumDoggo a coffee to get access to premium features!",
        image: {
            url: "https://ko-fi.com/img/anonsupporter2.png",
        },
        title: 'Buy Me a Coffee!',
        url: 'https://ko-fi.com/webhookr',
        timestamp: new Date(),
        footer: {
            text: `${params.msg.author.username}`,
            icon_url: `${params.msg.author.displayAvatarURL()}`,
        },
    })
    params.msg.channel.send(embed);
});

export const avatar: MachinaFunction = machinaDecoratorInfo
({monikers: ["avatar"], description: "sends a users avatar"})
("webhook-commands", "avatar", async (params: MachinaFunctionParameters) => {
    let user: GuildMember;
    user = params.msg.mentions.members.first() || (!params.args[0] ? null : (await params.msg.guild.members.fetch({query: String(params.args[0]), limit: 1})).array()[0]);
    if(user == undefined) return params.msg.channel.send("```Could not find that user```");
    //https://cdn.discordapp.com/avatars/735322421862727760/e849928e7056b1807b4d2c39659273ac.png?size=1024
    //https://cdn.discordapp.com/avatars/735322421862727760/e849928e7056b1807b4d2c39659273ac.webp
    let link = user.user.displayAvatarURL({ format: 'png', dynamic: true, size: 4096 })
    params.msg.channel.send(new MessageAttachment(link, `${user.user.username}-avatar.png`));
});

export const invite: MachinaFunction = machinaDecoratorInfo
({monikers: ["invite"], description: "sends bot invite link"})
("webhook-commands", "invite", async (params: MachinaFunctionParameters) => {
    const link = await params.Bot.client.generateInvite({ permissions: ["ADD_REACTIONS", "VIEW_CHANNEL", "SEND_MESSAGES", "MANAGE_MESSAGES", "MANAGE_WEBHOOKS", "USE_EXTERNAL_EMOJIS"]});
    const embed = new MessageEmbed({
        color: params.msg.member.displayHexColor,
        description: 'do "wb donate" for premium features!',
        image: {
            url: "https://i.imgur.com/Y0bVdO4.jpg",
        },
        title: 'Add the bot!',
        url: link,
        timestamp: new Date(),
        footer: {
            text: `${params.msg.author.username}`,
            icon_url: `${params.msg.author.displayAvatarURL()}`,
        },
    })
    params.msg.channel.send(embed);
});

export const help: MachinaFunction = machinaDecoratorInfo
({monikers: ["help"], description: "displays the commands"})
("webhook-commands", "help", async (params: MachinaFunctionParameters) => {
    let embeds = [
        new MessageEmbed({
            title: "Commands",
            description: 'Inventory Commands\nPrefix: "wb "',
            fields: [
                {name: "Inventory", value: 'Usage: i\nExample: "wb i"\nDescription: Displays a menu containing your saved personas. Donate to unlock unlimited storage!'},
                {name: "Add", value: 'Usage: i add {name of new Persona} {image or link}\nExample: "wb i add denton https://i.imgur.com/8zHiOK2.jpeg"\nDescription: will create a Persona with the name and pfp provided.'},
                {name: "Remove", value: 'Usage: i remove {name of Persona}\nExample: "wb i remove denton"\nDescription: will remove the Persona with the provided name from your inventory\nMonikers: "r"'},
                {name: "Use", value: 'Usage: i {name or number of Persona} -m {message}\nExample: "wb i denton -m hello!!"\nDescription: will send your message as the chosen persona'},
                {name: "Relay", value: 'Usage: i start {name or number of Persona to be used}\nExample: "wb i start denton"\nDescription: whenever you send a message in this channel, the bot will delete it and resend it as the provided Persona'},
            ],
            color: params.msg.member.displayHexColor
        }),
        new MessageEmbed({
            title: "Commands",
            description: 'Other Commands',
            fields: [
                {name: "Mimic", value: 'Usage: {username, mention or "wb"} {message or nothing for random}\nExample: "wb ravenr hello! im ravenr!"\nDescription: will send a provided message (random if not provided) using a webhook with the name and pfp of a given member'},
                {name: "Random", value: 'Usage: random {message or nothing for random}\nExample: "wb random hahahahah im so cool"\nDescription: will pick a random person in the server and send a given message as them\nMonikers: "rand"'},
                {name: "Toggle Mimic", value: 'Usage: mimicToggle {true or false or nothing to check status}\nExample: "wb mimicToggle false"\nDescription: set whether or not you want others to be able to mimic you'},
                {name: "Invite", value: 'Usage: wb invite\nExample: "wb invite"\nDescription: generates a link to add the bot to a different server'},
                {name: "Avatar", value: 'Usage: avatar {username or mention}\nExample: "wb avatar ravenr"\nDescription: sends the avatar of the provided user'},
                {name: "Donate", value: 'Usage: donate\nExample: "wb donate"\nDescription: information about premium features'},
                {name: "Help", value: 'Usage: help\nExample: "wb help"\nDescription: sends this help menu'},
            ],
            color: params.msg.member.displayHexColor
        })
    ];
    

    setTimeout(() => {}, 1000)
    let menu = await params.msg.channel.send(embeds[0]);
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
});
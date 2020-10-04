import { Collection, TextChannel, MessageEmbed, Message, MessageAttachment, BufferResolvable } from 'discord.js';
import { machinaDecoratorInfo, MachinaFunction, MachinaFunctionParameters, MachinaMessage } from "machina.ts";
import { Document } from 'mongoose';
const Persona = require('./models/Persona');

function validURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
}

export const embed: MachinaFunction = machinaDecoratorInfo
({monikers: ["add"], description: "adds a webhook to users inventory"})
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
                console.log(link)
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
        console.log(doc);
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
});

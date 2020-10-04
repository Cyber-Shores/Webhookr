const settings = module.require("../../config.json");
const mongoose = require('mongoose')
const Discord = module.require('discord.js')

module.exports.run = async (client, msg, args) => {
    
    mongoose.connect("mongodb+srv://admin:12KuxLmPkYlptxj3@cluster0.h4bxo.mongodb.net/webhookrdb?retryWrites=true&w=majority", {
        useNewUrlParser: true,
        useFindAndModify: false
    });

    if(args[0] == "create") {
        let req = await Persona.findOne({ id: msg.author.id, name: args[1] });
            if(req) {
                return msg.channel.send("Persona already exists")
            }
            const doc = new Persona({ id: msg.author.id, name: args[1], image: args[2] });
            await doc.save();
            return msg.channel.send(`New Persona Created Name: ${args[1]} Image: ${args[2]}`)

    }else if(args[0] == "use") {
        let req = await Persona.findOne({ id: msg.author.id, name: args[1] });
            if(!req) {
                return msg.channel.send("Could not find the persona")
            }
        return msg.channel.send("Persona Found!")

    }else if(args[0] == "delete") {
        let req = await Persona.findOne({ id: msg.author.id, name: args[1] });
        if(!req) {
            return msg.channel.send("Could not find the persona.")
        }
        Persona.deleteOne({ id: msg.author.id, name: args[1] }, function (err) {
            if(err) msg.channel.send("Error occured persona could not be deleted.");
            return msg.channel.send("Successfuly deleted.")
        })
    }else if(args[0] == "list"){
        let personas = []
        let req = await Persona.find({ id: msg.author.id })

        req.forEach(doc => {
            personas.push(doc.name)
        });
        msg.channel.send(`Count: | ${req.length} |\ Personas Names: | ${personas.toString()} |`)

    }

    
}

module.exports.help = {
    name: "persona",
    reqPerms: [''],
    description: "For Interaction with personas",
    usage: `${settings.prefix}persona [create, find, delete]`,
    aliases: ['p'],
    type: 'misc'
}
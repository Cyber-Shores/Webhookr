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

    }else if(args[0] == "preference"){
        let req = await Guild.findOne({ id: msg.author.id })
        //Logging for debug
        // console.log(req)
        //Test for args
        if(!args[1]) {
            //get mimick state if no args
            if(req != null){
                return msg.channel.send(`Mimickable state: ${req.mimickable}`)
            }
            //Create doc if no req
            const doc = new Guild({ id: msg.author.id });
            await doc.save();
            return msg.channel.send("Your document has been created with default values.")
        }
        //save args[1] to variable
        var prefrence = args[1]
        if(args[1] != "true" && args[1] != "false") return msg.channel.send("The only two allowed inputs for preferences are `true` or `false`") 
        //Test if current document exists
        if(req == null) {
            //Create document with peramaters filled
            const doc = new Guild({ id: msg.author.id, mimickable: prefrence });
            //Save doc... Duh
            await doc.save();
            return msg.channel.send("Your document has been updated!")
        }else{
            await Guild.findOneAndUpdate({ id: msg.author.id }, { $set: { mimickable: prefrence } }, { new: true });
            return msg.channel.send(`Prefrence updated to: ${prefrence}`);
        }
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
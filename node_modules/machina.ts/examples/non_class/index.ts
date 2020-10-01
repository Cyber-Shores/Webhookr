import { Machina } from "../../machina"
import { arrify } from "../../helper/machinaUtility"
import { test } from "./general"

require('dotenv').config()
const Bot = new Machina(process.env["TOKEN"], "# ", {name: "Hamziniii", icon: "https://cdn.discordapp.com/avatars/393247221505851412/58db2923311a0d7df0bcc5d04e015303.webp"})

Bot.loadCommands(test) // this is where you would add in your commands, if you want more detail look at class example
Bot.initizalize()
Bot.client.on("message", async msg => {
    let cmd = Bot.evaluateMsg(msg)
    if(cmd.reason == "no commands available")
        return Machina.noCommands(msg, cmd.extra)
    if(cmd.reason == "permission check passed multiple")
        return Machina.multipleCommands(msg, arrify(cmd.value))
    if(cmd.reason != "msg does not include the set prefix") console.log(cmd.reason)
    if(cmd.value)
        arrify(cmd.value)?.forEach(f => f(Bot, msg))
})
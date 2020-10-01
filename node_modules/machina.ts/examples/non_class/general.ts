import { MachinaFunction } from "../../helper/machinaFunction"
import { MachinaFunctionParameters, machinaDecoratorInfo } from "../../helper/machinaDecorator"
import { MachinaMessage } from "../../helper/machinaMessage"

// Look at the class example if you are a beginner
// This is just an example of what you would do if you wanted it to be in command format
// This is practically the same as the sub example but put into a varaible 

export const test: MachinaFunction = machinaDecoratorInfo({monikers: ["test"], description: "testing function", args: {name: "an arg", type: "string", description: "write anything"}})
("General", "test", async (params: MachinaFunctionParameters) => {
    console.log("Sending message!")
    await new MachinaMessage({title: "Test!", description: "This is what you inputted: " + params.args}, params.msg).send()
    console.log("Sent message!")
})
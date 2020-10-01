import {machinaDecoratorInfo, MachinaFunctionParameters} from '../../helper/machinaDecorator'
import { MachinaFunction } from '../../helper/machinaFunction'
import { MachinaMessage } from '../../helper/machinaMessage'
import { arrify } from '../../helper/machinaUtility' // This isnt needed, but it will help you 90% of the time 

// This class wont be exported, so everything here wont be in the bot 
class General2 {
    @machinaDecoratorInfo({monikers: "sub2", description: "something terrible"})
    static sub2: MachinaFunction = (params: MachinaFunctionParameters) => {
        new MachinaMessage({description: "not a surprise"}, params.msg).send()
    }
}

export class General {
    // This is an example of what a command would look like

    // This is where you put specific information about the function, like the parameters, monikers, descriptions, and more
    @machinaDecoratorInfo({monikers: ["test"], description: "testing function", args: {name: "an arg", type: "string", description: "write anything"}})
    // This is where the actual stuff happens
    // You can name it what ever you want. Make sure that it is static though, because that allows Machina to get all the functions without making an instance of the class
    // Keep async if you want the function to be asynchronous. Else, remove it. 
    // You should label everything with types because it gives you autocomplete and it errors if you did something wrong 
    static test: MachinaFunction = async (params: MachinaFunctionParameters) => {
        // This is where your actual code is 
        console.log("Sending message!")
        // This is an example of using MachinaMessage. To learn more about it, look at the MachinaMessage file 
        await new MachinaMessage({title: "Test!", description: "This is what you inputted: " + params.args}, params.msg).send()
        console.log("Sent message!")
    }

    // This is an example of a function that uses a sub command
    @machinaDecoratorInfo({monikers: ["subTest", "sTest"], description: "a test for sub commands!",
        subs: [
            // Essentially this is the same way that you would go about making a machina function wihtout a class
            machinaDecoratorInfo({monikers: ["sub1"], description: "a suprise!"})("General", "sub1", (params: MachinaFunctionParameters) => {
                new MachinaMessage({description: "a surprise!"}, params.msg).send()
            }), 
            // You can import other commands and use them as sub commands. If there are any errors, with will tell you the class or location of where its located. 
            // Thats why you must put in the class and function name when you make a machina function without classes  
            General2.sub2
        ]
    })
    static subTest: MachinaFunction = async (params: MachinaFunctionParameters) => {
        // Here I am using param.info which gives the infromation put into machinaDecoratorInfo
        // Then I look at the subs property and put it into the subs functon. This is becaus property can either be MachinaFunction or MachinaFunction[]
        // I map each sub functions name, then I join them together with ", "
        // When you run this command it should tell you all of the sub commands for this command
        new MachinaMessage({title: "subTest", description: "Use one of this command's sub commands: " + arrify(params.info.subs).map(s => s.name).join(", ")}, params.msg).send()
    }
}
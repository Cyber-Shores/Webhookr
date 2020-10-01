# Machina.ts
This is a discord.js wrapper that speeds up your productivity. It allows you to focus on creating commands and logic rather than building up the foundation. 
<br>
<br>
Get it here:
<br>
[npm](https://www.npmjs.com/package/machina.ts)    
[github](https://github.com/Hamziniii/machina.ts)

## Start
To get started, make sure you have typescript.
I would recommend getting the cli tool [Typescript Node Dev](https://www.npmjs.com/package/ts-node-dev).
This tool is like nodemon, but for ts and it doesnt output js. 
If you want some project examples, go into the example folder. 
I would highly recommend looking at the example folder because it gives a general outline of what you should do. 

## Decorator (class) vs No decorators
There are two methods of using this: decorators or no decorators. 
For decorators you need to use javascript classes with typescript decorators. (Make sure you enable expermental decorators for ts)<br>
There is nothing more you need to do if you don't want to use decorators. 
There also is nothing stoping you from using both.<br>
If you decide to use decorators make sure to put "experimentalDecorators": true in your tsconfig.json file. If you don't know what a tsconfig.json file is, just copy the one here. 

## Basic Implementation for Starting File
When starting a project with this package, you need to have a starting file. In that file you need to do, at minimum, 3 things: Creating an instance of Machina, loading commands or classes into the bot, and initializing the bot. After you do that, you can put an event listener on the client property of the instance. For the sake of brevity, lets call that instance Bot. If you want, you can add a message listener to the bot. If you wish to use Machina's method of evaluating messages and comparing permissions, you can use Bot.evaluateMsg() with the msg being the parameter. Bot.evaluateMsg() returns an object with three properties: reason, extra, and value. Reason is a string that says what happened, e.g. no commands available, or permission check passed multiple. Extra is just extra information for debugging purposese. Value is either null, a function, or a list of functions. To run a command, simply run the value and pass in the Bot instance and the message. This is what a basic implementation would look like: 

```typescript 
import { Machina, extractClasses, arrify } from "machina.ts"

// Make the instance
const Bot = new Machina("TOKEN HERE", "< ", {name: "Hamziniii", icon: ""})
// Load everything
// I would recommand using extractClasses with the dir param, because it makes things easier
// Essentially loads all the files from the commands folder
// If you want to blacklist a file, you can
Bot.loadClasses(extractClasses("dir", "commands"))
// Bot.loadCommands() // This is for loading commands. It takes in one or more MachinaFunctions
// Start the bot
Bot.initizalize()

// Run the on message
Bot.client.on("message", msg => {
    // This gets the command and other information
    let command = Bot.evaluateMsg(msg)
    
    // Command reason gives information of what is the status of the command
    // This just checks if no commands are available
    if(command.reason == "no commands available")
        // This displays a mesasge saying that there are no commands 
        return Machina.noCommands(msg, command.extra)
    // This just checks if multiple commands are available (if multiple commands have the same name)
    else if(command.reason == "permission check passed multiple")
        // This just sends a message saying to choose a specific command
        return Machina.multipleCommands(msg, arrify(command.value))

    // This checks if there actually are fucntions that you can call
    // command.value(Bot, msg) works as well, asumming if you check to see if command.value is a singular function rather than a list
    if(command.value)
        // This takes the commands which could either be in a list or a single function and make it into a list
        // [x, y, z, ...] or x => [x, y, z, ...] or [x]
        // The for each calls them, passing in the instance of the bot and the message which is required 
        arrify(command.value).forEach(f => f(Bot, msg))
})
```
## Basic Implementation for commands
Below is an example of how a file that uses decorators would look like.
```typescript
// commands/fun.ts
import { machinaDecoratorInfo, MachinaFunction, MachinaFunctionParameters, MachinaMessage } from "machina.ts"

// Here is the class that will contain all the fun commands
export class Fun {
    // BASIC COMMAND STRUCTURE
    // The decorator: you need to add monikers (the words that the user calls for the function to run) and a description
    // You can add more things like strictArgs: boolean which forces the user to write parameters
    // You can use shift space (autocomplete, or something like that) to get all the options that you can add
    // You can also look at node_modules/machina.ts/helper/machinaFunction.ts to see all the details
    @machinaDecoratorInfo({monikers: ["rN", "randomNumbers"], description: "generates a random number between 1 and 10"})
    // Here you make a property for the Fun class
    // It has to be static if you want it to be used as a command
    // Set the funtion to type MachinaFunction
    // Create an anonymous function with one parameter, params of type MachinaFunctionParameters
    // If you want you can add async before the "(" to make it an asychronous function
    // Essentially this is what params has:
    /*
        Information about the command that was inputted in the decorator
            info: MachinaFunctionDefinition, 
        The instance of the Machina class (the bot)
            Bot: Machina,
        The users message (discord.js message)
            msg: Message, 
        The Users arguments
            args: MachinaArgsTypes[],
        Information about the inputted argumets
            argsInfo: MachinaArgsInfo
    */ 
    static randomNumber: MachinaFunction = async (params: MachinaFunctionParameters) => {
        // Generate a random integer between 1 and 10
        let num = Math.floor(Math.random() * 10) + 1 
        // You can use the regular discord embed class, but here I am using mine 
        // It takes in the discord message options (all optional, but you should have at least something with contnet)
        // It also takes in the user's message, and and option if I want default settings (a footer with the user's message, the color which is the same as the user's role color, timestamp, etc.)
        let message = new MachinaMessage({title: "Random Number:", description: "The random number you have rolled is " + num}, params.msg, true)
        // This just sends a message
        message.send()
    }

    // After this, you can add as many commands as you want, and classes
    // I would also recommend going through the machina files and looking at the types and what they mean 
}
```

If you do not want decorators, I am going to assume you know what you are doing. Here is an example of what that would look like:

```typescript
// commands/fun2.ts
// When loading commands and not classes, use .loadCommands instead of .loadClasses in your starting file 
// Make sure you are not importing this file or files without classes when you import classes 

export const randomNumber: MachinaFunction = machinaDecoratorInfo
    /* This is the same as the above example */
    ({monikers: ["rN", "randomNumbers"], description: "generates a random number between 1 and 10"})
    /* Right here, you are basically giving the information that the class would have given you.
       Fun would have been the name of the class, and randomNumber would have been the propertyKey of the class.
       Since its not a decorator, you have to give that information, including the function itself
    */
    ("Fun", "randomNumber", (params: MachinaFunctionParameters) => {
        let num = Math.floor(Math.random() * 10) + 1 
        let message = new MachinaMessage({title: "Random Number:", description: "The random number you have rolled is " + num}, params.msg, true)
        message.send()
    })
```

## Exploring further
This was just the basic implementation of things. If you want to control things more by adding in parameters for you commands, or even permissions look at machinaFunction.ts in the helper folder. It has the outline of all the options you can have in the machinaDecoratorInfo function. Also note that you can have subcommands, which are basically commands inside of commands. You can have as many as you want, ad infintum assuming you have the computer power. You can also look at the other files, and see how I have implemented things. Be sure to point out any mistakes, or if I can make things better. This is my first "real" open source project that I have actually put on NPM. 

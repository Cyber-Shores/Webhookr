# Webhookr

<https://hastebin.com/tikiwobabo>

finished? 1 - wb @user {message (optional)} ---> returns webhook of mentioned user with the specified message/ a random mimic message

finished 2 - wb i add {desired webhook name}
bot response asks for user's avatar of choice
user sends a link/image in chat

the Name and Image is stored in the user's inventory (i)

if error occurs in the image, the process is exited

finished 3 - wb i remove {desired webhook name}
removes the name and image from the user's inventory

finished? 4 - wb i {webhook name} {message}
This acts like tupperbox, a bot designed to catch messages by the user, delete them, and relay them again in the form of the user's desired webhook name and image

This works for images/messages only, when it comes to files, the anonymous file sharing could be risky so when a file is shared, the bot will specify the username
of the file sender

User --> sends a message "hi"
Bot --> deletes message, repeats message in form of desired webhook
This will loop until the stop command is activated

finished 5 - wb stop/ @botname stop
 This will stop the above process and will not convert the user's message into a webhook any longer

finished? 6 - wb i
 this will return the user's inventory in an embed
there will be a max of 10 webhook names in an embed and a reaction arrow key right and left to navigate through more

7 - wb rand/ wb random {message (optional)}
 this will select a random user of the server and mimic them.
 if the user cannot be mimcked, it will return a few preset statements like [I like giraffes, This bot is awesome etc etc]

8 - wb mimic yes/no true/false active/deactivate
the user should be able to prevent being mimicked by other users, since everyone is not comfortable with it

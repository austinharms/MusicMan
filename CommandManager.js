const { SendEmbed } = require("./MessageUtilities");
let prefix = "~";

const ServerlessCommands = {
  "help": async function(command) {
    await SendEmbed(command.channel, "Help!", "this is the help page");
  }
};

const onCommand = msg => {
  if (!msg.content.startsWith(prefix) || msg.author.bot || !msg.guild)
    return false;
  
  const parsedCommand = parseCommand(msg);
  if (ServerlessCommands.hasOwnProperty(parsedCommand.command)) {
    ServerlessCommands[parsedCommand.command](parsedCommand);
  }

  console.log(parsedCommand);
};

const parseCommand = (msg) => {
  const command = {
    text: msg.content,
    user: msg.author,
    channel: msg.channel,
    guild: msg.guild,
  };

  const parts = command.text.split(" ").filter(part => part.length > 0);
  command.fullCommand = parts.shift();
  command.command = command.fullCommand.substring(prefix.length);
  command.splitText = parts;

  return command;
};

const CommandManager = {
  setPrefix: (newPrefix) => prefix = newPrefix,
  onCommand,
  ServerlessCommands,
};

module.exports = CommandManager;


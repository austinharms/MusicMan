let prefix = "~";

const ServerlessCommands = {
  "help": {

  }
};

const splitCommand = text => {
  const parts = text.split(" ");
  return parts.filter((part, index) => part.length > 0 && index != 0);
}

const onCommand = msg => {
  if (!msg.content.startsWith(prefix) || msg.author.bot || !msg.guild)
    return false;
  
  const command = {
    text: msg.content,
    splitText: splitCommand(msg.content),
    user: msg.author,
    channel: msg.channel,
    guild: msg.guild,
  };

  command.fullCommand = command.text.split(" ")[0];
  command.command = command.fullCommand.substring(prefix.length);

  console.log(command);
};

const CommandManager = {
  setPrefix: (newPrefix) => prefix = newPrefix,
  onCommand,
  ServerlessCommands,
};

module.exports = CommandManager;


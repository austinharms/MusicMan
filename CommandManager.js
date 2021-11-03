const BotError = require("./BotError");
const { SendEmbed, SendError } = require("./MessageUtilities");
const AudioManager = require("./AudioManager");
let prefix = "~";

const ServerlessCommands = {
  "help": async function(command) {
    await SendEmbed(command.channel, "Help!", "this is the help page");
  }
};

const isCharNumber = (c) => c >= '0' && c <= '9';

const parseCommand = (msg) => {
  try {
    const command = {
      text: msg.content,
      user: msg.author,
      guildUser: msg.member,
      channel: msg.channel,
      guild: msg.guild,
      msg,
    };

    const parts = command.text.split(" ").filter(part => part.length > 0);
    command.fullCommand = parts.shift();
    command.splitText = parts;
    command.command = command.fullCommand.substring(prefix.length);
    command.channelIndex = -1;
    if (isCharNumber(command.command.charAt(0))) {
      command.channelString = command.command.charAt(0);
      for (let i = 1; i < command.command.length; ++i) {
        if (isCharNumber(command.command.charAt(i))) {
          command.channelString += command.command.charAt(i);
        } else {
          break;
        }
      }
      
      command.channelIndex = parseInt(command.channelString);
      if (isNaN(command.channelIndex)) {
        command.channelIndex = -1;
        delete command.channelString;
      }
      
      command.command = command.command.substring(command.channelString.length);
    }

    return command;
  } catch(e) {
    throw BotError(e,"Failed to Interpret Command", "CmdMgr:parseCommand", msg.guild.id, msg.channel.id, msg.author.id);
  }
};

const onCommand = async msg => {
  try {
    if (!msg.content.startsWith(prefix) || msg.author.bot || !msg.guild)
      return false;
    
    const parsedCommand = parseCommand(msg);
    if (ServerlessCommands.hasOwnProperty(parsedCommand.command)) {
      try {
        await ServerlessCommands[parsedCommand.command](parsedCommand);
      } catch(e) {
        if (e instanceof BotError.ErrorObject) {
          SendError(msg.channel, e);
        } else {
          SendError(msg.channel, BotError(e,"Failed to Run Command", "CmdMgr:onCommand:runServerlessCommand", msg.guild.id, msg.channel.id, msg.author.id));
        }
      }
    } else if (parsedCommand.command === "join") {
      try {
        const userChannel = await AudioManager.getUserChannelId(parsedCommand.guildUser);
        await AudioManager.getConnection(parsedCommand.guild.id, userChannel, parsedCommand.channelIndex);
      } catch(e) {
        if (e instanceof BotError.ErrorObject) {
          SendError(msg.channel, e);
        } else {
          SendError(msg.channel, BotError(e,"Failed to Run Command", "CmdMgr:onCommand:runAudioCommand", msg.guild.id, msg.channel.id, msg.author.id));
        }
      }
    }

    return true;
  } catch(e) {
    if (e instanceof BotError.ErrorObject) {
      SendError(msg.channel, e);
    } else {
      SendError(msg.channel, BotError(e,"Failed to Interpret Message", "CmdMgr:onCommand", msg.guild.id, msg.channel.id, msg.author.id));
    }
    return false;
  }
};

const CommandManager = {
  setPrefix: (newPrefix) => prefix = newPrefix,
  onCommand,
};

module.exports = CommandManager;


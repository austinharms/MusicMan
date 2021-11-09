const BotError = require("./BotError");
const URLUtilities = require("./URLUtilities");
const { SendEmbed, SendError, ReactThumbsUp } = require("./MessageUtilities");
const AudioManager = require("./AudioManager");
let prefix = "~";

const ServerlessCommands = {
  "help": async function(command) {
    await SendEmbed(command.channel, "Help!", "this is the help page");
  }
};

const AudioCommands = {
  "join": {
    func: async function(command, connection) {
      await ReactThumbsUp(command.msg);
    },
    requiresExistingConnection: false,
  },
  "dc": {
    func: async function(command, connection) {
      connection.Disconnect();
      await ReactThumbsUp(command.msg);
    },
    requiresExistingConnection: true,
  },
  "play": {
    func: async function(command, connection) {
      await connection.Queue(false, (await URLUtilities.ResolveSong(command.parameters)));
      await ReactThumbsUp(command.msg);
    },
    requiresExistingConnection: false,
  },
  "skip": {
    func: async function(command, connection) {
      await connection.Skip();
      await ReactThumbsUp(command.msg);
    },
    requiresExistingConnection: true,
  },
  "queue": {
    func: async function(command, connection) {
      await SendEmbed("Queue", connection.GetQueue());
    },
    requiresExistingConnection: true,
  },
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
    command.parameters = command.splitText.join(" ").trim();
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
      
      command.command = command.command.substring(command.channelString.length).toLowerCase();
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
    } else if (AudioCommands.hasOwnProperty(parsedCommand.command)) {
      try {
        const userChannel = await AudioManager.getUserChannelId(parsedCommand.guildUser);
        const audioCommand = AudioCommands[parsedCommand.command];
        let connection = null;
        if (audioCommand.requiresExistingConnection) {
          connection = await AudioManager.hasConnection(parsedCommand.guild.id, userChannel, parsedCommand.channelIndex);
          if (connection === false)
            throw BotError(new Error("User not in Bot VC"), "You must be in a Bot VC to run this Command", "CmdMgr:onCommand:runAudioCommand", parsedCommand.guild.id, userChannel, parsedCommand.channelIndex, true);
        } else {
          connection = await AudioManager.getConnection(parsedCommand.guild.id, userChannel, parsedCommand.channelIndex);
        }

        await audioCommand.func(parsedCommand, connection);
      } catch(e) {
        if (e instanceof BotError.ErrorObject) {
          SendError(msg.channel, e);
        } else {
          SendError(msg.channel, BotError(e,"Failed to Run Command", "CmdMgr:onCommand:runAudioCommand", msg.guild.id, msg.channel.id, msg.author.id));
        }
      }
    } else {
      await SendEmbed(msg.channel, "What?", `Unknow Command\nUse **${prefix}help** to view list of Commands`);
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


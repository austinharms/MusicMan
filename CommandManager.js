const BotError = require("./BotError");
const URLUtilities = require("./URLUtilities");
const { SendEmbed, SendError, ReactThumbsUp } = require("./MessageUtilities");
const AudioManager = require("./AudioManager");
let prefix = "~";

const expandCommands = function(cmds) {
  const newCmds = {};
  const keys = Object.keys(cmds);
  keys.forEach(k => {
    const subKeys = k.split(/,\s?/);
    const command = cmds[k];
    subKeys.forEach(sk => newCmds[sk] = command);
  });
  return newCmds;
};


const ServerlessCommands = expandCommands({
  "help, h, he, what, ?, how": async function(command) {
    await SendEmbed(command.channel, "Help!", 
    `***Commands:***
    **Help**: Shows this message
    **Join**: Join your VC
    **Leave**: Disconnect from VC
    **Play**: Play a song or add it to the queue
    **Play!**: Play a song ignore the queue
    **Skip**: Skip the current song
    **Queue**: Show the current song queue
    **Current**: Show the current song
    **Pause**: Pause/Resume the current song
    **Loop**: Loop the current song
    **LoopQueue**: Loop the current queue of songs
    **Clear**: Clear the queue and any playing song`);
  }
});

const AudioCommands = expandCommands({
  "join, j, connect": {
    func: async function(command, connection) {
      await ReactThumbsUp(command.msg);
    },
    requiresExistingConnection: false,
  },
  "leave, dc, dis, disconnect": {
    func: async function(command, connection) {
      connection.Disconnect();
      await ReactThumbsUp(command.msg);
    },
    requiresExistingConnection: true,
  },
  "play, p, pl, pla": {
    func: async function(command, connection) {
      await connection.Queue(false, (await URLUtilities.ResolveSong(command.parameters)));
      await ReactThumbsUp(command.msg);
    },
    requiresExistingConnection: false,
  },
  "play!, pl!, p!, pla!": {
    func: async function(command, connection) {
      await connection.Queue(true, (await URLUtilities.ResolveSong(command.parameters)));
      await ReactThumbsUp(command.msg);
    },
    requiresExistingConnection: false,
  },
  "skip, sk, ski, s": {
    func: async function(command, connection) {
      let count = 1;
      if(command.splitText.length > 0 && !isNaN(command.splitText[0]))
        count = parseInt(command.splitText[0]);
      if (count < 1 || count > connection.queue.length && count > 1)
        throw BotError(new Error("Index out of range"), "Invalid Skip Count", "CmdMgr:skip", command.guild.id, command.channel.id, command.user.id, true);
      await connection.Skip(count);
      await ReactThumbsUp(command.msg);
    },
    requiresExistingConnection: true,
  },
  "rm, remove, del, rem, de": {
    func: async function(command, connection) {
      if(command.splitText.length <= 0 || isNaN(command.splitText[0]))
        throw BotError(new Error("Failed to Parse Index"), "Invalid Index", "CmdMgr:remove", command.guild.id, command.channel.id, command.user.id, true);
      const index = parseInt(command.splitText[0]);
      if (index < 1 || index > connection.queue.length)
        throw BotError(new Error("Index out of Range"), "Invalid Index", "CmdMgr:remove", command.guild.id, command.channel.id, command.user.id, true);
      await connection.Remove(index);
      await ReactThumbsUp(command.msg);
    },
    requiresExistingConnection: true,
  },
  "queue, qu, que, queu, q": {
    func: async function(command, connection) {
      let page = 1;
      if(command.splitText.length > 0 && !isNaN(command.splitText[0]))
        page = parseInt(command.splitText[0]);
      await SendEmbed(command.channel, "Queue:", connection.GetQueue(page));
    },
    requiresExistingConnection: true,
  },
  "current, cur, np, now": {
    func: async function(command, connection) {
      await SendEmbed(command.channel, "Playing:", connection.GetCurrent());
    },
    requiresExistingConnection: true,
  },
  "clear, cl, clearq, clearqueue": {
    func: async function(command, connection) {
      await connection.Clear();
      await ReactThumbsUp(command.msg);
    },
    requiresExistingConnection: true,
  },
  "pause, resume, pau, res, pu, rs": {
    func: async function(command, connection) {
      await SendEmbed(command.channel, connection.Pause(), "");
    },
    requiresExistingConnection: true,
  },
  "loop, l, loo, lo, repeat, rep, keep": {
    func: async function(command, connection) {
      await SendEmbed(command.channel, connection.Loop(), "");
    },
    requiresExistingConnection: true,
  },
  "loopqueue, lq, loopq, repeatqueue, repeatq, repq, keepqueue, keepq": {
    func: async function(command, connection) {
      await SendEmbed(command.channel, connection.LoopQueue(), "");
    },
    requiresExistingConnection: true,
  },
});

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
    command.command = command.fullCommand.substring(prefix.length).toLowerCase();
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


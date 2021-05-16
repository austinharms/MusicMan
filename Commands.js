const CommandSession = require("./CommandSession.js");
const Audio = require("./Audio.js");
const Permissions = require("./Permissions.js");
const UTILITIES = require("./Utilities.js");

const COMMANDS = Object.freeze({
  hi: {
    func: (msg, props) => {
      if (props.length > 0) {
        const userId = UTILITIES.getUserId(msg.guild, props[0]);
        if (userId)
          return msg.channel.send("Hi! " + UTILITIES.pingUserText(userId));
      }

      msg.channel.send("Hi!");
    },
    name: "hi",
    id: 0,
  },
  say: {
    func: (msg, props) => {
      msg.channel.send(props.join(" "));
    },
    name: "say",
    id: 1,
  },
  start: {
    func: (msg, props) => {
      const s = CommandSession.create(msg.channel, [], 10);
      s.onTimeout((s) => {
        s.channel.send("Command Session Timeout!");
      });

      s.onMsg((s) => {
        s.channel.send("Session Command");
      });

      msg.channel.send("Command Session Started");
    },
    name: "start",
    id: 2,
  },
  tic: {
    func: (msg, props) => {},
    name: "tic",
    id: 3,
  },
  gping: {
    func: async (msg, props) => {
      const tag =
        (props.length > 0 ? UTILITIES.getUserId(props[0]) : false) || msg.author.id;
      const count =
        props.length > 1 && !isNaN(props[1]) ? parseInt(props[1]) : 1;
      const messages = [];
      for (let i = 0; i < count; ++i) messages.push(msg.channel.send(`<@${tag}>`));
      msg.channel.bulkDelete([...(await Promise.all(messages)), msg]);
    },
    name: "gping",
    id: 4,
  },
  bping: {
    func: (msg, props) => {
      const tag =
        (props.length > 0 ? UTILITIES.getUserId(props[0]) : false) || msg.author.id;
      const count =
        props.length > 1 && !isNaN(props[1]) ? parseInt(props[1]) : 1;
      for (let i = 0; i < count; ++i) msg.channel.send(`<@${tag}>`);
    },
    name: "bping",
    id: 5,
  },
  join: {
    func: (msg, props) => {
      Audio.join(msg);
    },
    name: "join",
    id: 6,
  },
  skip: {
    func: (msg, props) => {
      Audio.play(msg.guild.id);
      UTILITIES.reactThumbsUp(msg);
    },
    name: "skip",
    id: 7,
  },
  queue: {
    func: (msg, props) => {
      Audio.viewQueue(msg);
    },
    name: "queue",
    id: 13,
  },
  play: {
    func: (msg, props) => {
      Audio.addQueue(msg, props);
    },
    name: "play",
    id: 8,
  },
  leave: {
    func: (msg, props) => {
      Audio.leave(msg);
    },
    name: "leave",
    id: 9,
  },
  perm: {
    func: async (msg, props) => {
      if (props.length >= 2) {
        if (props[0].toLowerCase() === "cmd") {
          const cmd = COMMANDS[props[1].toLowerCase()];
          if (cmd) {
            if (props.length >= 3) {
              if (!isNaN(props[2])) {
                const level = parseInt(props[2]);
                const userLevel = await Permissions.getUserPermission(msg.author.id, msg.guild.id);
                if (userLevel !== -1 && level <= 1000 && level >= userLevel || level === -1) {
                  await Permissions.setCommandPermission(
                    cmd.id,
                    msg.guild.id,
                    level
                  );
                  UTILITIES.reactThumbsUp(msg);
                  return;
                } else {
                  msg.reply("Invalid Permission to set Permission Level " + level);
                  return;
                }
              }
            } else {
              const cmdDB = await Permissions.getCommand(cmd.id, msg.guild.id);
              const level = Permissions.getCommandPermission(cmdDB);
              msg.reply(cmd.name + " Command Permission Level is: " + level);
              return;
            }
          } else {
            msg.reply(
              'Unable to Check Permissions for Unknown Command "' +
                props[1] +
                '"'
            );
            return;
          }
        } else if (props[0].toLowerCase() === "user") {
          const user = UTILITIES.getUserId(msg.guild, props[1]);
          if (user !== false) {
            if (props.length >= 3) {
              if (!isNaN(props[2])) {
                const level = parseInt(props[2]);
                if (level <= 1000 && level >= 1 || level === -1) {
                  await Permissions.setUserPermission(
                    user,
                    msg.guild.id,
                    level
                  );
                  UTILITIES.reactThumbsUp(msg);
                  return;
                } else {
                  msg.reply("Invalid Permission to set Permission Level: " + level);
                  return;
                }
              }
            } else {
              const userLevel = await Permissions.getUserPermission(user, msg.guild.id);
              msg.reply("User Permission Level is: " + userLevel);
                  return;
            }
          } else {
            msg.reply(
              'Unable to Find User: "' +
                props[1] +
                '"'
            );
            return;
          }
        }
      }

      msg.reply("Invalid Arguments");
    },
    name: "perm",
    id: 10,
  },
  disable: {
    func: async (msg, props) => {
      if (props.length > 0) {
        const cmd = COMMANDS[props.shift().toLowerCase()];
        if (cmd && cmd.id !== 11 && cmd.id !== 12 && cmd.id !== 10) {
          await Permissions.setCommandDisabled(cmd.id, msg.guild.id, true, props.join(" "));
          UTILITIES.reactThumbsUp(msg);
          return;
        }
      }

      msg.reply("Invalid Arguments");
    },
    name: "disable",
    id: 11,
  },
  enable: {
    func: async (msg, props) => {
      if (props.length > 0) {
        const cmd = COMMANDS[props.shift().toLowerCase()];
        if (cmd) {
          await Permissions.setCommandDisabled(cmd.id, msg.guild.id, false, "");
          UTILITIES.reactThumbsUp(msg);
          return;
        }
      }

      msg.reply("Invalid Arguments");
    },
    name: "enable",
    id: 12,
  },
  help: {
    func: async (msg, props) => {
msg.channel.send({
  embed: {
  title: "Utility Bot Help",
  color: "AQUA",
  description:   `***All Commands Start with "${process.env.CMD_PREFIX}"***
**_Command Parameters must be in order and separated by spaces, Parameters with \* are Required_**
\n***General Commands***
\t**hi**: params: [user], says hi
\t**say**: params: [text to repeate], repeats params
\t**start**: params: none, unused command
\t**tic**: params: none, unused command
\n***Spam Commands***
\t**gping**: params [user, count], ghost pings user count times
\t**bping**: params: [user, count], pings user count times
\n***Audio Commands***
\t**join**: params: none, joins VC
\t**play**: params: [*url, bassboost: (-100, 100)], plays or adds to queue the url, can also bassboost the music,
\t**skip**: params: none, skip the currently playing song (Bug: can take a while to skip a song),
\t**queue**: params: none, show the queue of songs to be played
\t**clear**: params: none, clears all queued songs 
\t**leave**: params: none, disconnects the bot from VC
\n_**Permsission Commands**_
\t**perm**: params: [*permissionType: (cmd/user), *object to view permission of, level, msg], set's or viewa the permission of the object base on wether a level was provided and sets the invalid permission message
\t**disable**: params: [*command, msg], disables the provided command and sets the disabled message for it
\t**enable**: params: [*command], enables the provided command`
  }
});
    },
    name: "help",
    id: 14,
  },
  clear: {
    func: async (msg, props) => {
      Audio.clear(msg);
    },
    name: "disable",
    id: 11,
  }
});

module.exports = COMMANDS;

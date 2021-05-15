const CommandSession = require("./CommandSession.js");
const Audio = require("./Audio.js");
const Permissions = require("./Permissions.js");
const UTILITIES = require("./Utilities.js");

const COMMANDS = Object.freeze({
  hi: {
    func: (props, user, channel, msg) => {
      if (props.length > 0) {
        const userId = UTILITIES.getUserId(msg.guild, props[0]);
        if (userId) {
          channel.send("Hi! " + UTILITIES.pingUserText(userId));
          return;
        }
      }

      channel.send("Hi!");
    },
    name: "hi",
    id: 0,
  },
  say: {
    func: (props, user, channel, msg) => {
      channel.send(props.join(" "));
    },
    name: "say",
    id: 1,
  },
  start: {
    func: (props, user, channel, msg) => {
      const s = CommandSession.create(channel, [], 10);
      s.onTimeout((s) => {
        s.channel.send("Command Session Timeout!");
      });

      s.onMsg((s) => {
        s.channel.send("Session Command");
      });

      channel.send("Command Session Started");
    },
    name: "start",
    id: 2,
  },
  tic: {
    func: (props, user, channel, msg) => {},
    name: "tic",
    id: 3,
  },
  gping: {
    func: async (props, user, channel, msg) => {
      const tag =
        (prop.length > 0 ? UTILITIES.getUserId(props[0]) : false) || user.id;
      const count =
        props.length > 1 && !isNaN(props[1]) ? parseInt(props[1]) : 1;
      const messages = [];
      for (let i = 0; i < count; ++i) messages.push(channel.send(`<@${tag}>`));
      channel.bulkDelete([...(await Promise.all(messages)), msg]);
    },
    name: "gping",
    id: 4,
  },
  bping: {
    func: (props, user, channel, msg) => {
      const tag =
        (prop.length > 0 ? UTILITIES.getUserId(props[0]) : false) || user.id;
      const count =
        props.length > 1 && !isNaN(props[1]) ? parseInt(props[1]) : 1;
      for (let i = 0; i < count; ++i) channel.send(`<@${tag}>`);
    },
    name: "bping",
    id: 5,
  },
  join: {
    func: (props, user, channel, msg) => {
      Audio.join(msg, user, msg.guild, channel);
    },
    name: "join",
    id: 6,
  },
  playF: {
    func: (props, user, channel, msg) => {
      Audio.playFile(msg, user, msg.guild, channel, props[0]);
    },
    name: "play",
    id: 7,
  },
  play: {
    func: (props, user, channel, msg) => {
      Audio.playYT(msg, user, msg.guild, channel, props[0]);
    },
    name: "play",
    id: 8,
  },
  leave: {
    func: (props, user, channel, msg) => {
      Audio.leave(channel);
    },
    name: "leave",
    id: 9,
  },
  perm: {
    func: async (props, user, channel, msg) => {
      if (props.length >= 2) {
        if (props[0].toLowerCase() === "cmd") {
          const cmd = COMMANDS[props[1].toLowerCase()];
          if (cmd) {
            if (props.length >= 3) {
              if (!isNaN(props[2])) {
                const level = parseInt(props[2]);
                const userLevel = await Permissions.getUserPermission(user.id, msg.guild.id);
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
    func: async (props, user, channel, msg) => {
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
    func: async (props, user, channel, msg) => {
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
});

module.exports = COMMANDS;

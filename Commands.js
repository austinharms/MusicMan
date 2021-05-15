const CommandSession = require("./CommandSession.js");
const Audio = require("./Audio.js");
const Permissions = require("./Permissions.js");
const UTILITIES = require("./Utilities.js");

const COMMANDS = Object.freeze({
  "hi": { 
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
    maxLevel: -1,
    showPermissionError: false,
    name: "hi",
    disabled: false,
    showDisabled: true
  },
  "say": { 
    func: (props, user, channel, msg) => {
      channel.send(props.join(" "));
    },
    maxLevel: -1,
    showPermissionError: false,
    name: "say",
    disabled: false,
    showDisabled: true
  },
  "start": { 
    func: (props, user, channel, msg) => {
      const s = CommandSession.create(channel, [], 10);
      s.onTimeout(s => {
        s.channel.send("Command Session Timeout!");
      });
  
      s.onMsg(s => {
        s.channel.send("Session Command");
      });
  
      channel.send("Command Session Started");
    },
    maxLevel: 1,
    showPermissionError: true,
    name: "start",
    disabled: false,
    showDisabled: true
  },
  "tic": { 
    func: (props, user, channel, msg) => {
      channel.send(props.join(" "));
    },
    maxLevel: -1,
    showPermissionError: false,
    name: "tic",
    disabled: true,
    showDisabled: true
  },
  "gping": { 
    func: async (props, user, channel, msg) => {
      const tag = (props.length === 0 || isNaN(props[0]))?user.id:props[0];
      const count = (props.length > 1 && !isNaN(props[1]))?parseInt(props[1]):1;
      const messages = [];
      for (let i = 0; i < count; ++i) messages.push(channel.send(`<@${tag}>`));
      channel.bulkDelete([...(await Promise.all(messages)), msg]);
    },
    maxLevel: 1,
    showPermissionError: false,
    name: "gping",
    disabled: false,
    showDisabled: true
  },
  "bping": { 
    func: (props, user, channel, msg) => {
      const tag = (props.length === 0 || isNaN(props[0]))?user.id:props[0];
      const count = (props.length > 1 && !isNaN(props[1]))?parseInt(props[1]):1;
      for (let i = 0; i < count; ++i) channel.send(`<@${tag}>`);
    },
    maxLevel: 1,
    showPermissionError: false,
    name: "bping",
    disabled: false,
    showDisabled: true
  },
  "join": { 
    func: (props, user, channel, msg) => {
      Audio.join(msg, user, msg.guild, channel);
    },
    maxLevel: 10,
    showPermissionError: true,
    name: "join",
    disabled: false,
    showDisabled: true
  },
  "playF": { 
    func: (props, user, channel, msg) => {
      Audio.playFile(msg, user, msg.guild, channel, props[0]);
    },
    maxLevel: 1,
    showPermissionError: true,
    name: "play",
    disabled: false,
    showDisabled: true
  },
  "play": { 
    func: (props, user, channel, msg) => {
      Audio.playYT(msg, user, msg.guild, channel, props[0]);
    },
    maxLevel: 10,
    showPermissionError: true,
    name: "play",
    disabled: false,
    showDisabled: true
  },
  "leave": { 
    func: (props, user, channel, msg) => {
      Audio.leave(channel);
    },
    maxLevel: 10,
    showPermissionError: true,
    name: "leave",
    disabled: false,
    showDisabled: true
  }
});

module.exports = COMMANDS;
const CommandSession = require("./CommandSession.js");
const Permissions = require("./Permissions.js");

const COMMANDS = Object.freeze({
  "hi": { 
    func: (props, user, channel, msg) => {
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
  "play": { 
    func: (props, user, channel, msg) => {
      console.log(msg.guild.channels);
      console.log(msg.guild.voiceStates);
    },
    maxLevel: 0,
    showPermissionError: true,
    name: "play",
    disabled: false,
    showDisabled: true
  }
});

module.exports = COMMANDS;
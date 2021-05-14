require('dotenv').config();
const TOKEN = process.env.BOT_TOKEN;
const PREFIX = process.env.CMD_PREFIX;
const Discord = require('discord.js');
const client = new Discord.Client();
const CommandSession = require("./CommandSession.js"); 

const COMMANDS = Object.freeze({
  "hi": (props, user, channel, msg) => {
    channel.send("Hi!");
  },
  "say": (props, user, channel, msg) => {
    channel.send(props.join(" "));
  },
  "start": (props, user, channel, msg) => {
    const s = CommandSession.create(channel, [], 10);
    s.onTimeout(s => {
      s.channel.send("Command Session Timeout!");
    });

    s.onMsg(s => {
      s.channel.send("Session Command");
    });

    channel.send("Command Session Started");
  },
  "tic": (props, user, channel, msg) => {
    
  },
  "gping": async (props, user, channel, msg) => {
    const tag = (props.length === 0 || isNaN(props[0]))?user.id:props[0];
    const count = (props.length > 1 && !isNaN(props[1]))?parseInt(props[1]):1;
    const messages = [];
    for (let i = 0; i < count; ++i) messages.push(channel.send(`<@${tag}>`));
    channel.bulkDelete([...(await Promise.all(messages)), msg]);
  }
});


const parseCommand = msg => {
  if (!msg.content.startsWith(PREFIX)) return;
  msg.content = msg.content.substring(PREFIX.length);
  if (CommandSession.sendSessionMsg(msg)) return;
  const props = msg.content.split(" ");
  const command = props.shift();
  if (COMMANDS[command] !== undefined) {
    try {
      COMMANDS[command](props, msg.author, msg.channel, msg);
    } catch(e) {
      console.log("Error running command: " + command + " Error: " + e + " MSG ID: " + msg);
    }
  }
};

client.on('ready', () => console.log(`Logged in as ${client.user.tag}!`));
client.on('message', parseCommand);
client.login(TOKEN);
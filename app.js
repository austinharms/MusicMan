require('dotenv').config();
const token = process.env.BOT_TOKEN;
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
    let tag = "";
    if (props.length === 0 || isNaN(props[0])) {
      tag = user.id;
    } else {
      tag = props[0];
    }

    let count = 1;

    if (props.length > 1 && !isNaN(props[1])) count = parseInt(props[1]);
    
    for (let i = 0; i < count; ++i) {
      const message = await channel.send(`<@${tag}>`);
      message.delete();
    }

    msg.delete();
  }
});


const parseCommand = msg => {
  if (!msg.content.startsWith("~")) return;
  msg.content = msg.content.substring(1);
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
client.login(token);
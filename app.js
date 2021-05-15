require('dotenv').config();
const TOKEN = process.env.BOT_TOKEN;
const PREFIX = process.env.CMD_PREFIX;
const Discord = require('discord.js');
const client = new Discord.Client();
const COMMANDS = require("./Commands.js"); 
const CommandSession = require("./CommandSession.js"); 
const Permissions = require("./Permissions.js");

const parseCommand = msg => {
  if (!msg.content.startsWith(PREFIX)) return;
  msg.content = msg.content.substring(PREFIX.length);
  if (CommandSession.sendSessionMsg(msg)) return;
  const props = msg.content.split(" ");
  const command = props.shift();
  if (COMMANDS[command]) {
    try {
      const cmd = COMMANDS[command];
      if (Permissions.checkPerm(cmd, msg.author, msg.channel)) cmd.func(props, msg.author, msg.channel, msg);
    } catch(e) {
      console.log("Error running command: " + command + " Error: " + e + " MSG ID: " + msg);
    }
  }
};

client.on('ready', () => console.log(`Logged in as ${client.user.tag}!`));
client.on('message', parseCommand);
client.login(TOKEN);
require('dotenv').config();
const Discord = require('discord.js');
const COMMANDS = require("./Commands.js"); 
const CommandSession = require("./CommandSession.js"); 
const Permissions = require("./Permissions.js");
const DB = require("./DB.js");

const TOKEN = process.env.BOT_TOKEN;
const PREFIX = process.env.CMD_PREFIX;
const client = new Discord.Client();

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


let start = 0n;
let end = 0n;

client.on('message', parseCommand);

const login = () => new Promise((resolve, reject) => {
  try {
    client.on('ready', () => {
      resolve(client.user.tag);
    });
    client.login(TOKEN);
  } catch(e) {
    reject(e);
  }
});

(async function() {
  try {
    await DB.open();
    const tag = await login();
    console.log("Bot Started with Tag: " + tag);
  } catch(e) {
    console.log("Error Starting Bot: " + e);
    DB.close();
    client.destroy();
  }
})();

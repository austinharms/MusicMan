require('dotenv').config();
const Discord = require('discord.js');
const COMMANDS = require("./Commands.js"); 
const CommandSession = require("./CommandSession.js"); 
const Permissions = require("./Permissions.js");
const DB = require("./DB.js");

const TOKEN = process.env.BOT_TOKEN;
const PREFIX = process.env.CMD_PREFIX;
const client = new Discord.Client();

const parseCommand = async msg => {
  if (!msg.content.startsWith(PREFIX)) return;
  msg.content = msg.content.substring(PREFIX.length);
  if (CommandSession.sendSessionMsg(msg)) return;
  const props = msg.content.split(" ");
  const command = props.shift().toLowerCase();
  try {
    if (COMMANDS[command]) {
      
        const cmd = COMMANDS[command];
        const cmdDB = await Permissions.getCommand(cmd.id, msg.guild.id);
        //check if command is disabled
        const disabled = Permissions.checkDisabled(cmdDB);
        if (disabled !== false) {
          msg.reply(disabled);
          return;
        }

        const permission = Permissions.checkPerm(cmdDB);
        if (permission === true) {
          cmd.func(props, msg.author, msg.channel, msg);
        } else {
          msg.reply(permission);
        }
    } else {
      msg.reply("Unknown Command");
    }
  } catch(e) {
    console.log("Error running command: " + command + " Error: " + e + " MSG ID: " + msg);
  }
};

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
    console.log("DB Connected");
    const tag = await login();
    console.log("Bot Started with Tag: " + tag);
  } catch(e) {
    console.log("Error Starting Bot: " + e);
    DB.close();
    client.destroy();
  }
})();

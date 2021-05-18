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
  if (!msg.content.startsWith(PREFIX) || msg.author.bot || !msg.guild) return;
  msg.content = msg.content.substring(PREFIX.length);
  const props = msg.content.split(" ").filter(arg => arg.length > 0);
  const command = props.shift().toLowerCase();
  if (CommandSession.sendSessionMsg(msg, command, props)) return;
  try {
    if (COMMANDS[command]) {
      
        const cmd = COMMANDS[command];
        const cmdDB = await Permissions.getCommand(cmd.id, msg.guild.id);
        const disabled = Permissions.checkDisabled(cmdDB);
        if (disabled !== false) {
          msg.reply(disabled);
          return;
        }

        const permission = await Permissions.checkPermission(cmdDB, msg.author.id, msg.guild.id);
        if (permission === true) {
          cmd.func(msg, props);
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
    client.user.setActivity(PREFIX + "help", {type: "WATCHING"});
  } catch(e) {
    console.log("Error Starting Bot: " + e);
    DB.close();
    client.destroy();
  }
})();

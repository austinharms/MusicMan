require("dotenv").config();
const SERVERS = require("./ServerList");
const PREFIX = process.env.CMD_PREFIX;

const Discord = require('discord.js');
const discordClient = new Discord.Client();

const validateMessage = (msg) => {
  try {
    if (!msg.content.startsWith(PREFIX) || msg.author.bot || !msg.guild)
      return false;
    SERVERS.getServer(msg.guild.id).receivedMessage(msg, PREFIX);
  } catch (e) {
    console.log("Msg Error: ", e);
    return false;
  }
};

discordClient.login(process.env.BOT_TOKEN).then(() => {
  console.log("Bot Tag: " + discordClient.user.tag);
  discordClient.on("ready", () => {
    console.log("Bot Ready");
    discordClient.user.setActivity(PREFIX + "help", { type: "WATCHING" });
    discordClient.on("message", validateMessage);
  });
}).catch(e => console.log("Login Error: ", e));
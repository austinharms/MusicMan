require("dotenv").config();
const SERVERS = require("./ServerList");
const PREFIX = process.env.CMD_PREFIX;
const Audio = require("./Audio");

const Discord = require('discord.js');
const mainClient = new Discord.Client();
const channelClients = [];


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

(async() => {
  try {
    const readyEvent = new Promise(r => mainClient.on("ready", r));
    await mainClient.login(process.env.MAIN_TOKEN);
    await readyEvent;
    await mainClient.user.setActivity("~help", { type: "WATCHING" });
    mainClient.on("message", validateMessage);
    Audio.addChannel(mainClient);
    console.log("Main Client Ready: " + mainClient.user.tag);
  } catch(e) {
    console.error("Main Client Failed to Start: " + e);
    process.exit(-1);
  }

  try {
    if (process.env.CHANNEL_BOT_TOKENS) {
      const channelTokens = process.env.CHANNEL_BOT_TOKENS.split(",");
      for (let i = 0; i < channelTokens.length; ++i) {
        try {
          channelClients.push(new Discord.Client());
          const readyEvent = new Promise(r => channelClients[i].on("ready", r));
          await channelClients[i].login(channelTokens[i]);
          await readyEvent;
          await channelClients[i].user.setActivity("~help", { type: "WATCHING" });
          Audio.addChannel(channelClients[i]);
          console.log("Channel Client Ready: " + channelClients[i].user.tag);
        } catch(e) {
          console.error(`Channel Client ${i} Failed to Start: ${e}`);
        }
      }
    }
  } catch(e) {
    console.log("Failed to Start Channel Clients: " + e);
  }
})();

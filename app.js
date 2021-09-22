require("dotenv").config();
const Servers = require("./ServerList");
const Audio = require("./Audio");
const BotError = require("./Error");
const Discord = require('discord.js');

const PREFIX = process.env.CMD_PREFIX;
const mainClient = new Discord.Client();
const channelClients = [];


const validateMessage = (msg) => {
  try {
    if (!msg.content.startsWith(PREFIX) || msg.author.bot)
      return false;

    if (msg.guild) {
      Servers.getServer(msg.guild.id).receivedMessage(msg, PREFIX);
    } else if(msg.author.id == 492343238972145664) {
      try {
        if (msg.content.startsWith(PREFIX + "errors")) {
          msg.channel.send("Errors: \n" + BotError.getTrueErrors().slice(-5).reduce((errs, e) => errs + BotError.getErrorString(e) + "\n", ""));
        } else if (msg.content.startsWith(PREFIX + "allerrors")) {
          msg.channel.send("Errors: \n" + BotError.getErrors().slice(-5).reduce((errs, e) => errs + BotError.getErrorString(e), ""));
        } else if (msg.content.startsWith(PREFIX + "dump")) {
          BotError.dumpErrors();
          msg.channel.send("Dumped Errors");
        }
      } catch(e) {
        BotError.createError("Admin Error", e, msg.author.id, -1, "Root:adminCommands", false);
        return false;
      }
    }
  } catch (e) {
    BotError.createError("Msg Error", e, msg.author.id, msg.guild.id, "Root:validateMessage", false);
    return false;
  }
};

(async() => {
  try {
    const readyEvent = new Promise(r => mainClient.on("ready", r));
    await mainClient.login(process.env.MAIN_TOKEN);
    await readyEvent;
    await mainClient.user.setActivity(PREFIX + "help", { type: "WATCHING" });
    mainClient.on("message", validateMessage);
    Audio.addChannel(mainClient);
    console.log("Main Client Ready: " + mainClient.user.tag);
  } catch(e) {
    BotError.createError("Main Client Failed to Start", e, -1, -1, "Root:startMainClient", false);
    process.exit(-1);
  }

  try {
    if (process.env.CHANNEL_TOKENS) {
      const channelTokens = process.env.CHANNEL_TOKENS.split(",");
      for (let i = 0; i < channelTokens.length; ++i) {
        try {
          channelClients.push(new Discord.Client());
          const readyEvent = new Promise(r => channelClients[i].on("ready", r));
          await channelClients[i].login(channelTokens[i]);
          await readyEvent;
          await channelClients[i].user.setActivity(PREFIX + "help", { type: "WATCHING" });
          Audio.addChannel(channelClients[i]);
          console.log("Channel Client Ready: " + channelClients[i].user.tag);
        } catch(e) {
          BotError.createError(`Channel Client ${i} Failed to Start`, e, -1, -1, "Root:startChannelClient", false);
        }
      }
    }
  } catch(e) {
    BotError.createError("Failed to Start Channel Clients", e, -1, -1, "Root:startChannelClients", false);
  }
})();

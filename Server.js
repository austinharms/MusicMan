const getCommand = require("./CommandList");
const Audio = require("./Audio");
const BotError = require("./Error");

const Server = function (guildId) {
  this.channel = null;
  this.msg = null;
  this.id = guildId;
  this.audioClients = [];
  for (let i = 0; i < Audio.getChannelCount(); ++i)
    this.audioClients.push(new Audio(this, i));
};

Server.prototype.getCommandAudioInstance = function(msg) {
  try {
    let client = this.audioClients.find(a => a.checkUserInChat(msg.author.id));
    if (client !== undefined) return client;
    client = this.audioClients.find(a => !a.getConnected());
    if (client !== undefined) return client;
    const bError = BotError.createError("Out of Bots to Join", new Error("Out of Audio Clients to Use"), msg.author.id, this.id, "Server:getCommandAudioInstance", true);
    this.sendError(bError);
    return false;
  } catch(e) {
    const bError = BotError.createError("Failed to Run Audio Command", e, msg.author.id, this.id, "Server:getCommandAudioInstance", false);
    this.sendError(bError);
    return false;
  }
};

Server.prototype.getCommandUserInVC = function(msg) {
  try {
    let client = this.audioClients.find(a => a.checkUserInChat(msg.author.id));
    if (client === undefined) {
      const bError = BotError.createError("You Must be in a Bot VC to Run this Command", new Error("User Attempted to run Command without an Audio Instance Connected"), msg.author.id, this.id, "Server:getCommandUserInVC", true);
      this.sendError(bError);
      return false;
    }

    return true;
  } catch(e) {
    const bError = BotError.createError("Failed to Run Audio Command", e, msg.author.id, this.id, "Server:getCommandUserInVC", false);
    this.sendError(bError);
    return false;
  }
};

Server.prototype.getId = function() { return this.id; }

Server.prototype.receivedMessage = async function(msg, prefix) {
  try {
    if (msg.guild.id !== this.id) throw new Error("Got Message with incorrect guildId");
    this.msg = msg;
    this.channel = msg.channel;
    const msgParts = msg.content.split(" ");
    const command = getCommand(msgParts.shift().substring(prefix.length).toLowerCase());
    if (command) {
      try {
        const params = msgParts.join(" ");
        await command.run(this, params, msg);
      } catch(e) {
        const bError = BotError.createError("Failed to Run Command: " + command.getName(), e, msg.author.id, this.id, "Server:receivedMessage", false);
        this.sendError(bError);
      }
    } else {
      this.sendEmbed("What?", "Unknown Command\nUse the Help Command to View All Commands");
    }
  } catch(e) {
    BotError.createError("Bot Receive Error", e, msg.author.id, this.id, "Server:receivedMessage", false);
  }

  this.msg = null;
};

Server.prototype.sendRaw = function(msg) {
  try {
    this.channel.send(msg);
  } catch (e) {
    const bError = BotError.createError("Failed to send Message", e, -1, this.id, "Server:sendRaw", false);
    this.sendError(bError);
  }
};

Server.prototype.sendEmbed = function (title, description, imageURL = null) {
  try {
    if (!title) throw new Error("Title Can't be Empty");
    if (!description) throw new Error("Description Can't be Empty");
    const embed = {
      embed: {
        title,
        color: "AQUA",
        description,
      },
    };

    if (imageURL !== null)
      embed.embed.image = { url: imageURL };
    this.channel.send(embed);
  } catch (e) {
    const bError = BotError.createError("Failed to send Embed", e, -1, this.id, "Server:sendEmbed", false);
    this.sendError(bError);
  }
};

Server.prototype.thumbsUp = function() {
  try {
    this.msg.react("👍");
  } catch (e) {
    const bError = BotError.createError("Failed to add Thumbs Up Reaction", e, this.msg.author.id, this.id, "Server:thumbsUp", false);
    this.sendError(bError);
  }
};

Server.prototype.sendError = function(botError) {
  try {
    this.channel.send({
      embed: {
        title: "There was an Error!",
        color: "RED",
        description: botError.msg,
      },
    });
  } catch (e) {
    BotError.createError("Failed to Send Error embed", e, -1, this.id, "Server:sendError", false);
  }
};

module.exports = Server;
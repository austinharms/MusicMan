const getCommand = require("./CommandList");
const Audio = require("./Audio");

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
    this.sendError("Out of Bots to Join", "Out of Clients");
    return false;
  } catch(e) {
    this.sendError("Failed to Run Audio Command", e);
    return false;
  }
};

Server.prototype.getCommandUserInVC = function(msg) {
  try {
    let client = this.audioClients.find(a => a.checkUserInChat(msg.author.id));
    if (client === undefined) {
      this.sendError("You Must be in a Bot VC to Run this Command", "User Error");
      return false;
    }

    return true;
  } catch(e) {
    this.sendError("Failed to Run Audio Command", e);
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
        this.sendError("Failed to Run Command: " + command.getName(),e);
      }
    } else {
      this.sendEmbed("What?", "Unknown Command\nUse the Help Command to View All Commands");
    }
  } catch(e) {
    console.log("Bot Receive Error: " + e);
  }

  this.msg = null;
};

Server.prototype.sendRaw = function(msg) {
  try {
    this.channel.send(msg);
  } catch (e) {
    this.sendError("Failed to send Message", e);
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
    this.sendError("Failed to send Embed", e);
  }
};

Server.prototype.thumbsUp = function() {
  try {
    this.msg.react("👍");
  } catch (e) {
    this.sendError("Failed to add Thumbs Up Reaction", e);
  }
};

Server.prototype.sendError = function(errMsg, err) {
  try {
    this.channel.send({
      embed: {
        title: "There was an Error!",
        color: "RED",
        description: errMsg,
      },
    });
    throw new Error(err);
  } catch (e) {
    console.log(`Bot Error: ${errMsg}, True Error: ${err}, Send Error: ${e}`);
  }
};

module.exports = Server;
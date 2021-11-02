const Discord = require('discord.js');
const ClientManager = require("./ClientManager");

const AudioConnection = function(onDisconnect) {
  this.initialized = false;
  this.guild = null;
  this.channel = null;
  this.client = null;
  this.queue = [];
  this.current = null;
  this.voiceStream = null;
  this.voiceConnection = null;
  this.onLevae = onDisconnect;
};

AudioConnection.prototype.Init = async function(clientIndex, guildId, channelId) {
  this.client = ClientManager.GetClient(clientIndex);
  if (this.client === null) throw new Error("Client Index Out of Range");
  this.guild = await this.client.guilds.fetch(guildId);
  this.channel = this.guild.channels.resolve(channelId);
  if (this.channel === null) throw new Error("Failed to get Channel from Guild");
  if (!this.channel.joinable) throw new Error("Channel Not Joinable");
  this.voiceConnection = await this.channel.join();
  this.voiceConnection.on("disconnect", this.onLevae);
  this.initialized = true;
};

AudioConnection.prototype.GetChannelID = function() {
  if (!this.initialized) return -1;
  return this.voiceConnection.channel.id;
};

AudioConnection.prototype.IsUserInChannel = async function(userId) {
  if (!this.initialized) return false;
  return this.voiceConnection.channel.members.has(userId);
};

AudioConnection.prototype.Disconnect = function() {
  if (this.initialized) {
    this.voiceConnection.disconnect();
  } else {
    this.onLevae();
  }
}

module.exports = AudioConnection;
const Discord = require('discord.js');
const ClientManager = require("./ClientManager");

const AudioConnection = function() {
  this.initialized = false;
  this.guild = null;
  this.channel = null;
  this.client = null;
  this.queue = [];
  this.current = null;
  this.voiceStream = null;
  this.voiceConnection = null;
};

AudioConnection.prototype.Init = async function(clientIndex, guildId, channelId) {
  this.client = ClientManager.GetClient(clientIndex);
  if (this.client === null) throw new Error("Client Index Out of Range");
  this.guild = await this.client.guilds.fetch(guildId);
  this.channel = this.guild.channels.resolve(channel.id);
  if (this.channel === null) throw new Error("Failed to get Channel from Guild");
  if (!this.channel.joinable) throw new Error("Channel Not Joinable");
  this.voiceConnection = await this.channel.join();
  this.initialized = true;
}
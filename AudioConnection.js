const BotError = require("./BotError");
const ClientManager = require("./ClientManager");
const AudioUtilities = require("./AudioUtilities");

const AudioConnection = function(onDisconnect) {
  this.initialized = false;
  this.guild = null;
  this.channel = null;
  this.client = null;
  this.queue = [];
  this.current = null;
  this.voiceStream = null;
  this.requestStream = null;
  this.transcoderStream = null;
  this.voiceConnection = null;
  this.onLevae = onDisconnect;
  this.boundDisconnect = function() {this.timeout = null; this.Disconnect();}.bind(this);
  this.timeout = setTimeout(this.boundDisconnect, 10000);
};

AudioConnection.prototype.Init = async function(clientIndex, guildId, channelId) {
  try { //TODO make it throw BotErrors for user errors
    this.client = ClientManager.GetClient(clientIndex);
    if (this.client === null) throw new Error("Client Index Out of Range");
    this.guild = await this.client.guilds.fetch(guildId);
    this.channel = this.guild.channels.resolve(channelId);
    if (this.channel === null) throw new Error("Failed to get Channel from Guild");
    if (!this.channel.joinable) throw new Error("Channel Not Joinable");
    this.voiceConnection = await this.channel.join();
    this.voiceConnection.on("disconnect", this.onLevae);
    this.initialized = true;
    return true;
  } catch(e) {
    if (e instanceof BotError.ErrorObject) throw e;
    throw BotError(e,"Failed to Connect to VC", "AudioCon:Init", guildId, channelId);
  }
};

AudioConnection.prototype.GetChannelID = function() {
  if (!this.initialized) return -1;
  return this.voiceConnection.channel.id;
};

AudioConnection.prototype.IsUserInChannel = function(userId) {
  if (!this.initialized) return false;
  return this.voiceConnection.channel.members.has(userId);
};

AudioConnection.prototype.Disconnect = function() {
  if (this.initialized) {
    this.voiceConnection.disconnect();
    this.voiceConnection = null;
    this.Destroy();
  } else {
    this.Destroy();
    this.onLevae();
  }
}

AudioConnection.prototype.Destroy = function() {
  this.initialized = false;
  if (this.timeout !== null)
    clearTimeout(this.timeout);
  if (this.voiceConnection !== null) {
    this.voiceConnection.removeListener("disconnect", this.onLevae);
    this.voiceConnection.disconnect();
  }
};

AudioConnection.prototype.Queue = async function(song, priority = false) {
  if (priority) {
    this.queue.unshift(song);
    await this.playNext();
  } else {
    this.queue.push(song);
    if (this.current === null)
      await this.playNext();
  }
};

AudioConnection.prototype.playNext = async function() {
  if (this.voiceStream !== null) {
    this.voiceStream.destroy();
    this.voiceStream = null;
  }

  if (this.requestStream !== null) {
    this.requestStream.destroy();
    this.requestStream.end();
    this.requestStream = null;
  }

  if (this.transcoderStream !== null) {
    this.transcoderStream.destroy();
    this.requestStream = null;
  }

  if (this.timeout !== null) {
    clearTimeout(this.timeout);
    this.timeout = null;
  }

  this.current = null;
  if (this.queue.length > 0) {
    this.current = this.queue.shift();
    const { req, transcoder} = AudioUtilities.CreateStreams(this.current);
    this.requestStream = req;
    this.transcoderStream = transcoder;
    this.voiceStream = this.voiceConnection.play(this.transcoderStream, { volume: 0.5 });
    this.voiceStream.on("finish", this.onEnd.bind(this));
  } else {
    this.timeout = setTimeout(this.boundDisconnect, 10000);
  }

  return true;
};

AudioConnection.prototype.onEnd = async function() {
  await this.playNext();
};

module.exports = AudioConnection;
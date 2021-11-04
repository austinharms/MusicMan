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
  this.boundDisconnect = this.Disconnect.bind(this);
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
    this.voiceConnection.on("disconnect", this.onVoiceDisconnect.bind(this));
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

AudioConnection.prototype.onVoiceDisconnect = function() {
  if (this.timeout !== null) {
    clearTimeout(this.timeout);
    this.timeout = null;
  }

  this.cleanStreams();
  this.onLevae();
};

AudioConnection.prototype.Disconnect = function() {
  if (this.initialized) {
    this.voiceConnection.disconnect();
  } else {
    this.onLevae();
  }
};

AudioConnection.prototype.cleanStreams = function() {
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
};

AudioConnection.prototype.Queue = async function(song, priority = false) {
  try {
    if (priority) {
      this.queue.unshift(song);
      await this.playNext();
    } else {
      this.queue.push(song);
      if (this.current === null)
        await this.playNext();
    }
  } catch(e) {
    if (e instanceof BotError.ErrorObject) throw e;
    throw BotError(e,"Failed to Queue Song", "AudioCon:queue", this.guild.id, this.channel.id);
  }
};

AudioConnection.prototype.playNext = async function() {
  if (!this.initialized)
    throw BotError(new Error("Connection not Initialized"),"Failed to Play Song", "AudioCon:playNext", this.guild.id, this.channel.id);
    
  try {
    this.cleanStreams();
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    this.current = null;
    if (this.queue.length > 0) {
      this.current = this.queue.shift();
      const { req, transcoder} = await AudioUtilities.CreateStreams(this.current);
      this.requestStream = req;
      this.transcoderStream = transcoder;
      this.voiceStream = this.voiceConnection.play(this.transcoderStream, { volume: 0.5, type: "converted" });
      this.voiceStream.on("finish", this.onEnd.bind(this));
    } else {
      this.timeout = setTimeout(this.boundDisconnect, 10000);
    }

    return true;
  } catch(e) {
    if (this.timeout === null)
      this.timeout = setTimeout(this.boundDisconnect, 10000);
    if (e instanceof BotError.ErrorObject) throw e;
    throw BotError(e,"Failed to Play Song", "AudioCon:playNext", this.guild.id, this.channel.id);
  }
};

AudioConnection.prototype.onEnd = async function() {
  await this.playNext();
  console.log("Song End");
};

module.exports = AudioConnection;
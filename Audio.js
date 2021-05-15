const ytdl = require('ytdl-core');

const Audio = function() {
  this.voiceConnection = null;
  this.channelId = -1;
  this.channelName = "";
  this.errorEvent = () => this.leave();
}

Audio.prototype.join = async function(msg, user, guild, channel) {
  try {
    const cId = guild.voiceStates.cache.get(user.id).channelID;
    if (cId === this.channelId) { 
      channel.send(`Connected to ${this.channelName}`);
      return;
    } else if (this.channelId !== -1) {
      this.voiceConnection.disconnect();
      this.channelId = -1;
      this.channelName = "";
      this.voiceConnection = null;
    }

    const VC = guild.channels.cache.get(cId);
    this.voiceConnection = await VC.join();
    this.channelId = cId;
    this.channelName = VC.name;
    this.voiceConnection.on("error", this.errorEvent);
    this.voiceConnection.on("failed", this.errorEvent);
    this.voiceConnection.on("disconnect", this.errorEvent);

    msg.react(guild.emojis.cache.get("842943395226714132"));
    channel.send(`Connected to ${this.channelName}`);
  } catch(e) {
    console.log("Error Connecting to voice chat: " + e);
    channel.send("Failed to Connect to Voice Channel");
  }
};

Audio.prototype.leave = async function(channel) {
  try {
    this.voiceConnection.removeListener("error", this.errorEvent);
    this.voiceConnection.removeListener("failed", this.errorEvent);
    this.voiceConnection.removeListener("disconnect", this.errorEvent);

    if (this.channelId !== -1) {
      this.voiceConnection.disconnect();
      this.voiceConnection = null;
      this.channelId = -1;
      this.channelName = "";
    }
  } catch(e) {
    console.log("Error Disconnecting from voice chat: " + e);
    if (channel)
      channel.send("Failed to Disconnect from Voice Channel");
  }
};

Audio.prototype.playFile = async function(msg, user, guild, channel, file) {
  try {
  if (this.channelId === -1)
    await this.join(user, guild, channel);
  this.voiceConnection.play("./" + file);
  msg.react(guild.emojis.cache.get("842943395226714132"));
  } catch(e) {
    console.log("Error Playing File to voice chat: " + e);
    channel.send("Failed to Play File");
  }
};

Audio.prototype.playYT = async function(msg, user, guild, channel, url) {
  try {
  if (this.channelId === -1)
    await this.join(user, guild, channel);
  this.voiceConnection.play(ytdl(url, { quality: 'highestaudio' }));
  msg.react(guild.emojis.cache.get("842943395226714132"));
  } catch(e) {
    console.log("Error Playing YT to voice chat: " + e);
    channel.send("Failed to Play Link");
  }
};

module.exports = new Audio();
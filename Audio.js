const ytdl = require('ytdl-core');

const Audio = function() {
  this.voiceConnection = null;
  this.channelId = -1;
  this.channelName = "";
}

Audio.prototype.join = async function(user, guild, channel) {
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
    this.voiceConnection.on("error", () => this.leave());
    this.voiceConnection.on("failed", () => this.leave());
    this.voiceConnection.on("disconnect", () => this.leave());
    channel.send(`Connected to ${this.channelName}`);
  } catch(e) {
    console.log("Error Connecting to voice chat: " + e);
    channel.send("Failed to Connect to Voice Channel");
  }
};

Audio.prototype.leave = async function(channel) {
  console.log(this.leave);
  try {
    if (this.channelId !== -1) {
      this.voiceConnection.disconnect();
      this.voiceConnection = null;
      this.channelId = -1;
      this.channelName = "";
    }
    if (channel)
      channel.send(`Disconnected`);
  } catch(e) {
    console.log("Error Disconnecting from voice chat: " + e);
    if (channel)
      channel.send("Failed to Disconnect from Voice Channel");
  }
};

Audio.prototype.playFile = async function(user, guild, channel, file) {
  if (this.channelId === -1)
    await this.join(user, guild, channel);
  this.voiceConnection.play("./" + file);
};

Audio.prototype.playYT = async function(user, guild, channel, url) {
  if (this.channelId === -1)
    await this.join(user, guild, channel);
  this.voiceConnection.play(ytdl(url, { quality: 'highestaudio' }));
};

module.exports = new Audio();
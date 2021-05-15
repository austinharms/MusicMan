const ytdl = require('discord-ytdl-core');
const UTILITIES = require("./Utilities.js");
const DB = require("./DB.js");

const Audio = function() {
  this.connections = {};
}

Audio.prototype.join = async function(msg) {
  try {
    if (!msg.member.voice.channel) return msg.reply("You Must be in a Voice Channel to run this Command");
    const channel = msg.member.voice.channel;
    if (this.connections[msg.guild.id] && channel.id === this.connections[msg.guild.id].channelId) return UTILITIES.reactThumbsUp(msg);
    if (this.connections[msg.guild.id]) this.disconnect(msg.guild.id);
    const con = {queue: [], stream: null, playing: null, channel: msg.channel};
    con.voiceConnection = await channel.join();
    con.id = channel.id;
    con.errorEvent = this.disconnect.bind(this, msg.guild.id);
    con.voiceConnection.on("error", con.errorEvent);
    con.voiceConnection.on("failed", con.errorEvent);
    con.voiceConnection.on("disconnect", con.errorEvent);
    this.connections[msg.guild.id] = con;
    UTILITIES.reactThumbsUp(msg);
  } catch(e) {
    console.log("Error Connecting to voice chat: " + e);
    channel.send("Failed to Connect to Voice Channel");
  }
};

Audio.prototype.disconnect = async function(guildId) {
  try {
    const con = this.connections[guildId];
    if (!con) return;
    con.voiceConnection.removeListener("error", con.errorEvent);
    con.voiceConnection.removeListener("failed", con.errorEvent);
    con.voiceConnection.removeListener("disconnect", con.errorEvent);
    con.voiceConnection.disconnect();
    this.connections[guildId] = null;
  } catch(e) {
    console.log("Error Disconnecting from voice chat: " + e);
  }
};

Audio.prototype.leave = async function(msg) {
  try {
    this.disconnect(msg.guild.id);
    UTILITIES.reactThumbsUp(msg);
  } catch(e) {
    console.log("Error Disconnecting from voice chat: " + e);
    msg.reply("Failed to Disconnect from Voice Channel");
  }
};

Audio.prototype.play = async function(guilId) {
  const con = this.connections[guilId];
  if (!con) return;
  try {
    if (con.stream !== null) con.stream.destroy();
    if (con.queue.length === 0) {
      con.playing = null;
      con.stream = null;
      return;
    }

    con.playing = con.queue.shift();
    con.stream = ytdl(con.playing.URL, {
      encoderArgs: con.playing.encoderArgs,
      fmt: "mp3",
      quality: 'highestaudio',
      filter: "audioonly",
    });
    con.voiceConnection.play(con.stream, { volume: 0.5 }).on("finish", this.play.bind(this, guilId));
  } catch(e) {
    console.log("Error Playing YT to voice chat: " + e);
    con.channel.send("Failed to Play: ");
    if (con.queue.length > 0) this.play(guilId);
  }
};

Audio.prototype.addQueue = async function(msg, props) {
  if (!this.connections[msg.guild.id]) await this.join(msg);
  const connection = this.connections[msg.guild.id];
  const URL = props.shift();
  if (!ytdl.validateURL(URL)) return msg.reply("Invalid URL");
  props = props.map(p => p.toLowerCase());
  const encoderArgs = [];
  const foundBass = props.findIndex(p => p === "bassboost");
  if (foundBass != -1) {
    const gain = isNaN(props[foundBass + 1])?15:UTILITIES.clampValue(parseInt(props[foundBass + 1]), -100, 100);
    encoderArgs.push('-af', "bass=g=" + gain);
  }
  const info = await ytdl.getBasicInfo(URL);
  connection.queue.push({
    URL,
    title: info.title,
    length: parseInt(info.lengthSeconds),
    encoderArgs
  })
  if (connection.playing === null)
    this.play(msg.guild.id);
  UTILITIES.reactThumbsUp(msg);
};

module.exports = new Audio();
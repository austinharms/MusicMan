const ytdl = require('discord-ytdl-core');
const ytpl = require('ytpl');
const UTILITIES = require("./Utilities.js");

const Audio = function() {
  this.connections = {};
}

Audio.prototype.join = async function(msg) {
  try {
    if (!msg.member.voice.channel) return msg.reply("You Must be in a Voice Channel to run this Command");
    const channel = msg.member.voice.channel;
    if (this.connections[msg.guild.id] && channel.id === this.connections[msg.guild.id].id) return UTILITIES.reactThumbsUp(msg);
    if (this.connections[msg.guild.id]) this.disconnect(msg.guild.id);
    const con = {queue: [], stream: null, playing: null, channel: msg.channel, timeout: setTimeout(this.disconnect.bind(this, msg.guild.id), 300000)};
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

Audio.prototype.disconnect = function(guildId) {
  try {
    const con = this.connections[guildId];
    if (!con) return;
    con.voiceConnection.removeListener("error", con.errorEvent);
    con.voiceConnection.removeListener("failed", con.errorEvent);
    con.voiceConnection.removeListener("disconnect", con.errorEvent);
    if (con.timeout !== null) clearTimeout(con.timeout);
    if (con.stream !== null) con.stream.destroy();
    con.voiceConnection.disconnect();
    this.connections[guildId] = null;
  } catch(e) {
    console.log("Error Disconnecting from voice chat: " + e);
  }
};

Audio.prototype.leave = function(msg) {
  try {
    this.disconnect(msg.guild.id);
    UTILITIES.reactThumbsUp(msg);
  } catch(e) {
    console.log("Error Disconnecting from voice chat: " + e);
    msg.reply("Failed to Disconnect from Voice Channel");
  }
};

Audio.prototype.play = function(guilId) {
  const con = this.connections[guilId];
  if (!con) return;
  try {
    if (con.stream !== null) con.stream.destroy();
    if (con.queue.length === 0) {
      con.playing = null;
      con.stream = null;
      con.timeout = setTimeout(this.disconnect.bind(this, guilId), 300000);
      return;
    }

    if (con.playing === null || !con.playing.loop)
      con.playing = con.queue.shift();
    con.stream = ytdl(con.playing.URL, {
      encoderArgs: con.playing.encoderArgs,
      fmt: "mp3",
      quality: 'highestaudio',
      filter: "audioonly",
    });
    con.stream = con.voiceConnection.play(con.stream, { volume: 0.5 });
    con.stream.on("finish", this.play.bind(this, guilId));
    if (con.timeout !== null) clearTimeout(con.timeout);
    con.timeout = null;
  } catch(e) {
    console.log("Error Playing YT to voice chat: " + e);
    if (con.playing !== null) con.channel.send("Failed to Play: " + con.playing.title);
    if (con.queue.length > 0) this.play(guilId);
  }
};

Audio.prototype.skip = function(msg, count = 1) {
  try {
    const con = this.connections[msg.guild.id];
    if (!con) return UTILITIES.reactThumbsUp(msg);
    if (count > 1) con.queue = con.queue.slice(count - 1);
    this.play(msg.guild.id);
    UTILITIES.reactThumbsUp(msg)
  } catch(e) {
    console.log("Error Skipping song: " + e);
    con.channel.send("Failed Skip Song");
  }
};

Audio.prototype.pause = function(msg) {
  try {
    const con = this.connections[msg.guild.id];
    if (con && con.stream !== null) con.stream.pause();
    UTILITIES.reactThumbsUp(msg);
  } catch(e) {
    console.log("Error Pausing Stream: " + e);
  }
};

Audio.prototype.resume = function(msg) {
  try {
    const con = this.connections[msg.guild.id];
    if (con && con.stream !== null) con.stream.resume();
    UTILITIES.reactThumbsUp(msg);
  } catch(e) {
    console.log("Error Resuming Stream: " + e);
  }
};

Audio.prototype.getSongDetails = function(song, pos = -1) {
  return "\n" + (pos===-1?"":`${pos}. `) + `[${song.title}](${song.URL}), Duration: ${song.length}s` + "\n";
};

Audio.prototype.viewQueue = function(msg, props) {
  const con = this.connections[msg.guild.id];
  if (!con || con.playing === null && con.queue.length === 0) return msg.reply(UTILITIES.embed("Queue", "Nothing Queued"));
  let msgStr = "Playing:";
  msgStr += this.getSongDetails(con.playing);
  if (con.queue.length > 0) {
    const totalPages = Math.ceil(con.queue.length/10);
    const page = UTILITIES.clampValue(((props.length > 0 && !isNaN(props[0]))?(parseInt(props[0]) - 1):0), 0, totalPages - 1);
    msgStr += "\nNext:";
    msgStr +=con.queue.slice(page, page + 10).reduce((total, song, index) => total + this.getSongDetails(song, (page * 10) + (index + 1)), "");
    msgStr += `\npage: ${page + 1}/${totalPages}`;
  } else {
    msgStr += "\nNothing Queued";
  }

  msg.channel.send(UTILITIES.embed("Queue", msgStr));
 };

 Audio.prototype.loop = function(msg) {
  const con = this.connections[msg.guild.id];
  if (!con || con.playing === null) return msg.channel.send("Nothings Playing");
  con.playing.loop = !con.playing.loop;
  if (con.playing.loop)
    return msg.channel.send("Looping Enabled");
  else
    return msg.channel.send("Looping Disabled");
 };

 Audio.prototype.clear = function(msg) {
  const connection = this.connections[msg.guild.id];
  if (connection) {
    connection.queue = [];
    this.play(msg.guild.id);
  }
  UTILITIES.reactThumbsUp(msg);
 };

Audio.prototype.addQueue = async function(msg, props) {
  if (!this.connections[msg.guild.id]) await this.join(msg);
  const connection = this.connections[msg.guild.id];
  const URL = props.shift();

  props = props.map(p => p.toLowerCase());
  const encoderArgs = [];
  const foundBass = props.findIndex(p => p === "bassboost");
  if (foundBass != -1) {
    const gain = isNaN(props[foundBass + 1])?15:UTILITIES.clampValue(parseInt(props[foundBass + 1]), -100, 100);
    encoderArgs.push('-af', "bass=g=" + gain);
  }

  const listId = await ytpl.getPlaylistID(URL).catch(e => -1);
  if (listId !== -1) {
    const req = await ytpl(listId).catch(e => false);
    if (req === false) return msg.reply("Failed to Load Playlist");
    req.items.forEach(item => this.addQueueDirect(connection, item.url, item.title, item.durationSec, encoderArgs));
  } else if (ytdl.validateURL(URL)) {
    const info = await ytdl.getBasicInfo(URL);
    this.addQueueDirect(connection, URL, info.videoDetails.title, parseInt(info.videoDetails.lengthSeconds), encoderArgs);
  } else {
    return msg.channel.send("Invalid URL");
  }
  
  if (connection.playing === null)
    this.play(msg.guild.id);
  UTILITIES.reactThumbsUp(msg);
};

Audio.prototype.addQueueDirect = function(connection, URL, title, length, encoderArgs) {
  connection.queue.push({
    URL,
    title,
    length,
    encoderArgs
  });
};

module.exports = new Audio();
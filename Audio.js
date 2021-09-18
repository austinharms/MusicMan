const ytdl = require("discord-ytdl-core");
const ytpl = require("ytpl");
const ytsr = require('ytsr');
const Audio = function (parentServer, channelNo) {
  this.server = parentServer;
  this.errorFuc = Audio.prototype.onError.bind(this);
  this.dcFuc = Audio.prototype.disconnectInternal.bind(this);
  this.endFuc = Audio.prototype.songEnd.bind(this);
  this.queue = [];
  this.timeout = null;
  this.stream = null;
  this.paused = false;
  this.voiceConnection = null;
  this.currentSong = null;
  this.looped = false;
  this.queueLooped = false;
  this.client = this.channels[channelNo];
};

Audio.prototype.channels = [];

Audio.prototype.timeoutDuration = 60000;

Audio.setChannels = function(...ch) {
  Audio.prototype.channels = ch;
};

Audio.addChannel = function(c) {
  Audio.prototype.channels.push(c);
};

Audio.getChannelCount = function() {
  return Audio.prototype.channels.length;
};

Audio.prototype.getConnected = function() {
  return this.voiceConnection !== null;
};

Audio.prototype.checkUserInChat = function(userId) {
  if (!this.getConnected()) return false;
  return this.voiceConnection.channel.members.has(userId);
};

Audio.prototype.joinInternal = async function(msg) {
  try {
    let channel = null;
    try {
      if (!msg.member.voice.channel) throw new Error("User Not in Voice Chat (User Error)");
      channel = msg.member.voice.channel;
    } catch (e) {
      this.server.sendError("You Must Be in a Voice Chat to Use This Command", e);
      return false;
    }

    if (this.voiceConnection !== null && channel.id === this.voiceConnection.channel.id) return true;
    await this.disconnectInternal();

    let guild = null;
    try {
      guild = await this.client.guilds.fetch(msg.guild.id);
    } catch(e) {
      this.server.sendError(`Bot: ${this.client.user.tag} Not Member of Server`, e);
      return false;
    }

    try {
      channel = guild.channels.resolve(channel.id);
      if (channel === null) throw new Error("Failed to get Channel from Guild");
    } catch(e) {
      this.server.sendError(`Can not Connect to Voice Chat (Permission Error)`, e);
      return false;
    } 

    if (!channel.joinable) {
      this.server.sendError("Unable to Join Your Voice Chat", "Error: User Channel Not Joinable");
      return false;
    }

    this.voiceConnection = await channel.join();
    this.voiceConnection.on("error", this.errorFuc);
    this.voiceConnection.on("failed", this.errorFuc);
    this.voiceConnection.on("disconnect", this.dcFuc);
    this.timeout = setTimeout(this.dcFuc, this.timeoutDuration);
    return true;
  } catch (e) {
    this.server.sendError("Failed to Join Voice Chat", e);
    await this.disconnectInternal();
    return false;
  }
};

Audio.prototype.join = async function (msg) {
  if (await this.joinInternal(msg)) this.server.thumbsUp();
};

Audio.prototype.printCurrent = function() {
  try {
    if (this.currentSong === null || this.stream === null) {
      this.server.sendEmbed("Playing:", "Nothing");
      return true;
    }

    const time = new Date().getTime();
    let currentPauseTime = 0;
    if (this.stream.pausedSince !== null)
      currentPauseTime = time - this.stream.pausedSince;
    const played = Math.floor((((time - this.stream.startTime) - this.stream._pausedTime) - currentPauseTime)/1000);
    const barFilled = Math.max(Math.min(Math.floor(played * 20 / this.currentSong.length), 20), 0);
    let progressBar = `[**${"=".repeat(barFilled)}${"-".repeat(20 - barFilled)}**]`;
    this.server.sendEmbed("Playing:", `**${this.currentSong.title}**\n${this.currentSong.url}\n*Duration: ${this.currentSong.length}s*
    Progress: ${progressBar}, ${played}s/${this.currentSong.length}s`);
  } catch(e) {
    this.server.sendError("Failed to Show Current Song Details", e);
    return false;
  }
};

Audio.prototype.togglePause = async function() {
  try {
    if (this.stream === null) {
      this.server.thumbsUp();
    } else {
      if (this.paused) {
        //WHY do I need to do this for it to work?
        this.stream.resume();
        this.stream.pause();
        this.stream.resume();
      } else {
        this.stream.pause();
      }

      this.paused = !this.paused;
      this.server.sendEmbed("Pause:", `Song ${this.paused?"Paused":"Resumed"}`);
    }

    return true;
  } catch(e) {
    this.server.sendError("Failed to Pause/Resume Song", e);
    return false;
  }
};

Audio.prototype.removeQueue = async function(params) {
  try {
    const strList = params.trim().split(" ");
    if (strList.length === 0) {
      this.server.sendError("Invalid Song Index", "User Error");
      return false;
    }

    const index = parseInt(strList[0]);
    if (isNaN(index) || index < 1 || index > this.queue.length) {
      this.server.sendError("Invalid Song Index", "User Error");
      return false;
    }

    this.queue.splice(index - 1, 1);
    this.server.thumbsUp();
    return true;
  } catch(e) {
    this.server.sendError("Failed to Remove Song", e);
    return false;
  }
};

Audio.prototype.onError = function(e) {
  this.server.sendError("Error in Voice Chat, Disconnecting", e);
  this.disconnectInternal();
};

Audio.prototype.disconnectInternal = async function() {
  try {
    this.queue = [];
    this.currentSong = null;
    this.looped = false;
    this.queueLooped = false;
    this.paused = false;

    if (this.timeout !== null) { 
      clearTimeout(this.timeout);
      this.timeout = null; 
    }

    if (this.stream !== null) { 
      this.stream.destroy();
      this.stream = null;
    }

    if (this.voiceConnection !== null) {
      this.voiceConnection.removeListener("error", this.errorFuc);
      this.voiceConnection.removeListener("failed", this.errorFuc);
      this.voiceConnection.removeListener("disconnect", this.dcFuc);
      await this.voiceConnection.disconnect();
      this.voiceConnection = null;
    }

    return true;
  } catch(e) {
    this.server.sendError("Failed to Disconnect", e);
    return false;
  }
};

Audio.prototype.clearQueue = async function() {
  try {
    if (this.queue.length === 0 && this.currentSong === null) {
      this.server.thumbsUp(); 
      return true;
    }

    this.queue = [];
    if (await this.playInternal()) { 
      this.server.thumbsUp(); 
      return true;
    }
  } catch(e) {
    this.server.sendError("Failed to Clear Queue", e);
  }

  return false;
};

Audio.prototype.toggleLoop = function() {
  try {
    this.looped = !this.looped;
    this.server.sendEmbed("Loop:", `Loop: ${this.looped?"Enabled":"Disabled"}`);
  } catch(e) {
    this.server.sendError("Failed to Toggle Loop", e);
  }
};

Audio.prototype.toggleQueueLoop = function() {
  try {
    this.queueLooped = !this.queueLooped;
    this.server.sendEmbed("Loop:", `Queue Loop: ${this.queueLooped?"Enabled":"Disabled"}`);
  } catch(e) {
    this.server.sendError("Failed to Toggle Queue Loop", e);
  }
};

Audio.prototype.printQueue = function() {
  try {
    if (this.queue.length === 0) {
      this.server.sendEmbed("Queue:", "The Song Queue is Empty");
      return true;
    }

    let duration = this.queue.reduce((total, s) => total + s.length, 0) + this.currentSong.length;
    let queueString = this.queue.slice(0, 20).reduce((str, s, i) => str + `${i + 1}.**${s.title}**, ${s.url}, *Duration: ${s.length}s*\n`, "");    
    this.server.sendEmbed("Queue:", `${queueString}${(this.queue.length > 20)?"and More...\n":""}Song Count: ${this.queue.length}\tSong Duration: ${duration}s`);
    return true;
  } catch(e) {
    this.server.sendError("Failed to Print Queue", e);
    return false;
  }
};

Audio.prototype.skip = async function() {
  try {
    if (this.queue.length === 0 && this.currentSong === null) {
      this.server.thumbsUp();
      return true;
    }

    if (await this.playInternal()) { 
      this.server.thumbsUp(); 
      return true;
    }
  } catch(e) {
    this.server.sendError("Failed to Skip Song", e);
  }

  return false;
};

Audio.prototype.disconnect = async function() {
  if (await this.disconnectInternal()) this.server.thumbsUp();
};

Audio.prototype.play = async function(params, msg, immediate = false) {
  if (this.voiceConnection === null) {
    if (!await this.joinInternal(msg)) return;
  }

  const url = params.trim();
  const urlTest = new RegExp(/^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/gm);
  if (urlTest.test(url)) {
    if (ytpl.validateID(url)) {
      if (await this.playPlaylist(url))
        this.server.thumbsUp();
    } else {
      if (await this.playURL(url, immediate))
        this.server.thumbsUp();
    }
  } else {
    if (await this.playSearch(url))
      this.server.thumbsUp();
  }
};

Audio.prototype.playSearch = async function(search) {
  try {
    const res = await ytsr(search, {
      safeSearch: false,
      limit: 5,
      pages: 1,
    });
    const video = res.items.find(i => i.type === "video" && !i.isUpcoming && !i.isLive && i.views > 0 && i.url);
    if (!video) {
      this.server.sendError("Failed to Find a Video", "User Error");
      return false;
    }

    if (this.playURL(video.url)) {
      this.server.sendEmbed("Play:", `${video.title}\n${video.url}`, video.bestThumbnail.url)
      return true;
    } else {
      return false;
    }
  } catch(e) {
    this.server.sendError("Failed to Search", e);
    return false;
  }
};

Audio.prototype.playPlaylist = async function(url) {
  try {
    if (!ytpl.validateID(url)) {
      this.server.sendError("Invalid Playlist URL", "User Error");
      return false;
    }
    const songs = (await ytpl(url)).items.map(s => ({
      url: s.shortUrl,
      title: s.title,
      length: s.durationSec,
      encoderArgs: [],
    }));
    this.queue.push(...songs);
    if (this.currentSong === null) {
      if (!await this.playInternal()) return false;
    }

    return true;
  } catch(e) {
    this.server.sendError("Failed to Play Playlist URL", e);
    return false;
  }
};

Audio.prototype.playURL = async function(url, immediate) {
  try {
    if (!ytdl.validateURL(url)) {
      this.server.sendError("Invalid URL", "User Error");
      return false;
    }

    const rawSong = await ytdl.getBasicInfo(url, {
      requestOptions: {
        headers: {
          cookie: process.env.YT_COOKIE,
          "x-youtube-identity-token": process.env.YT_ID,
        },
      },
    });

    if (rawSong.isLiveContent) {
      this.server.sendError("Can\u0027t Play Live Videos", "User Error");
      return false;
    }

    const song = {
      url,
      title: rawSong.videoDetails.title,
      length: parseInt(rawSong.videoDetails.lengthSeconds),
      encoderArgs: [],
    };

    if (immediate) {
      this.queue.unshift(song);
      if (!await this.playInternal()) return false;
    } else {
      this.queue.push(song);
      if (this.currentSong === null) {
        if (!await this.playInternal()) return false;
      }
    }

    return true;
  } catch(e) {
    this.server.sendError("Failed to Play URL", e);
    return false;
  }
}

Audio.prototype.playInternal = async function() {
  try {
    this.currentSong = null;
    this.paused = false;
    if (this.stream !== null) { 
      this.stream.destroy(); 
      this.stream = null;
    }

    if (this.timeout !== null) { 
      clearTimeout(this.timeout);
      this.timeout = null; 
    }

    if (this.queue.length > 0) {
      this.currentSong = this.queue.shift();
      for (let i = 0; i < 3; ++i) {
        if (await this.playStreamInternal()) break;
      }

      if (this.stream.startTime === undefined) { 
        if (this.stream !== null) { 
          this.stream.destroy(); 
          this.stream = null;
        }
    
        if (this.timeout !== null) { 
          clearTimeout(this.timeout);
          this.timeout = setTimeout(this.dcFuc, this.timeoutDuration);
        }

        throw new Error("Audio Stream Not Started");
      }
    } else {
      this.timeout = setTimeout(this.dcFuc, this.timeoutDuration);
    }

    return true;
  } catch(e) {
    this.server.sendError("Failed to Play Song", e);
    return false;
  }
};

Audio.prototype.playStreamInternal = async function() {
  if (this.stream !== null) this.stream.destroy();
  this.stream = await ytdl(this.currentSong.url, {
    encoderArgs: this.currentSong.encoderArgs,
    fmt: "mp3",
    quality: 'highestaudio',
    filter: "audioonly",
    requestOptions: {
      headers: {
        cookie: process.env.YT_COOKIE,
        "x-youtube-identity-token": process.env.YT_ID,
      },
    },
  });
  this.stream = this.voiceConnection.play(this.stream, { volume: 0.5 });
  this.stream.on("finish", this.endFuc);
  for (let i = 0; i < 20; ++i) {
    if (this.stream.startTime !== undefined) return true;
    await new Promise(r => setTimeout(r, 100));
  }

  return false;
};

Audio.prototype.songEnd = async function() {
  try {
    if (this.looped) { 
      this.queue.unshift(this.currentSong); 
    } else if (this.queueLooped) {
      this.queue.push(this.currentSong); 
    }

    await this.playInternal();
  } catch(e) {
    this.server.sendError("Failed to Play Next Song", e);
  }
};

module.exports = Audio;

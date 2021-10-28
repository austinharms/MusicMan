const ytdl = require("discord-ytdl-core");
const ytpl = require("ytpl");
const ytsr = require('ytsr');
const BotError = require("./Error");

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
  this.args = {};
  for (const [key, value] of Object.entries(this.defaultArgs))
    this.args[key] = {...value};
};

Audio.prototype.defaultArgs = {
  bass: {
    value: 0,
    arg: "bass=g=",
    postArg: "",
    min: -50,
    max: 50,
    name: "Baseboost"
  }
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

Audio.prototype.bassBoost = function(params) {
  try {
    let val = 20;
    if (params && params.length > 0) {
      val = parseInt(params.trim());
      if (isNaN(val)) {
        const bError = BotError.createError("Invalid BassBoost Value", e, this.server.msg.author.id, this.server.id, "Audio:bassBoost", true);
        this.server.sendError(bError);
        return false;
      }
    }

    if (this.setArgInternal("bass", val)) {
        this.server.thumbsUp();
        return true;
    }
  } catch(e) {
    const bError = BotError.createError("Failed to BassBoost", e, this.server.msg.author.id, this.server.id, "Audio:bassBoost", false);
    this.server.sendError(bError);
  }

  return false;
};

Audio.prototype.resetArgs = function() {
  try {
    if (this.resetArgsInternal()) {
      if (this.stream !== null) {
        if (this.skipLengthInternal(0)) {
         this.server.thumbsUp();
         return true;
        }
      } else {
        this.server.thumbsUp();
        return true;
      }
      return false;
    }
  } catch(e) {
    const bError = BotError.createError("Failed to reset audio modifiers", e, this.server.msg.author.id, this.server.id, "Audio:resetArgs", false);
    this.server.sendError(bError);
  }

  return false;
};

Audio.prototype.resetArgsInternal = function() {
  try {
    this.args = {};

    for (const [key, value] of Object.entries(this.defaultArgs))
      this.args[key] = {...value};

    return true;
  } catch(e) {
    const bError = BotError.createError("Failed to reset args", e, -1, this.server.id, "Audio:resetArgsInternal", false);
    this.server.sendError(bError);
    return false;
  }
};

Audio.prototype.getArgList = function() {
  if (this.args === null && !this.resetArgsInternal()) return [];
  const argList = ["-af"];
  for (const key of Object.keys(this.args)) {
    argList.push(`${this.args[key].arg + this.args[key].value + this.args[key].postArg}`);
  }

  return argList;
};

Audio.prototype.setArgInternal = function(name, value) {
  try {
    if (name in this.args) {
      value = parseInt(value);
      if (isNaN(value)) {
        const bError = BotError.createError("Failed to set " + name + " arg", new Error("failed to parse value"), -1, this.server.id, "Audio:setArgInternal", true);
        this.server.sendError(bError);
        return false;
      }

      if (value > this.args[name].max)
        value = this.args[name].max;
      if (value < this.args[name].min)
        value = this.args[name].min;
      this.args[name].value = value;

      if (this.stream !== null)
        return this.skipLengthInternal(0);

    } else {
      const bError = BotError.createError("Failed to set " + name + " arg", new Error("arg dose not exist"), -1, this.server.id, "Audio:setArgInternal", true);
      this.server.sendError(bError);
      return false;
    }

    return true;
  } catch(e) {
    const bError = BotError.createError("Failed to set " + name + " arg", e, -1, this.server.id, "Audio:setArgInternal", false);
    this.server.sendError(bError);
    return false;
  }
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
      if (!msg.member.voice.channel) throw new Error("User Not in Voice Chat");
      channel = msg.member.voice.channel;
    } catch (e) {
      const bError = BotError.createError("You Must Be in a Voice Chat to Use This Command", e, msg.author.id, msg.guild.id, "Audio:getUserVoiceChannel", true);
      this.server.sendError(bError);
      return false;
    }

    if (this.voiceConnection !== null && channel.id === this.voiceConnection.channel.id) return true;
    await this.disconnectInternal();

    let guild = null;
    try {
      guild = await this.client.guilds.fetch(msg.guild.id);
    } catch(e) {
      const bError = BotError.createError(`Bot: ${this.client.user.tag} Not Member of Server`, e, msg.author.id, msg.guild.id, "Audio:getGuildOnClient", true);
      this.server.sendError(bError);
      return false;
    }

    try {
      channel = guild.channels.resolve(channel.id);
      if (channel === null) throw new Error("Failed to get Channel from Guild");
    } catch(e) {
      const bError = BotError.createError(`Can not Connect to Voice Chat\n(Permission Error)`, e, msg.author.id, msg.guild.id, "Audio:getChannelOnClient", true);
      this.server.sendError(bError);
      return false;
    } 

    if (!channel.joinable) {
      const bError = BotError.createError("Unable to Join Your Voice Chat\n(Permission Error)", new Error("User Channel Not Joinable"), msg.author.id, msg.guild.id, "Audio:joinChannelOnClient", true);
      this.server.sendError(bError);
      return false;
    }

    this.voiceConnection = await channel.join();
    this.voiceConnection.on("error", this.errorFuc);
    this.voiceConnection.on("failed", this.errorFuc);
    this.voiceConnection.on("disconnect", this.dcFuc);
    this.timeout = setTimeout(this.dcFuc, this.timeoutDuration);
    return true;
  } catch (e) {
    const bError = BotError.createError("Failed to Join Voice Chat", e, msg.author.id, msg.guild.id, "Audio:joinInternal", false);
    this.server.sendError(bError);
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
    const played = Math.floor((((time - this.stream.startTime) - this.stream._pausedTime) - currentPauseTime)/1000)  + (this.currentSong.offset || 0);
    const barFilled = Math.max(Math.min(Math.floor(played * 20 / this.currentSong.length), 20), 0);
    let progressBar = `[**${"=".repeat(barFilled)}${"-".repeat(20 - barFilled)}**]`;
    this.server.sendEmbed("Playing:", `**${this.currentSong.title}**\n${this.currentSong.url}\n*Duration: ${this.currentSong.length}s*
    Progress: ${progressBar}, ${played}s/${this.currentSong.length}s`);
  } catch(e) {
    const bError = BotError.createError("Failed to Show Current Song Details", e, this.server.msg.author.id, this.server.id, "Audio:printCurrent", false);
    this.server.sendError(bError);
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
    const bError = BotError.createError("Failed to Pause/Resume Song", e, this.server.msg.author.id, this.server.id, "Audio:togglePause", false);
    this.server.sendError(bError);
    return false;
  }
};

Audio.prototype.removeQueue = async function(params) {
  try {
    const strList = params.trim().split(" ");
    if (strList.length === 0) {
      const bError = BotError.createError("Invalid Song Index", new Error("Index not Present"), this.server.msg.author.id, this.server.id, "Audio:removeQueue", true);
      this.server.sendError(bError);
      return false;
    }

    const index = parseInt(strList[0]);
    if (isNaN(index) || index < 1 || index > this.queue.length) {
      const bError = BotError.createError("Invalid Song Index", new Error("Index not Parsable"), this.server.msg.author.id, this.server.id, "Audio:removeQueue", true);
      this.server.sendError(bError);
      return false;
    }

    this.queue.splice(index - 1, 1);
    this.server.thumbsUp();
    return true;
  } catch(e) {
    const bError = BotError.createError("Failed to Remove Song", e, this.server.msg.author.id, this.server.id, "Audio:removeQueue", false);
    this.server.sendError(bError);
    return false;
  }
};

Audio.prototype.onError = function(e) {
  const bError = BotError.createError("Error in Voice Chat, Disconnecting", e, -1, this.server.id, "Audio:onError", false);
  this.server.sendError(bError);
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
    const bError = BotError.createError("Failed to Disconnect", e, -1, this.server.id, "Audio:disconnectInternal", false);
    this.server.sendError(bError);
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
    const bError = BotError.createError("Failed to Clear Queue", e, this.server.msg.id, this.server.id, "Audio:clearQueue", false);
    this.server.sendError(bError);
  }

  return false;
};

Audio.prototype.toggleLoop = function() {
  try {
    this.looped = !this.looped;
    this.server.sendEmbed("Loop:", `Loop: ${this.looped?"Enabled":"Disabled"}`);
    return true;
  } catch(e) {
    const bError = BotError.createError("Failed to Toggle Loop", e, this.server.msg.id, this.server.id, "Audio:toggleLoop", false);
    this.server.sendError(bError);
    return false;
  }
};

Audio.prototype.toggleQueueLoop = function() {
  try {
    this.queueLooped = !this.queueLooped;
    this.server.sendEmbed("Loop:", `Queue Loop: ${this.queueLooped?"Enabled":"Disabled"}`);
    return true;
  } catch(e) {
    const bError = BotError.createError("Failed to Toggle Queue Loop", e, this.server.msg.id, this.server.id, "Audio:toggleQueueLoop", false);
    this.server.sendError(bError);
    return false;
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
    const bError = BotError.createError("Failed to Print Queue", e, this.server.msg.id, this.server.id, "Audio:printQueue", false);
    this.server.sendError(bError);
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
    const bError = BotError.createError("Failed to Skip Song", e, this.server.msg.id, this.server.id, "Audio:skip", false);
    this.server.sendError(bError);
  }

  return false;
};

Audio.prototype.disconnect = async function() {
  if (await this.disconnectInternal()) this.server.thumbsUp();
};

Audio.prototype.play = async function(params, msg, immediate = false) {
  if (this.voiceConnection === null) {
    if (!await this.joinInternal(msg)) return false;
  }

  const url = params.trim();
  const urlTest = new RegExp(/^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/gm);
  if (urlTest.test(url)) {
    if (ytpl.validateID(url)) {
      if (await this.playPlaylist(url)) {
        this.server.thumbsUp();
        return true;
      }
    } else if (ytdl.validateURL(url)) {
      if (await this.playURL(url, immediate)) {
        this.server.thumbsUp();
        return true;
      }
    } else {
      //Try to play non youtube URL (missing length and name)
      this.queue.push({ 
        url: url,
        rawURL: url,
        title: "Unknown",
        length: 0,
        offset: 0,
       });
       if (await this.playInternal()) {
        this.server.thumbsUp();
        return true;
       }
    }
  } else {
    if (await this.playSearch(url)) {
      this.server.thumbsUp();
      return true;
    }
  }
};

Audio.prototype.playSearch = async function(search) {
  try {
    if (!search || search.length === 0) {
      const bError = BotError.createError("Search Can\u0027t be Empty", new Error("Search String Empty"), this.server.msg.id, this.server.id, "Audio:playSearch", true);
      this.server.sendError(bError);
      return false;
    } else if (search.length <= 2) {
      const bError = BotError.createError("Search Must be Longer Than 2 Characters", new Error("Search String Too Short"), this.server.msg.id, this.server.id, "Audio:playSearch", true);
      this.server.sendError(bError);
      return false;
    }

    const res = await ytsr(search, {
      safeSearch: false,
      limit: 5,
      pages: 1,
    });
    const video = res.items.find(i => i.type === "video" && !i.isUpcoming && !i.isLive && i.views > 0 && i.url);
    if (!video) {
      const bError = BotError.createError("Failed to Find a Video", new Error("No Videos in Search Results"), this.server.msg.id, this.server.id, "Audio:playSearch", true);
      this.server.sendError(bError);
      return false;
    }

    if (this.playURL(video.url)) {
      this.server.sendEmbed("Play:", `${video.title}\n${video.url}`, video.bestThumbnail.url)
      return true;
    } else {
      return false;
    }
  } catch(e) {
    const bError = BotError.createError("Failed to Search", e, this.server.msg.id, this.server.id, "Audio:playSearch", false);
    this.server.sendError(bError);
    return false;
  }
};

Audio.prototype.playPlaylist = async function(url) {
  try {
    if (!ytpl.validateID(url)) {
      const bError = BotError.createError("Invalid Playlist URL", new Error("Failed to Parse Playlist ID from URL"), this.server.msg.id, this.server.id, "Audio:playPlaylist", true);
      this.server.sendError(bError);
      return false;
    }
    const songs = (await ytpl(url)).items.map(s => ({
      url: s.shortUrl,
      title: s.title,
      length: s.durationSec,
      offset: 0,
    }));
    this.queue.push(...songs);
    if (this.currentSong === null) {
      if (!await this.playInternal()) return false;
    }

    return true;
  } catch(e) {
    const bError = BotError.createError("Failed to Play Playlist URL", e, this.server.msg.id, this.server.id, "Audio:playPlaylist", false);
    this.server.sendError(bError);
    return false;
  }
};

Audio.prototype.playURL = async function(url, immediate) {
  try {
    if (!ytdl.validateURL(url)) {
      const bError = BotError.createError("Invalid URL", new Error("Failed to Parse Video ID from URL"), this.server.msg.id, this.server.id, "Audio:playURL", true);
      this.server.sendError(bError);
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
      const bError = BotError.createError("Can\u0027t Play Live Videos", new Error("Video Object was Live, Can\u0027t play Live Streams"), this.server.msg.id, this.server.id, "Audio:playURL", true);
      this.server.sendError(bError);
      return false;
    }

    const song = {
      url,
      title: rawSong.videoDetails.title,
      length: parseInt(rawSong.videoDetails.lengthSeconds),
      offset: 0,
    };

    if (immediate) {
      this.queue.unshift(song);
      if (!(await this.playInternal())) return false;
    } else {
      this.queue.push(song);
      if (this.currentSong === null) {
        if (!(await this.playInternal())) return false;
      }
    }

    return true;
  } catch(e) {
    const bError = BotError.createError("Failed to Play URL", e, this.server.msg.id, this.server.id, "Audio:playURL", false);
    this.server.sendError(bError);
    return false;
  }
};

Audio.prototype.skipLength = async function(params) {
  try {
    if (this.currentSong == null || this.stream === null) {
      const bError = BotError.createError("Failed to Skip, Nothing Playing", new Error("No Song Playing"), this.server.msg.id, this.server.id, "Audio:skipLength", true);
      this.server.sendError(bError);
      return false;
    }

    if(!params || !params.trim()) {
      const bError = BotError.createError("Failed to parse skip length", new Error("Failed to Parse Int"), this.server.msg.id, this.server.id, "Audio:skipLength", true);
      this.server.sendError(bError);
      return false;
    }

    const length = parseInt(params.trim().split(' ')[0]);
    if (isNaN(length)) {
      const bError = BotError.createError("Failed to parse skip length", new Error("Failed to Parse Int"), this.server.msg.id, this.server.id, "Audio:skipLength", true);
      this.server.sendError(bError);
      return false;
    }

    return this.skipLengthInternal(length);
  } catch(e) {
    const bError = BotError.createError("Failed to Skip", e, this.server.msg.id, this.server.id, "Audio:skipLength", false);
    this.server.sendError(bError);
    return false;
  }
};

Audio.prototype.printArgs = function() {
  try {
    this.server.sendEmbed("Audio Modifiers", `${Object.values(this.args).reduce((text, arg) => `${text}\n**${arg.name}**:${arg.value}`, "")}`);
    return true;
  } catch(e) {
    const bError = BotError.createError("Failed to Print Audio Modifiers", e, this.server.msg.id, this.server.id, "Audio:printArgs", false);
    this.server.sendError(bError);
    return false;
  }
};

Audio.prototype.skipLengthInternal = async function(seconds) {
  try {
    if (this.currentSong == null || this.stream === null) {
      const bError = BotError.createError("Failed to Skip, Nothing Playing", new Error("No Song Playing"), -1, this.server.id, "Audio:skipLengthInternal", true);
      this.server.sendError(bError);
      return false;
    }

    const time = new Date().getTime();
    let currentPauseTime = 0;
    if (this.stream.pausedSince !== null)
      currentPauseTime = time - this.stream.pausedSince;
    const played = Math.floor((((time - this.stream.startTime) - this.stream._pausedTime) - currentPauseTime)/1000) + (this.currentSong.offset || 0);
    if (played + seconds < 0) {
      const bError = BotError.createError("Failed to Skip, Can Skip Before Song Start", new Error("Length Offset less than zero"), -1, this.server.id, "Audio:skipLengthInternal", true);
      this.server.sendError(bError);
      return false;
    }

    this.queue.unshift({...this.currentSong, offset: (played + seconds)});
    const res = await this.playInternal();
    return res;
  } catch(e) {
    const bError = BotError.createError("Failed to Skip", e, -1, this.server.id, "Audio:skipLengthInternal", false);
    this.server.sendError(bError);
    return false;
  }
};

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
      for (let i = 0; i < 2; ++i) {
        if ((await this.playStreamInternal())) break;
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
    const bError = BotError.createError("Failed to Play Song", e, -1, this.server.id, "Audio:playInternal", false);
    this.server.sendError(bError);
    return false;
  }
};

Audio.prototype.playStreamInternal = async function() {
  try {
    if (this.stream !== null) this.stream.destroy();
    if (!this.currentSong.rawURL) {
      const info = await ytdl.getInfo(this.currentSong.url);
      const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: "audioonly" });
      this.currentSong.rawURL = format.url;
    }

    this.stream = await ytdl.arbitraryStream(this.currentSong.rawURL, {
      encoderArgs: this.getArgList(),
      seek: this.currentSong.offset,
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
    for (let i = 0; i < 60; ++i) {
      if (this.stream.startTime !== undefined) return true;
      await new Promise(r => setTimeout(r, 150));
    }
  } catch(e) {
    BotError.createError("Failed to Play Song", e, -1, this.server.id, "Audio:playStreamInternal", false);
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
    const bError = BotError.createError("Failed to Play Next Song", e, -1, this.server.id, "Audio:songEnd", false);
    this.server.sendError(bError);
  }
};

module.exports = Audio;

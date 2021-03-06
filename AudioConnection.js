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
  this.songStreams = null;
  this.voiceConnection = null;
  this.onLevae = onDisconnect;
  this.paused = false;
  this.loop = false;
  this.loopQueue = false;
  this.boundDisconnect = this.Disconnect.bind(this);
  this.boundEnd = this.onEnd.bind(this);
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

  if (this.songStreams !== null) {
    this.songStreams.destroy();
    this.songStreams = null;
  }
};

AudioConnection.GetQueue = () => {
  if (this.queue.length === 0) {
    return "Nothing Queued";
  } else {
    return this.queue.slice(0,20).reduce((text, video, index) => `${text}${index + 1}.[${video.title}](${video.url}), Duration: ${video.length}\n`);
  }
};

AudioConnection.prototype.Clear = async function() {
  try {
    this.queue.length = 0;
    await this.playNext();
  } catch(e) {
    if (e instanceof BotError.ErrorObject) throw e;
    throw BotError(e,"Failed to Clear Queue", "AudioCon:Clear", this.guild.id, this.channel.id);
  }
};

AudioConnection.prototype.Loop = function() {
  try {
    if (this.loop) {
      this.loop = false;
      return "Loop Disabled";
    } else {
      this.loop = true;
      this.loopQueue = false;
      return "Loop Enabled";
    }
  } catch(e) {
    if (e instanceof BotError.ErrorObject) throw e;
    throw BotError(e,"Failed to enable loop", "AudioCon:Loop", this.guild.id, this.channel.id);
  }
};

AudioConnection.prototype.LoopQueue = function() {
  try {
    if (this.loopQueue) {
      this.loopQueue = false;
      return "Queue Loop Disabled";
    } else {
      this.loopQueue = true;
      this.loop = false;
      return "Queue Loop Enabled";
    }
  } catch(e) {
    if (e instanceof BotError.ErrorObject) throw e;
    throw BotError(e,"Failed to enable queue loop", "AudioCon:LoopQueue", this.guild.id, this.channel.id);
  }
};

AudioConnection.prototype.Remove = async function(index) {
  try {
    --index;
    if (this.queue.length < index) throw BotError(new Error("Index out of Range"),"Invalid Index", "AudioCon:Remove", this.guild.id, this.channel.id, -1, true);
    this.queue.splice(index, 1);
  } catch(e) {
    if (e instanceof BotError.ErrorObject) throw e;
    throw BotError(e,"Failed to Clear Queue", "AudioCon:Clear", this.guild.id, this.channel.id);
  }
};

AudioConnection.prototype.Queue = async function(priority, songs) {
  try {
    if (priority) {
      this.queue.unshift(...songs);
      await this.playNext();
    } else {
      this.queue.push(...songs);
      if (this.current === null)
        await this.playNext();
    }
  } catch(e) {
    if (e instanceof BotError.ErrorObject) throw e;
    throw BotError(e,"Failed to Queue Song", "AudioCon:queue", this.guild.id, this.channel.id);
  }
};

AudioConnection.prototype.Skip = async function(count = 1) {
  if (count > 1) this.queue.splice(0,count-1);
  await this.playNext();
};

AudioConnection.prototype.playNext = async function() {
  if (!this.initialized)
    throw BotError(new Error("Connection not Initialized"),"Failed to Play Song", "AudioCon:playNext", this.guild.id, this.channel.id);
    
  try {
    this.paused = false;
    this.cleanStreams();
    if (this.timeout !== null) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    this.current = null;
    if (this.queue.length > 0) {
      this.current = this.queue.shift();
      this.songStreams = await AudioUtilities.CreateStreams(this.current);
      console.log(this.songStreams);
      this.songStreams.onError = (async function() {
        try {
          await this.playNext();
        } catch(e) {
          if (!(e instanceof BotError.ErrorObject))
            BotError(e, "Failed to Play Song", "AudioStreams:onError");
        }
      }).bind(this);
      this.voiceStream = this.voiceConnection.play(this.songStreams.transcoder, { volume: 0.5, type: "converted" });
      this.voiceStream.on("finish", this.boundEnd);
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
  try {
    if (this.loop) { 
      this.queue.unshift(this.current); 
      this.queue[0].offset = 0;
    } else if (this.loopQueue) {
      this.queue.push(this.current); 
      this.queue[this.queue.length - 1].offset = 0;
    }

    await this.playNext();
    console.log("Song End: " + this.guild.id);
  } catch(e) {
    //Dont throw errors here just log them
    if (!(e instanceof BotError.ErrorObject))
      BotError(e,"Failed to End Song", "AudioCon:onEnd", this.guild.id, this.channel.id);
  }
};

AudioConnection.prototype.GetQueue = function(page = 1) {
  if (this.queue.length === 0) return "Nothing Queued";
  const songsPerPage = 20;
  page = Math.min(Math.max(page, 1), Math.ceil(this.queue.length/songsPerPage));
  queuePage = this.queue.slice((page - 1) * songsPerPage, page * songsPerPage);
  const queueString = queuePage.reduce((msg, song, index) => `${msg}${((page - 1) * songsPerPage) + (index + 1)}: [${song.title}](${song.url}), Duration: ${song.length}s\n`, "");
  return `${queueString}\n*Page ${page}/${Math.ceil(this.queue.length/songsPerPage)}* ${this.loopQueue?"  (***Queue Looped***)":""}`;
};

AudioConnection.prototype.GetCurrent = function() {
  if (this.current === null) return "Nothing Playing";

  const barLength = 40;
  const time = new Date().getTime();
  let currentPauseTime = 0;
  if (this.voiceStream.pausedSince !== null)
    currentPauseTime = time - this.voiceStream.pausedSince;
  const played = Math.floor((((time - this.voiceStream.startTime) - this.voiceStream._pausedTime) - currentPauseTime)/1000)  + this.current.offset;
  const barFilled = Math.max(Math.min(Math.floor(played * barLength / this.current.length), barLength), 0);
  const progressBar = `[**${"=".repeat(barFilled)}${"-".repeat(barLength - barFilled)}**]`;
  return `${this.current.title}\n${this.current.url}\n${progressBar}\nProgress: ${played}/${this.current.length}s\t${this.paused?"  (***Paused***)":""}${this.loop?"  (***Looped***)":""}`;
};

AudioConnection.prototype.Pause = function() {
  if (this.current === null || this.voiceStream === null)
    throw BotError(new Error("Cant Pause Null stream"), "Failed to Pause, Nothing Playing", "AudioCon:Pause", this.guild.id, -1, -1, true);
  if (this.paused) {
    //WHY do I need to do this for it to work? TODO: Fix this
    this.voiceStream.resume();
    this.voiceStream.pause();
    this.voiceStream.resume();
    this.paused = false;
    return "Resumed";
  } else {
    this.voiceStream.pause();
    this.paused = true;
    return "Paused";
  }
};

module.exports = AudioConnection;
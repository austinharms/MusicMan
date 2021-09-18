const Command = require("./Command");

const notImplemented = function() {
  this.sendEmbed("Not Implemented", "This Command is not yet Implemented\nTry Later");
};

const helpCommand = function(param) {
  if (param && param.trim()) {
    const cmd = getCommand(param.split(" ").shift().toLowerCase());
    if (cmd) {
      this.sendEmbed("Help: " + cmd.getName(), cmd.getHelp());
      return;
    }
  }

  this.sendEmbed("Help", getCommand("ALL").reduce((help, cmd) => help + cmd.getOneLineHelp() + "\n", "") + "\n***Warning*** this bot **can\u0027t** play live streams.\nIf you have issues, try clearing the Queue");
};

const aJoin = async function(params, msg) { 
  const audio = this.getCommandAudioInstance(msg);
  if (audio) await audio.join(msg);
};

const aDC = async function(params, msg) {
  if (this.getCommandUserInVC(msg)) {
    const audio = this.getCommandAudioInstance(msg);
    if (audio) await audio.disconnect();
  }
};

const aPlay = async function(params, msg) { 
  const audio = this.getCommandAudioInstance(msg);
  if (audio) await audio.play(params, msg, false); 
};

const aPlayNow = async function(params, msg) { 
  const audio = this.getCommandAudioInstance(msg);
  if (audio) await audio.play(params, msg, true); 
};

const aPause = async function(params, msg) {
  if (this.getCommandUserInVC(msg)) {
    const audio = this.getCommandAudioInstance(msg);
    if (audio) await audio.togglePause();
  }
};

const aCur = async function(params, msg) {
  if (this.getCommandUserInVC(msg)) {
    const audio = this.getCommandAudioInstance(msg);
    if (audio) await audio.printCurrent();
  }
};

const aQueue = async function(params, msg) {
  if (this.getCommandUserInVC(msg)) {
    const audio = this.getCommandAudioInstance(msg);
    if (audio) await audio.printQueue();
  }
};

const aSkip = async function(params, msg) {
  if (this.getCommandUserInVC(msg)) {
    const audio = this.getCommandAudioInstance(msg);
    if (audio) await audio.skip();
  }
};

const aRemove = async function(params, msg) {
  if (this.getCommandUserInVC(msg)) {
    const audio = this.getCommandAudioInstance(msg);
    if (audio) await audio.removeQueue(params);
  }
};

const aClear = async function(params, msg) {
  if (this.getCommandUserInVC(msg)) {
    const audio = this.getCommandAudioInstance(msg);
    if (audio) await audio.clearQueue();
  }
};

const aLoop = async function(params, msg) {
  if (this.getCommandUserInVC(msg)) {
    const audio = this.getCommandAudioInstance(msg);
    if (audio) await audio.toggleLoop();
  }
};

const aLoopQueue = async function(params, msg) {
  if (this.getCommandUserInVC(msg)) {
    const audio = this.getCommandAudioInstance(msg);
    if (audio) await audio.toggleQueueLoop();
  }
};

const COMMANDS = Object.freeze([
  new Command(helpCommand, "Show This Page", "Displays the Help Guide for this Bot", "Help", "H", "He", "Hel", "What", "How"),
  new Command(aJoin, "Join your VC", "Makes the Bot Join Your Voice Chat", "Join", "J", "Jo", "Joi", "Connect", "Con", "Conn"),
  new Command(aPlay, "Play/Queue a Song", "Play or Queue a Song by URL Youtube Playlist or Text Search", "Play", "P", "Pl", "Pla", "Start", "St", "Sta", "Star"),
  new Command(aPlayNow, "Play Now", "Plays a Song Ignoring the Queue", "Play!", "Now", "P!"),
  new Command(aPause, "Pause/Resume the Current Song", "Pause or Resume the Current Song", "Pause", "Pu", "R", "Re", "Res", "Resume", "Toggle"),
  new Command(aCur, "Show the Current Song Details", "Shows Details about the Currently Playing Song", "NowPlaying", "NP", "NowP", "NPlay", "Current", "Cur", "WhatPlaying", "WhatP"),
  new Command(aQueue, "View the Song Queue", "Displays the Songs Queued to Play", "Queue", "Q", "Qu", "Que", "Queu", "List", "Li", "Lis"),
  new Command(aSkip, "Skip the Current Song", "Skip the Currently Playing Song", "Skip", "S", "Sk", "Ski", "FF", "Next", "N", "Ne", "Nex", "Forward", "For"),
  new Command(aRemove, "Remove Song in Queue", "Removes a Song From the Queue by Index", "Remove", "RM", "Rem", "Remo", "Remov", "Delete", "Del"),
  new Command(aClear, "Clears the Song Queue", "Removes all Songs From the Queue and Stops the Current Song", "Clear", "C", "Cl", "Cle", "Clea", "sudoRM-RF", "ALTF4", "Stop"),
  new Command(aDC, "Make the Bot Leave VC", "Make the Bot Leave VC if it is in one", "Leave", "Le", "Lea", "Leav", "Kill", "K", "DC", "Disconnect", "Dis", "D", "Exit", "Eit", "Ex", "Exi"),
  new Command(aLoop, "Loop the Current Song", "Loops the Current Song to Play Forever", "Loop", "L", "Lo", "Loo", "Again", "More", "Ag", "Mo", "Forever", "For"),
  new Command(aLoopQueue, "Loop the Current Song Queue", "Loops the Current Song Queue to Play Forever", "LoopQueue", "LQueue", "LQ", "QLoop", "QL", "QueueAgain", "QueueMore", "QA", "QM", "QueueForever", "QFor", "QForever", "QAgain", "QMore"),
]);

const getCommand = Object.freeze((cmd) => {
  if (cmd === "ALL") return COMMANDS;
    for (const c of COMMANDS)
      if (c.checkIsCommand(cmd)) return c; 
    return false;
  }
);
module.exports = getCommand;
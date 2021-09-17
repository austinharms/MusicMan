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

const COMMANDS = Object.freeze([
  new Command(helpCommand, "Show This Page", "Displays the Help Guide for this Bot", "Help", "H", "He", "Hel", "What", "How"),
  new Command(async function(params, msg) { await this.audio.join(msg); }, "Join your VC", "Makes the Bot Join Your Voice Chat", "Join", "J", "Jo", "Joi", "Connect", "Con", "Conn"),
  new Command(async function(params, msg) { await this.audio.play(params, msg, true); }, "Play Now", "Plays a Song Ignoring the Queue", "Play!", "Now", "P!"),
  new Command(async function(params, msg) { await this.audio.play(params, msg, false); }, "Play/Queue a Song", "Play or Queue a Song by URL Youtube Playlist or Text Search", "Play", "P", "Pl", "Pla", "Start", "St", "Sta", "Star"),
  new Command(async function(params, msg) { await this.audio.togglePause(); }, "Pause/Resume the Current Song", "Pause or Resume the Current Song", "Pause", "Pu", "R", "Re", "Res", "Resume", "Toggle"),
  new Command(async function(params, msg) { await this.audio.printCurrent(); }, "Show the Current Song Details", "Shows Details about the Currently Playing Song", "NowPlaying", "NP", "NowP", "NPlay", "Current", "Cur", "WhatPlaying", "WhatP"),
  new Command(async function(prams, msg) { await this.audio.printQueue(); }, "View the Song Queue", "Displays the Songs Queued to Play", "Queue", "Q", "Qu", "Que", "Queu", "List", "Li", "Lis"),
  new Command(async function(params, msg) { await this.audio.skip(); }, "Skip the Current Song", "Skip the Currently Playing Song", "Skip", "S", "Sk", "Ski", "FF", "Next", "N", "Ne", "Nex", "Forward", "For"),
  new Command(async function(params, msg) { await this.audio.removeQueue(params); }, "Remove Song in Queue", "Removes a Song From the Queue by Index", "Remove", "RM", "Rem", "Remo", "Remov", "Delete", "Del"),
  new Command(async function(params, msg) { await this.audio.clearQueue(); }, "Clears the Song Queue", "Removes all Songs From the Queue and Stops the Current Song", "Clear", "C", "Cl", "Cle", "Clea", "sudoRM-RF", "ALTF4", "Stop"),
  new Command(async function(params, msg) { await this.audio.disconnect(); }, "Make the Bot Leave VC", "Make the Bot Leave VC if it is in one", "Leave", "Le", "Lea", "Leav", "Kill", "K", "DC", "Disconnect", "Dis", "D", "Exit", "Eit", "Ex", "Exi"),
  new Command(async function(params, msg) { await this.audio.toggleLoop(); }, "Loop the Current Song", "Loops the Current Song to Play Forever", "Loop", "L", "Lo", "Loo", "Again", "More", "Ag", "Mo", "Forever", "For"),
  new Command(async function(params, msg) { await this.audio.toggleQueueLoop(); }, "Loop the Current Song Queue", "Loops the Current Song Queue to Play Forever", "LoopQueue", "LQueue", "LQ", "QLoop", "QL", "QueueAgain", "QueueMore", "QA", "QM", "QueueForever", "QFor", "QForever", "QAgain", "QMore"),
]);

const getCommand = Object.freeze((cmd) => {
  if (cmd === "ALL") return COMMANDS;
    for (const c of COMMANDS)
      if (c.checkIsCommand(cmd)) return c; 
    return false;
  }
);
module.exports = getCommand;
const CommandSession = function(guild, channel = null, users = null, timeout = 60) {
  this.guild = guild;
  this.channel = channel;
  this.users = users;
  this.msgFunc = null;
  this.stopFunc = null;
  this.timeoutFunc = null;
  this.timeoutDuration = timeout;
  this.timeoutTimer = setTimeout(this.Timeout.bind(this), this.timeoutDuration * 1000);
  this.id = CommandSession.id++;
};

CommandSession.id = 0;
CommandSession.sessions = [];

CommandSession.remove = function(id) {
  this.sessions = this.sessions.filter(session => session.id !== id);
};

CommandSession.getSessions = function() {
  return this.sessions;
};

CommandSession.create = function(...prams) {
  const s = new CommandSession(...prams);
  this.sessions.push(s);
  return s;
};

CommandSession.sendSessionMsg = function(msg, command, props) {
  return this.sessions.find(s => s.sendMsg(msg, command, props)) !== undefined;
};

CommandSession.prototype.sendMsg = function(msg, command, props) {
  try {
    if (msg.guild.id !== this.guild.id) return false;
    if (this.channel !== null && msg.channel.id !== this.channel.id) return false;
    if (this.users !== null && this.users.find(user => msg.author.id === user.id) === undefined) return false;
    this.resetTimeout();
    if (this.msgFunc !== null) this.msgFunc(msg, command, props, this);
    return true;
  } catch(e) {
    console.log("Error in Session Command: " + e);
    return false;
  }
};

CommandSession.prototype.onMsg = function(f) {
  this.msgFunc = f;
};

CommandSession.prototype.onTimeout = function(f) {
  this.timeoutFunc = f;
};

ConstantSourceNode.prototype.onStop = function(f) {
  this.onStop = f;
}

CommandSession.prototype.stop = function() {
  clearTimeout(this.timeoutTimer);
  if (this.onStop !== null) this.onStop(this);
  CommandSession.remove(this.id);
};

CommandSession.prototype.Timeout = function() {
  if (this.timeoutFunc !== null) this.timeoutFunc(this);
  this.stop();
};

CommandSession.prototype.resetTimeout = function() {
  clearTimeout(this.timeoutTimer);
  this.timeoutTimer = setTimeout(this.Timeout.bind(this), this.timeoutDuration * 1000);
};

module.exports = CommandSession;
const CommandSession = function(channel = null, users = [], timeout = 60) {
  this.channel = channel;
  this.users = users;
  this.msgFunc = null;
  this.timeoutFunc = null;
  this.timeoutDuration = timeout;
  this.timeoutTimer = setTimeout(this.Timeout.bind(this), this.timeoutDuration * 1000);
  this.id = ++CommandSession.id;
};

CommandSession.id = 0;
CommandSession.sessions = [];

CommandSession.remove = function(id) {
  CommandSession.sessions = CommandSession.sessions.filter(session => this.session.id !== id);
};

CommandSession.getSessions = function() {
  return CommandSession.sessions;
};

CommandSession.create = function(...prams) {
  const s = new CommandSession(...prams);
  this.sessions.push(s);
  return s;
};

CommandSession.sendSessionMsg = function(msg) {
  const foundSession = this.sessions.find(s => s.checkForSession(msg));
  if (foundSession) {
    foundSession.sendMsg(msg);
    return true;
  }

  return false;
};

CommandSession.prototype.checkForSession = function(msg) {
  if (this.channel != null)
    return msg.channel.id === this.channel.id && (this.users.length === 0 || this.users.find(user => user.id.equals(msg.author.id)));
  else
    return !!this.users.find(userID.equals(msg.author.id));
};

CommandSession.prototype.onMsg = function(f) {
  this.msgFunc = f;
};

CommandSession.prototype.onTimeout = function(f) {
  this.timeoutFunc = f;
  this.stop();
};

CommandSession.prototype.sendMsg = function(msg) {
  this.resetTimeout();
  if (this.msgFunc !== null) this.msgFunc(msg, this);
};

CommandSession.prototype.stop = function() {
  clearTimeout(this.timeoutTimer);
  CommandSession.remove(this.id);
};

CommandSession.prototype.Timeout = function() {
  if (this.timeoutFunc !== null) this.timeoutFunc(this);
};

CommandSession.prototype.resetTimeout = function() {
  clearTimeout(this.timeoutTimer);
  this.timeoutTimer = setTimeout(this.Timeout.bind(this), this.timeoutDuration * 1000);
};

module.exports = CommandSession;
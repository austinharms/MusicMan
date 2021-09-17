const Command = function(func, shortHelp, longHelp, ...aliases) {
  this.f = func;
  this.sHelp = shortHelp;
  this.lHelp = longHelp;
  this.aliases = aliases;
  this.lowerAliases = this.aliases.map(a => a.toLowerCase());
};

Command.prototype.checkIsCommand = function(cmd) {
  return this.lowerAliases.includes(cmd);
};

Command.prototype.getHelp = function() {
  return this.lHelp + "\ncommand aliases: " + this.aliases.reduce((all, cur) => (all + ", " + cur), "").substring(2);
}

Command.prototype.getOneLineHelp = function() {
  return `**${this.getName()}**: ${this.sHelp}`;
};

Command.prototype.run = async function(serverInstance, param, msg) {
  await this.f.call(serverInstance, param, msg);
};

Command.prototype.getName = function() { return this.aliases[0]; }

module.exports = Command;

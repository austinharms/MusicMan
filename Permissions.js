const COMMANDS = require("./Commands.js"); 
const DB = require("./DB.js");

const Permissions = function() {
  this.users = [
    {
      "id": "492343238972145664",
      level: 0
    },
    {
      "id": "492105847397285888",
      level: 1
    },
    {
      "id": "385283295933628419",
      level: 5
    }
  ];
};

Permissions.prototype.getCommand = async function(cmdId, guildId) {
  const res = await DB.query(`SELECT * FROM CommandPermissions WHERE commandId == ${cmdId} AND guildId == ${guildId}`);
  if (res.length > 0) return res[0];
  return null;
};

Permissions.prototype.getAllCommands = async function(guildId) {
  const res = await DB.query(`SELECT * FROM CommandPermissions WHERE guildId == ${guildId}`);
  return res;
};

Permissions.prototype.getCommandDisabled = function(cmd) {
  if (cmd === null) return false;
  return !!cmd.disabled;
};

Permissions.prototype.getCommandPermission = function(cmd) {
  if (cmd === null || cmd.permissionLevel === null) return -1;
  return cmd.permissionLevel;
};

Permissions.prototype.setCommandPermission = async function(cmdId, guildId, level, msg) {
  const res = await DB.insert(`INSERT OR REPLACE INTO CommandPermissions(commandId, guildId, permissionLevel, permissionMessage) VALUES (${cmdId}, ${guildId}, ${level}, '${msg}');`);
  return res;
};

Permissions.prototype.setUserPermission = async function(userId, guildId, level) {
  const res = await DB.insert(`INSERT OR REPLACE INTO UserPermissions(userId, guildId, permissionLevel) VALUES (${userId}, ${guildId}, ${level});`);
  return res;
};

Permissions.prototype.getUserPermission = async function(userId, guildId) {
  const res = await DB.query(`SELECT * FROM UserPermissions WHERE userId == ${userId} AND guildId == ${guildId}`);
  if (res.length > 0) return res[0].permissionLevel;
  return -1;
};

Permissions.prototype.setCommandDisabled = async function(cmdId, guildId, disabled, msg) {
  const res = await DB.insert(`INSERT OR REPLACE INTO CommandPermissions(commandId, guildId, disabled, disabledMessage) VALUES (${cmdId}, ${guildId}, ${disabled?1:0}, '${msg}');`);
  return res;
};

Permissions.prototype.checkDisabled = function(cmd) {
  if (this.getCommandDisabled(cmd)) {
    if (cmd.disabledMessage && cmd.disabledMessage.length > 0)
      return "Disabled: " + cmd.disabledMessage;
    return "Command Disabled";
  }

  return false;
};

Permissions.prototype.checkPermission = async function(cmd, userId, guildID) {
  const cmdLevel = this.getCommandPermission(cmd);
  if (cmdLevel === -1) return true;
  const userLevel = await this.getUserPermission(userId, guildID);
  if (userLevel <= cmdLevel && userLevel !== -1) return true;

  if (cmd.permissionMessage && cmd.permissionMessage.length > 0)
      return "Invalid Permission: " + cmd.permissionMessage;
  return "Invalid Permission to use Command";
};
module.exports = new Permissions();
const Server = require("./Server");
const servers = {};
const getServer = Object.freeze((guildId) => {
  if (!(guildId in servers)) servers[guildId] = new Server(guildId);
  return servers[guildId];
});
module.exports = getServer;

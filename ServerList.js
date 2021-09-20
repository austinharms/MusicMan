const Server = require("./Server");
const servers = {};
const getServer = Object.freeze((guildId) => {
  if (!(guildId in servers)) servers[guildId] = new Server(guildId);
  return servers[guildId];
});
const hasServer = Object.freeze((guildId) =>  (guildId in servers));
module.exports = { getServer, hasServer };

const BotError = require("./BotError");
const AudioConnection = require("./AudioConnection");
const connections = {};

const getConnection = async (guildId, channelId, clientIndex = -1) => {
  try {
    if (connections[guildId]) {
      let clientNo = clientIndex;
      if (clientIndex === -1) {
        clientNo = 0;
        while(connections[guildId][clientNo] && connections[guildId][clientNo].GetChannelID() != channelId) ++clientNo; 
      }

      if (connections[guildId][clientNo]) {
        if (connections[guildId][clientNo].GetChannelID() == channelId) {
          return connections[guildId][clientNo];
        } else {
          throw BotError(new Error("Client Already in Use"),"Channel already in use", "AudioMan:getCon", guildId, channelId, -1, true);
        }
      } else {
        const connection = new AudioConnection(removeConnection.bind(this, guildId, clientNo));
        await connection.Init(clientNo, guildId, channelId);
        connections[guildId][clientNo] = connection;
        return connection;
      }
    } else {
      const foundClientIndex =  clientIndex === -1?0:clientIndex;
      const connection = new AudioConnection(removeConnection.bind(this, guildId, foundClientIndex));
      await connection.Init(foundClientIndex, guildId, channelId);
      connections[guildId] = { [foundClientIndex]: connection };
      return connection;
    }
  } catch(e) {
    if (e instanceof BotError.ErrorObject) throw e;
    throw BotError(e, "Failed to get Connection", "AudioMan:getCon", guildId, channelId);
  }
};

const removeConnection = async (guildId, clientIndex) => {
  connections[guildId][clientIndex] = null;
  console.log(`Client: ${clientIndex}, disconnected from guild: ${guildId}`);
};

exports.removeConnection = removeConnection;
exports.getConnection = getConnection;
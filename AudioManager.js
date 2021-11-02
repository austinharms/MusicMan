const AudioConnection = require("./AudioConnection");
const connections = {};

const getConnection = async (guildId, channelId, clientIndex = -1) => {
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
        throw new Error("Client in use on diffrent channel");
      }
    } else {
      const connection = new AudioConnection(removeConnection.bind(this, guildId, clientNo));
      connection.Init(foundClientIndex, guildId, channelId);
      connections[guildId][clientNo] = connection;
      return connection;
    }
  } else {
    const foundClientIndex =  clientIndex === -1?0:clientIndex;
    const connection = new AudioConnection(removeConnection.bind(this, guildId, foundClientIndex));
    connection.Init(foundClientIndex, guildId, channelId);
    connections[guildId] = { [foundClientIndex]: connection };
    return connection;
  }
};

const removeConnection = async (guildId, clientIndex) => {
  connections[guildId][clientIndex] = null;
};

exports.removeConnection = removeConnection;
exports.getConnection = getConnection;
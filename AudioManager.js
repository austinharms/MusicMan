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
        await connection.Init(clientNo, guildId, channelId).catch(e => {
          connection.Destroy();
          throw e;
        });
        connections[guildId][clientNo] = connection;
        return connection;
      }
    } else {
      const foundClientIndex =  clientIndex === -1?0:clientIndex;
      const connection = new AudioConnection(removeConnection.bind(this, guildId, foundClientIndex));
      await connection.Init(foundClientIndex, guildId, channelId).catch(e => {
        connection.Destroy();
        throw e;
      });
      connections[guildId] = { [foundClientIndex]: connection };
      return connection;
    }
  } catch(e) {
    if (e instanceof BotError.ErrorObject) throw e;
    throw BotError(e, "Failed to get Connection", "AudioMan:getCon", guildId, channelId);
  }
};

const hasConnection = async (guildId, channelId, clientIndex = -1) => {
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
        }
      }
    }

    return false;
  } catch(e) {
    if (e instanceof BotError.ErrorObject) throw e;
    throw BotError(e, "Failed to get Connection", "AudioMan:hasCon", guildId, channelId);
  }
};

const getUserChannelId = async (user) => {
  try {
    if (!user.voice || !user.voice.channel) throw BotError(new Error("User Channel Not in Voice Channel"), "You must be in VC to run this Command", "AudioMan:getChan", user.guild.id, -1, user.id, true);
    if (!user.voice.channel.joinable) throw BotError(new Error("User Channel Not Joinable"), "VC not Joinable (Permission Error)", "AudioMan:getChan", user.guild.id, user.voice.channel.id, user.id, true);
    return user.voice.channel.id;
  } catch(e) {
    if (e instanceof BotError.ErrorObject) throw e;
    throw BotError(e, "Failed to get Channel", "AudioMan:getChan", user.guild);
  }
};

const removeConnection = async (guildId, clientIndex) => {
  if (connections[guildId] && connections[guildId][clientIndex]) {
    connections[guildId][clientIndex] = null;
    console.log(`Client: ${clientIndex}, disconnected from guild: ${guildId}`);
  }
};

exports.removeConnection = removeConnection;
exports.getConnection = getConnection;
exports.hasConnection = hasConnection;
exports.getUserChannelId = getUserChannelId;
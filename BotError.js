const errorLog = [];
const BotError = function(error, userMsg, location, guildId, channelId, userId, userError) {
  this.error = error;
  this.msg = userMsg;
  this.guild = guildId;
  this.channel = channelId;
  this.location = location;
  this.user = userId;
  this.isUserError = userError;
  this.isCritical = critical;
};

const create = (error, userMsg, location, guildId = -1, channelId = -1, userId = -1, userError = false) => {
  const e = new BotError(error, userMsg, location, guildId, channelId, userId, userError);
  errorLog.push(e);
  return e;
}

module.exports = create;
module.exports.CreateError = create;
module.exports.ErrorObject = BotError;
module.exports.Log = errorLog;
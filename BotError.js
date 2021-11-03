const errorLog = [];
const BotError = function(error, userMsg, location, guildId, channelId, userId, userError) {
  this.error = error;
  this.msg = userMsg;
  this.guild = guildId;
  this.channel = channelId;
  this.location = location;
  this.user = userId;
  this.isUserError = userError;
};

const create = (error, userMsg, location, guildId = -1, channelId = -1, userId = -1, userError = false) => {
  const e = new BotError(error, userMsg, location, guildId, channelId, userId, userError);
  errorLog.push(e);
  console.log(e);
  return e;
}

create.ErrorObject = BotError;
create.ErrorLog = errorLog;

module.exports = create;
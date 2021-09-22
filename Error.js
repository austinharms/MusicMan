const errors = [];
const BotError = function(displayMsg, error, userId, guildId, location, userError) {
  this.msg = displayMsg;
  this.error = error;
  this.userId = userId;
  this.guildId = guildId;
  this.location = location;
  this.isUserError = userError;
  this.time = new Date().getTime();
};

BotError.createError = (displayMsg, error, userId, guildId, location, userError) => {
  const e = new BotError(displayMsg, error, userId, guildId, location, userError);
  errors.push(e);
  if (!e.isUserError) console.log(e);
  return e;
};

BotError.getErrors = () => {
  return errors;
};

BotError.getGuildErrors = (guildId) => {
  return errors.filter(e => e.guildId == guildId);
};

BotError.getUserErrors = (userId) => {
  return errors.filter(e => e.userId == userId);
};

module.exports = BotError;
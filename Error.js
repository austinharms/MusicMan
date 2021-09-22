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
  if (errors.length > 1000) errors.shift();
  if (!e.isUserError) console.log(e);
  return e;
};

BotError.getErrors = () => {
  return errors;
};

BotError.getTrueErrors = () => {
  return errors.filter(e => !e.isUserError);
};

BotError.getGuildErrors = (guildId) => {
  return BotError.getTrueErrors().filter(e => e.guildId == guildId);
};

BotError.getUserErrors = (userId) => {
  return BotError.getTrueErrors().filter(e => e.userId == userId);
};

BotError.getAllGuildErrors = (guildId) => {
  return errors.filter(e => e.guildId == guildId);
};

BotError.getAllUserErrors = (userId) => {
  return errors.filter(e => e.userId == userId);
};

BotError.dumpErrors = () => {
  return console.log("Errors: ", ...errors);
};

BotError.getErrorString = (error) => {
  return `Msg: ${error.msg}\nError: ${error.error}\nUser: ${error.userId}\nGuild: ${error.guildId}\nLoc: ${error.location}\nTime: ${error.time}\nUserError: ${error.isUserError}`;
};

module.exports = BotError;
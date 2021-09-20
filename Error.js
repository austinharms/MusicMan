const errors = [];
const BotError = function(displayMsg, error, userId, guildId, location, userError) {
  this.msg = displayMsg;
  this.error = error;
  this.userId = userId;
  this.guildId = guildId;
  this.location = location;
  this.isUserError = userError;
}


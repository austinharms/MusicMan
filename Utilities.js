const UTILITIES = Object.freeze({
  getUserId: function(guild, name) {
    try {
      if (!name || !name.trim()) return false;
      if (!isNaN(name) && name.length >= 17 && name.length <= 20) { //Check if given user id already
        return name;
      } else if (name.startsWith("<@!") && name.endsWith(">")) {
        return this.getUserId(guild, substring(3, name.length - 1));
      } else if (name.match(/^.{2,32}#[0-9]{4}$/)) { //Check if user tag
        const gUser = guild.members.cache.find(gUser => gUser.user.username + "#" + gUser.user.discriminator === name);
        if (gUser) return gUser.user.id;
      } else if (name.length > 2) { //Find user by nick
        const gUser = guild.members.cache.find(gUser => gUser.nickname !== null?gUser.nickname === name:gUser.user.username === name);
        if (gUser) return gUser.user.id;
      }

      return false;
    } catch(e) {
      console.log("Error Failed to Parse UserId: " + e);
      return false;
    }
  },
  pingUserText: function(userId) {
    return `<@${userId}>`
  },
  pingUser: function(userId, channel) {
    return channel.send(this.pingUserText(userId));
  },
  reactThumbsUp: function(msg) {
    msg.react("👍").catch(e => console.log("Error Failed to add Reaction: " + e));
  },
  clampValue: function(value, min, max) {
    return Math.min(Math.max(value, min), max);
  },
  embed: function(title, description) {
    return {
      embed: {
        title,
        color: "AQUA",
        description,
      }
    };
  },

});

module.exports = UTILITIES;
const Permissions = function() {
  this.users = [
    {
      "id": "492343238972145664",
      level: 0
    },
    {
      "id": "492105847397285888",
      level: 1
    }
  ];
};

Permissions.prototype.checkPerm = function(cmd, user, channel) {
  if (cmd.disabled) {
    if (cmd.showDisabled)
      channel.send(`"${cmd.name}" Command is Disabled`);
    return false;
  }

  if (cmd.maxLevel === -1) return true;

  const user = this.users.find(u => u.id === user.id);
  if (!user || user.level > cmd.maxLevel) {
    if (cmd.showPermissionError)
      channel.send(`You dont have Permissions to use "${cmd.name}"`);
    return false;
  }

  return true;
};
module.exports = new Permissions();
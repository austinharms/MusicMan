const Permissions = function() {
  this.users = [
    {
      "id": "492343238972145664",
      level: 0
    },
    {
      "id": "492105847397285888",
      level: 1
    },
    {
      "id": "385283295933628419",
      level: 5
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

  const foundUser = this.users.find(u => u.id === user.id);
  if (!foundUser || foundUser.level > cmd.maxLevel) {
    if (cmd.showPermissionError)
      channel.send(`You dont have Permissions to use "${cmd.name}"`);
    return false;
  }

  return true;
};
module.exports = new Permissions();
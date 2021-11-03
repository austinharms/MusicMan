const BotError = require("./BotError");
const SendEmbed = async (channel, title, description, image = null) => {
  try {
    const embed = {
      embed: {
        title,
        color: "AQUA",
        description,
      },
    };

    if (image !== null)
      embed.embed.image = { url: image };

    await channel.send(embed);
    return true;
  } catch(e) {
    SendError(channel, BotError(e,"Failed to Send Embed", "MsgUtil:SendEmbed", channel.guild.id, channel.id));
    return false;
  }
};

const ReactThumbsUp = async msg => {
  try {
    await msg.react("👍");
    return true;
  } catch(e) {
    SendError(msg.channel, BotError(e,"Failed to Send Embed", "MsgUtil:ReactThumbsUp", msg.guild.id, msg.channel.id, msg.author.id));
    return false;
  }
};

const SendError = async (channel, error) => {
  try {
    await channel.send({
      embed: {
        title: "There was an Error!",
        color: "RED",
        description: error.msg,
      },
    });

    return true;
  } catch(e) {
    BotError(e,"Failed to Send Error", "MsgUtil:SendError", channel.guild.id, channel.id);
    return false;
  }
};

exports.SendEmbed = SendEmbed;
exports.ReactThumbsUp = ReactThumbsUp;
exports.SendError = SendError;
const SendEmbed = async (channel, title, content, image = null) => {
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
};

const ReactThumbsUp = async msg => {
  await msg.react("👍");
};

const SendError = async (channel, errMsg) => {
  await channel.send({
    embed: {
      title: "There was an Error!",
      color: "RED",
      description: errMsg,
    },
  });
};

exports.SendEmbed = SendEmbed;
exports.ReactThumbsUp = ReactThumbsUp;
exports.SendError = SendError;
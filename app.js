require("dotenv").config();
const getServer = require("./ServerList");
const PREFIX = process.env.CMD_PREFIX;

const Discord = require('discord.js');
const discordClient = new Discord.Client();

const validateMessage = (msg) => {
  try {
    if (!msg.content.startsWith(PREFIX) || msg.author.bot || !msg.guild)
      return false;
    getServer(msg.guildId).receivedMessage(msg, PREFIX);
  } catch (e) {
    console.log("Msg Error: ", e);
    return false;
  }
};

discordClient.login(process.env.BOT_TOKEN).then(() => {
  console.log("Bot Tag: " + discordClient.user.tag);
  discordClient.on("ready", () => {
    console.log("Bot Ready");
    discordClient.user.setActivity(PREFIX + "help", { type: "WATCHING" });
    discordClient.on("message", validateMessage);
  });
}).catch(e => console.log("Login Error: ", e));
// env: [{
//   name: "BOT_TOKEN",
//   value: "ODI4NjUwNDA4MTMzOTE4NzIw.YGsq1A.a4YXHooQM-efU16pQg6Sr-Jbync"
// },
// {
//   name: "CMD_PREFIX",
//   value: "~"
// },
// {
//   name: "YT_COOKIE",
//   value: "VISITOR_INFO1_LIVE=pM0IrPqSTvo; CONSENT=WP.28e113.28e1ce.28e2df; PREF=tz=America.Winnipeg; YSC=uFkBHrSeHZg; HSID=A9UoO3Bi2g0QgQwF8; SSID=A6GFvcBbOB9JPfRXP; APISID=-7wLAtAB1EOmyTzp/AfMagQMCz1JTcK30Q; SAPISID=3qbEErk_7zYQIiJ0/At9hEpzNq9uveIRxF; __Secure-1PAPISID=3qbEErk_7zYQIiJ0/At9hEpzNq9uveIRxF; __Secure-3PAPISID=3qbEErk_7zYQIiJ0/At9hEpzNq9uveIRxF; SID=Bwjnwj2JbBiSOrBW4uJIE53HvmCz7kjvupQ1qhsusa8hmnd3spFddNzwybNIexX0wZursA.; __Secure-1PSID=Bwjnwj2JbBiSOrBW4uJIE53HvmCz7kjvupQ1qhsusa8hmnd3FaKotQBxO4jOxOOyZZMk-Q.; __Secure-3PSID=Bwjnwj2JbBiSOrBW4uJIE53HvmCz7kjvupQ1qhsusa8hmnd3ENK1WPxCwdOxTXTWW-7Vlw.; LOGIN_INFO=AFmmF2swRAIgHmmnwbr2r-3dkH_3ARXZqAxY2w-Acm6tu6AZrm1uSfECICHMiZZR3w04oA8yHbobH1kaPv9LhskAJrfRm234cufr:QUQ3MjNmd3FGZWw2WU9KaEN1ajh5SmpfdkJuSVhYanhvUGRKVjFYV1UtNXdWQnpEVXN5dWlKZGRsX25KczF6VDBXMF9GeG5HSXk3X0sxSDRIN2QwdEdHTzdmNUljRmxLbXhIQWhtQVBuX2s2YlNsRXZoOHBDbE5BMmh1UmpOVGNjNXRsNHBIbE84Z0hUV3hpcFozRTBYczlhSlFMN2hudjB3; SIDCC=AJi4QfFGfQWXSG107--pkECn6n3Vjc3xIAFtX74ZXe_2wO9C2gDm37zO6BtFj_i1QVh5sfQj; __Secure-3PSIDCC=AJi4QfGwiSXUqobf43NHDsRLEMZXcunRVF52kuR8N16DYH8EBctRpKVTtBrWZ7XCQOZdJYphRQ"
// },
// {
//   name: "YT_ID",
//   value: "QUFFLUhqbEpVSm9CRlBRU2pmRHQtTHQxN0VTQWxPa19rUXw="
// },]
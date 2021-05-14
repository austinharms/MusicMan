require('dotenv').config();
const token = process.env.BOT_TOKEN;
const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
  if (msg.content.startsWith("~hi")) {
    msg.channel.send("Hi!");
  } else if (!msg.content.toLocaleLowerCase().includes('lie') && msg.author.id === '385283295933628419') {
    msg.reply('He LIES!');
  } else if (msg.author.id === "565960196313317376" && msg.deletable) {
    //msg.delete();
  }
});

client.login(token);
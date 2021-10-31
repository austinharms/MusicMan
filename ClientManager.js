const Discord = require('discord.js');

const ClientManager = function(tokens) {
  this.clientCount = 0;
  this.clients = [];
  this.tokens = tokens;
  this.createdClients = false;
};

ClientManager.prototype.CreateClients = async function(status) {
  if (this.createdClients) return;
  this.createdClients = true;

  const clientPromises = this.tokens.map(token => this.CreateClient(token, status));
  const createdClients = await Promise.allSettled(clientPromises);
  createdClients.forEach((promise, index) => {
    if (promise.status === "fulfilled") {
      this.clients.push(promise.value);
      ++this.clientCount;
    } else if (index === 0) {
      console.warn("Failed to Create Master Client\nMay have issues with non default Master Client");
    }
  });

  if(this.clientCount === 0) throw new Error("Failed to Create Any Clients");
  console.log(`Created ${this.clientCount} Clients\nClient "${this.GetMainClient().user.tag}" as Master Client`);
};

ClientManager.prototype.CreateClient = async function(token, status) {
  const client = new Discord.Client();
  const ready = new Promise(r => client.on("ready", r));
  await client.login(token);
  await ready;
  await client.user.setActivity(status.value, status);
  console.log(`Client: ${client.user.tag}, Ready`);
  return client;
};

ClientManager.prototype.GetMainClient = function() {
  if (!this.createdClients || this.clientCount == 0) return null;
  return this.clients[0];
}

const clientManager = new ClientManager(process.env.CLIENT_TOKENS.split(","));

module.exports = clientManager;
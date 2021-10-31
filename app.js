require("dotenv").config();
const ClientManager = require("./ClientManager");
const DEVMODE = process.env.NODE_ENV && process.env.NODE_ENV === "development";
const PREFIX = (DEVMODE?"dev":"") + process.env.CMD_PREFIX;
const ADMINS = [];

if (process.env.ADMINS)
  ADMINS.push(...process.env.ADMINS.split(","));

(async () => {
  await ClientManager.CreateClients({type: "WATCHING", value: PREFIX + "help" });
})();

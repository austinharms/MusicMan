require("dotenv").config();
const CommandManager = require("./CommandManager");
const ClientManager = require("./ClientManager");
const DEVMODE = process.env.NODE_ENV && process.env.NODE_ENV === "development";
const PREFIX = (DEVMODE?"dev":"") + process.env.CMD_PREFIX;
const ADMINS = [];

if (process.env.ADMINS)
  ADMINS.push(...process.env.ADMINS.split(","));

(async () => {
  CommandManager.setPrefix(PREFIX);
  await ClientManager.CreateClients({type: "WATCHING", value: PREFIX + "help" });
  ClientManager.GetMainClient().on("message", CommandManager.onCommand);
})();

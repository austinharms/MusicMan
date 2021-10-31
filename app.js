require("dotenv").config();
const Discord = require('discord.js');

const DEVMODE = process.env.NODE_ENV && process.env.NODE_ENV === "development";
const PREFIX = (DEVMODE?"dev":"") + process.env.CMD_PREFIX;
const ADMINS = [];

if (process.env.ADMINS)
  ADMINS.push(...process.env.ADMINS.split(","));

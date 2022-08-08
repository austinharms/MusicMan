import { REST, Routes } from "discord.js";
import { Command } from "./command";

const registeredCommands : Command[] = [];

export const registerSlashCommand = (cmd: Command) => {
  registeredCommands.push(cmd);
};

export const pushSlashCommands = async () => {
  const rest :REST = new REST({ version: '10' }).setToken('token');
};
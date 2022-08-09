import { REST, Routes } from "discord.js";
import commandTI from "./command-ti";
import {createCheckers} from "ts-interface-checker";
import { Command, CommandName } from "./command";

type CommandEntry = {
  [name: CommandName]: Command
};

const registeredCommands : CommandEntry = {};

export const validateCommand = (cmd: Command) : boolean => {
  const { Command } = createCheckers(commandTI);
  try {
    Command.check(cmd);
    return true;
  } catch(e: any) {
    console.warn(`Failed to validate command: ${cmd}`);
    console.warn(e.toString());
    return false;
  }
};

export const registerCommand = (cmd: Command) : boolean => {
  if (!validateCommand(cmd)) {
    console.warn(`Failed to register invalid command object: ${cmd}`);
    return false;
  }

  if (registeredCommands.hasOwnProperty(cmd.name)) {
    console.warn(`Failed to register command "${cmd.name}"`);
    console.warn(`Command with name "${cmd.name}" already registered`);
    return false;
  }

  registeredCommands[cmd.name] = cmd;
  return true;
};

export const pushSlashCommands = async () => {
  const rest :REST = new REST({ version: '10' }).setToken('token');
};
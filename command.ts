import { ChatInputCommandInteraction } from "discord.js";

export type CommandName = string;

export interface Command {
  name: CommandName,
  description: string,
  run: (params:ChatInputCommandInteraction) => Promise<void>,
};
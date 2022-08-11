import {
  ChatInputCommandInteraction,
  ApplicationCommandOption,
} from "discord.js";

export type CommandName = string;

export interface CommandOption {
  type: number;
  name: string;
  required: boolean;
  minLength: number;
  maxLength: number;
  description: string;
  options: CommandOption[];
}

export interface Command {
  name: CommandName;
  description: string;
  run: (params: ChatInputCommandInteraction) => Promise<void>;
  options: CommandOption[];
}

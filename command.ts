import {
  ChatInputCommandInteraction,
  ApplicationCommandOption,
  GatewayIntentBits,
} from "discord.js";

export type CommandName = string;

export interface CommandOption {
  type: number;
  name: string;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  maxValue?: number;
  minValue?: number;
  description: string;
  options?: CommandOption[];
}

export interface Command {
  name: CommandName;
  description: string;
  run: (params: ChatInputCommandInteraction) => Promise<void>;
  options?: CommandOption[];
  intents: number[]; // can't be GatewayIntentBits due to ts-interface-builder not knowing the type
}

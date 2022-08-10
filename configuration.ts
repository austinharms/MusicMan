import configurationTI from "./configuration-ti";
import { createCheckers } from "ts-interface-checker";
import * as fs from "fs";
import { join } from "path";

const configPath = join(__dirname, "config.json");

export interface BotConfiguration {
  clientId: string;
  token: string;
}

export interface Configuration {
  dev: boolean;
  discord: {
    bots: BotConfiguration[];
    devGuildId?: string;
  };
  version: string;
}

const parseConfig = (): Configuration => {
  if (!fs.existsSync(configPath)) {
    console.error(`Failed to find "${configPath}"`);
    console.log("Exiting...");
    process.exit(-1);
  }

  const { Configuration } = createCheckers(configurationTI);
  const configString: string = fs.readFileSync(configPath).toString();
  try {
    const config: object = JSON.parse(configString);
    try {
      Configuration.strictCheck(config);
    } catch (e: any) {
      console.error(`Invalid "${configPath}"`);
      console.error(e.toString());
      console.log("Exiting...");
      process.exit(-1);
    }

    const loadedConfig = config as Configuration;
    if (loadedConfig.dev && !loadedConfig.discord.devGuildId)
      console.log(
        `it is recommended to define "discord.devGuildId" when running in dev mode to update slash commands faster`
      );

    return loadedConfig;
  } catch (e: any) {
    console.error(`Invalid "${configPath}", Failed to parse JSON`);
    console.log("Exiting...");
    process.exit(-1);
  }
};

export const config: Configuration = parseConfig();

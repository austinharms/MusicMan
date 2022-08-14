import configurationTI from "./configuration-ti";
import { createCheckers } from "ts-interface-checker";
import * as fs from "fs";
import { join } from "path";

export const CONFIG_PATH = join(__dirname, "config.json");

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
  yt: {
    headers: {
      [key: string]: string;
    };
  };
  version: string;
}

const parseConfig = (): Configuration => {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`Failed to find "${CONFIG_PATH}"`);
    console.log("Exiting...");
    process.exit(-1);
  }

  const { Configuration } = createCheckers(configurationTI);
  const configString: string = fs.readFileSync(CONFIG_PATH).toString();
  try {
    const config: object = JSON.parse(configString);
    try {
      Configuration.strictCheck(config);
    } catch (e: any) {
      console.error(`Invalid "${CONFIG_PATH}"`);
      console.error(e.toString());
      console.log("Exiting...");
      process.exit(-1);
    }

    const loadedConfig = config as Configuration;
    if (loadedConfig.dev && !loadedConfig.discord.devGuildId)
      console.warn(
        `it is recommended to define "discord.devGuildId" when running in dev mode to update slash commands faster`
      );

    if (
      !loadedConfig.yt.headers["x-youtube-identity-token"] ||
      !loadedConfig.yt.headers["cookie"]
    )
      console.warn(
        `to play restricted yt videos both "x-youtube-identity-token" and "cookie" must be defined under yt.headers in the config`
      );

    return loadedConfig;
  } catch (e: any) {
    console.error(`Invalid "${CONFIG_PATH}", Failed to parse JSON`);
    console.log("Exiting...");
    process.exit(-1);
  }
};

export const config: Configuration = parseConfig();

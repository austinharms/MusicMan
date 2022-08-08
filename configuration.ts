import configurationTI from "./configuration-ti";
import {createCheckers} from "ts-interface-checker";
import * as fs from "fs";

const configPath = "./config.json";

export interface Configuration {
  dev: boolean,
  discord: {
    tokens: string[],
    devGuildId?: string
  }
};

const parseConfig = () : Configuration => {
  if (!fs.existsSync(configPath)) {
    console.error(`Failed to find "${configPath}"`);
    console.log("Exiting...");
    process.exit(-1);
  }

  const { Configuration } = createCheckers(configurationTI);
  const configString :string = fs.readFileSync(configPath).toString();
  const config : object = JSON.parse(configString);
  try {
    Configuration.strictCheck(config);
  } catch(e:any) {
    console.error(`Invalid "${configPath}"`);
    console.error(e.toString());
    console.log("Exiting...");
    process.exit(-1);
  }
  return config as Configuration;
};

export const config: Configuration = parseConfig();
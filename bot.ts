import { config } from "./configuration";
import {
  getCommand,
  loadCommands,
  publishSlashCommands,
} from "./commandManager";
import {
  ChatInputCommandInteraction,
  Client,
  GatewayIntentBits,
  Interaction,
} from "discord.js";
import { Command } from "./command";
import { createErrorEmbed } from "./messageUtilities";

const createClient = async (token: string): Promise<Client> => {
  const client: Client = new Client({ intents: [GatewayIntentBits.Guilds] });
  const ready: Promise<any> = new Promise((a) => client.on("ready", a));
  await client.login(token);
  console.log(`Bot "${client.user?.tag}" Ready`);
  await ready;
  return client;
};

(async (): Promise<void> => {
  await loadCommands();
  await publishSlashCommands();
  const client: Client = await createClient(config.discord.bots[0].token);
  client.on("interactionCreate", async (interaction: Interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        const chatInteraction: ChatInputCommandInteraction =
          interaction as ChatInputCommandInteraction;
        const command: Command | null = getCommand(chatInteraction.commandName);
        if (command !== null) {
          try {
            await command.run(chatInteraction);
          } catch (e: any) {
            if (interaction.channel?.isTextBased())
              await interaction.channel.send({
                embeds: [
                  createErrorEmbed(`Failed to run command "${command.name}"`),
                ],
              });

            console.warn(
              `Error running command: "${command.name}", Error: ${e}`
            );
          }
        } else {
          await chatInteraction.reply("Invalid Command");
        }
      }
    } catch (e: any) {
      console.error(
        `Error processing interaction:\n${interaction}\nError:\n${e}`
      );
    }
  });
})();

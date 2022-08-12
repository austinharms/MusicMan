import { config } from "./configuration";
import {
  getCommand,
  loadCommands,
  publishSlashCommands,
  getCommandGatewayIntentBits,
} from "./commandManager";
import { ChatInputCommandInteraction, Client, Interaction } from "discord.js";
import { Command } from "./command";
import { createBotErrorEmbed, createErrorEmbed } from "./messageUtilities";
import { BotError } from "./BotError";

const createClient = async (token: string): Promise<Client> => {
  const client: Client = new Client({ intents: getCommandGatewayIntentBits() });
  const ready: Promise<any> = new Promise((a) => client.on("ready", a));
  await client.login(token);
  console.log(`Bot "${client.user?.tag}" Ready`);
  await ready;
  return client;
};

(async (): Promise<void> => {
  await loadCommands();
  //await publishSlashCommands();
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
            if (!(e instanceof BotError))
              e = new BotError(e, `Failed to run command "${command.name}"`);
            if (interaction.channel?.isTextBased())
              await interaction.channel.send({
                embeds: [createBotErrorEmbed(e)],
              });

            console.warn(e);
          }
        } else {
          await chatInteraction.reply({
            embeds: [createErrorEmbed("Invalid Command")],
          });
        }
      }
    } catch (e: any) {
      if (!(e instanceof BotError))
        e = new BotError(e, "Error processing command");
      console.error(e);
      if (interaction.channel?.isTextBased())
        await interaction.channel
          .send({
            embeds: [createBotErrorEmbed(e)],
          }).catch(() => {});
    }
  });
})();

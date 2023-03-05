import { config } from "./configuration";
import {
  getCommand,
  loadCommands,
  publishSlashCommands,
  getCommandGatewayIntentBits,
} from "./commandManager";
import { ChatInputCommandInteraction, Client, Interaction, TextChannel } from "discord.js";
import { Command } from "./command";
import { createBotErrorEmbed, createErrorEmbed } from "./messageUtilities";
import { BotError } from "./BotError";
import { exit } from "process";

const processInteraction = async (interaction: Interaction): Promise<void> => {
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
            await (interaction.channel as TextChannel).send({
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
      await (interaction.channel as TextChannel)
        .send({
          embeds: [createBotErrorEmbed(e)],
        })
        .catch(() => {});
  }
};

const createClient = async (token: string): Promise<Client> => {
  try {
    const client: Client = new Client({
      intents: getCommandGatewayIntentBits(),
    });
    const ready: Promise<any> = new Promise((a) => client.on("ready", a));
    await client.login(token);
    console.log(`Bot "${client.user?.tag}" Ready`);
    await ready;
    client.on("interactionCreate", processInteraction);
    return client;
  } catch (e: any) {
    throw new BotError(e, "Failed to create client");
  }
};

(async (): Promise<void> => {
  console.log("Starting Music Man " + config.version);
  console.log("Loading Commands");
  await loadCommands();
  console.log("Loading Clients");
  const clients: PromiseSettledResult<Client>[] = await Promise.allSettled(
    config.discord.bots.map(({ token, clientId }) =>
      createClient(token).then(async (client: Client) => {
        await publishSlashCommands(token, clientId);
        console.log(`Updated ${client.user?.tag} Slash Commands`);
        return client;
      })
    )
  );

  const loadedClients: Client[] = clients
    .filter((res) => res.status === "fulfilled")
    .map((res) => (res as PromiseFulfilledResult<Client>).value);
  if (loadedClients.length === 0) {
    console.error("Failed to load any clients");
    exit(-1);
  }

  console.log(`Loaded ${loadedClients.length}/${clients.length} Clients`);
  console.log("Music Man Ready");
})();

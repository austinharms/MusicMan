import { config } from "./configuration";
import { getCommand, loadCommands, publishSlashCommands } from "./commandManager";
import { ChatInputCommandInteraction, Client, GatewayIntentBits, Interaction, MessageContextMenuCommandInteraction } from "discord.js";
import { Command } from "./command";

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
    //await publishSlashCommands();
    const client: Client = await createClient(config.discord.bots[0].token);
    client.on("interactionCreate",async (interaction: Interaction) => {
        if (interaction.isChatInputCommand()) {
            const chatInteraction: ChatInputCommandInteraction = interaction as ChatInputCommandInteraction;
            const command: Command | null = getCommand(chatInteraction.commandName);
            if (command !== null) {
                 await command.run(chatInteraction);
            } else {
                await chatInteraction.reply('Invalid Command');
            }
        }
    });
})();
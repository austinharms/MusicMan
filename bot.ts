import { config } from "./configuration";
import { loadCommands, publishSlashCommands } from "./commandManager";
import { ChatInputCommandInteraction, Client, GatewayIntentBits, Interaction, MessageContextMenuCommandInteraction } from "discord.js";

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
        console.log(interaction);
        if (interaction.isChatInputCommand()) {
            const chatInteraction: ChatInputCommandInteraction = interaction as ChatInputCommandInteraction;
            await chatInteraction.reply('Pong!');
        }
    });
})();
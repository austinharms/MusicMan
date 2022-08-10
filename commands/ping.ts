import { ChatInputCommandInteraction } from "discord.js";
import { Command } from "../command";

const ping: Command = {
    "name": "ping",
    "description": "test command",
    "run": async (interaction: ChatInputCommandInteraction) => {
        await interaction.deferReply({ ephemeral: true }).then(console.log);
        await interaction.followUp({ 
            content: "Pong!",
            ephemeral: false
        });
    }
};

export default ping;
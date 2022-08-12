import { ChatInputCommandInteraction, GatewayIntentBits } from "discord.js";
import { Command } from "../command";
import { createEmbed } from "../messageUtilities";

const ping: Command = {
  name: "ping",
  description: "test command",
  options: [],
  intents: [GatewayIntentBits.Guilds],
  run: async (interaction: ChatInputCommandInteraction) => {
    await interaction.reply({
      ephemeral: false,
      embeds: [createEmbed("Ping", "Pong!")],
    });
  },
};

export default ping;

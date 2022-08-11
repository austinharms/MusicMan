import { ChatInputCommandInteraction } from "discord.js";
import { Command } from "../command";
import { createEmbed, createErrorEmbed } from "../messageUtilities";
import { Song } from "../song";
import { getSongs, ResolveError } from "../songResolver";

const ping: Command = {
  name: "validate",
  description: "check if search is valid",
  options: [
    {
      type: 3,
      name: "song",
      required: true,
      minLength: 3,
      maxLength: 4000,
      description: "URL or Search Input",
      options: [],
    },
  ],
  run: async (interaction: ChatInputCommandInteraction) => {
    await interaction.reply({
      ephemeral: true,
      embeds: [createEmbed("Validate", "Loading...")],
    });
    try {
      const songs: Song[] = await getSongs(
        interaction.options.get("song", true).value as string
      );
      await interaction.editReply({
        embeds: [createEmbed("Validate", songs.reduce((acc: string, {title}: Song) => acc + title + "\n" , ""), songs[0].thumbnail)],
      });
    } catch (e: any) {
      const message: string =
        (e instanceof ResolveError && e.userMessage) ||
        "Failed to validate song";
      await interaction.editReply({
        embeds: [createErrorEmbed(message)],
      });
    }
  },
};

export default ping;

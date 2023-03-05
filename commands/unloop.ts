import { AudioPlayerStatus } from "@discordjs/voice";
import {
  ChatInputCommandInteraction,
  GuildMember,
  VoiceChannel,
  ChannelType,
  GatewayIntentBits,
  InteractionResponse,
} from "discord.js";
import { BotError } from "../BotError";
import { Command } from "../command";
import { createEmbed, createBotErrorEmbed } from "../messageUtilities";
import { SongStream } from "../songStream";
import {
  getVoiceConnectionInterface,
  VoiceConnectionInterface,
} from "../voiceManager";

const skip: Command = {
  name: "unloop",
  description: "stops looping the current song queue",
  intents: [GatewayIntentBits.Guilds],
  options: [],
  run: async (interaction: ChatInputCommandInteraction) => {
    // Don't need to wait for this to process the rest of the command
    const loadingReply: Promise<InteractionResponse<boolean>> =
      interaction.reply({
        embeds: [createEmbed("Unloop", "Loading...")],
      });

    try {
      const member: GuildMember = interaction.member as GuildMember;
      if (
        !member.voice.channel ||
        member.voice.channel.type !== ChannelType.GuildVoice
      )
        throw new BotError(
          "Unloop command user not in bot voice channel",
          "You must be in a bot voice channel"
        );

      const voiceChannel: VoiceChannel = member.voice.channel as VoiceChannel;
      const connectionInterface: VoiceConnectionInterface | null =
        getVoiceConnectionInterface(voiceChannel);
      if (!connectionInterface)
        throw new BotError(
          "Unloop command user not in bot voice channel",
          "You must be in a bot voice channel"
        );

      // need to wait for reply before we can edit it
      await loadingReply;
      if (!connectionInterface.looped) {
        await interaction.editReply({
          embeds: [
            createEmbed(
              "Unloop",
              "Queue is not looped"
            ),
          ],
        });
      } else {
        connectionInterface.looped = false;
        await interaction.editReply({
          embeds: [
            createEmbed(
              "Unloop",
              "Stopped looping queue"
            ),
          ],
        });
      }
    } catch (e: any) {
      if (!(e instanceof BotError)) e = new BotError(e, "Failed to unloop queue");

      // need to wait for reply before we can edit it
      await loadingReply;
      await interaction.editReply({
        embeds: [createBotErrorEmbed(e)],
      });
    }
  },
};

export default skip;

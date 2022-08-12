import { ChatInputCommandInteraction, GuildMember, VoiceChannel, ChannelType, GatewayIntentBits, InteractionResponse } from "discord.js";
import { BotError } from "../BotError";
import { Command } from "../command";
import { createEmbed, createBotErrorEmbed } from "../messageUtilities";
import { Song } from "../song";
import { getSongs } from "../songResolver";
import { getVoiceConnectionInterface, VoiceConnectionInterface } from "../voiceManager";

const play: Command = {
  name: "play",
  description: "Play song in VC",
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
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
    // Don't need to wait for this to process the rest of the command
    const loadingReply: Promise<InteractionResponse<boolean>> = interaction.reply({
      ephemeral: true,
      embeds: [createEmbed("Play", "Loading...")],
    });

    try {
      const member: GuildMember = interaction.member as GuildMember;
      if (!member.voice.channel || member.voice.channel.type !== ChannelType.GuildVoice)
        throw new BotError("play command user not in voice channel", "You must be in a voice channel");

      const voiceChannel: VoiceChannel = member.voice.channel as VoiceChannel;
      if (!voiceChannel.joinable)
        throw new BotError("play command user voice channel not joinable", "Can not join voice channel");

      const connectionInterface: VoiceConnectionInterface = await getVoiceConnectionInterface(voiceChannel);
      const songs: Song[] = await getSongs(
        interaction.options.get("song", true).value as string
      );
      await connectionInterface.queueSong(songs);
      // need to wait for reply before we can edit it
      await loadingReply;
      await interaction.editReply({
        embeds: [createEmbed("Play", songs.reduce((acc: string, { title }: Song) => acc + title + "\n", ""), songs[0].thumbnail?.href)],
      });
    } catch (e: any) {
      if (!(e instanceof BotError))
        e = new BotError(e, "Failed to play song");

      // need to wait for reply before we can edit it
      await loadingReply;
      await interaction.editReply({
        embeds: [createBotErrorEmbed(e)]
      });
    }
  },
};

export default play;
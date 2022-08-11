import { channel } from "diagnostics_channel";
import { ChannelType, ChatInputCommandInteraction, GuildMember, VoiceChannel } from "discord.js";
import { BotError } from "../BotError";
import { Command } from "../command";
import { createEmbed, createBotErrorEmbed } from "../messageUtilities";
import { Song } from "../song";
import { getSongs } from "../songResolver";
import { getVoiceConnectionInterface, VoiceConnectionInterface } from "../voiceManager";

const play: Command = {
  name: "play",
  description: "Play song in VC",
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
      embeds: [createEmbed("Play", "Loading...")],
    });
    try {
      
      const member: GuildMember = interaction.guild?.members.resolve(interaction.member?.user.id as string) as GuildMember; // await (interaction.member as GuildMember).fetch(true);
      if (!member.voice.channel || member.voice.channel.type !== ChannelType.GuildVoice)
        throw new BotError("play command user not in voice channel", "You must be in a voice channel");

      const voiceChannel: VoiceChannel = member.voice.channel;
      if (!voiceChannel.joinable)
        throw new BotError("play command user voice channel not joinable", "Can not join voice channel");
      
      const connectionInterface: VoiceConnectionInterface = await getVoiceConnectionInterface(voiceChannel);
      const songs: Song[] = await getSongs(
        interaction.options.get("song", true).value as string
      );
      connectionInterface.queueSong(songs[0]);
      await interaction.editReply({
        embeds: [createEmbed("Play", songs.reduce((acc: string, { title }: Song) => acc + title + "\n", ""), songs[0].thumbnail?.href)],
      });
    } catch (e: any) {
      if (!(e instanceof BotError))
        e = new BotError(e, "Failed to play song");

      await interaction.editReply({
        embeds: [createBotErrorEmbed(e)]
      });
    }
  },
};

export default play;
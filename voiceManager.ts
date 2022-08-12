import { Song } from "./song";
import {
  joinVoiceChannel,
  VoiceConnection,
  entersState,
  VoiceConnectionStatus,
  VoiceConnectionState,
  createAudioResource,
  StreamType,
  AudioResource,
  AudioPlayer,
  createAudioPlayer,
  AudioPlayerState,
  AudioPlayerStatus,
  getVoiceConnection,
} from "@discordjs/voice";
import { VoiceChannel } from "discord.js";
import { BotError } from "./BotError";
import { updateSong } from "./songResolver";

const connectionInterfaces: Map<
  string,
  Map<string, VoiceConnectionInterface>
> = new Map<string, Map<string, VoiceConnectionInterface>>();

export class VoiceConnectionInterface {
  connection?: VoiceConnection;
  channel: VoiceChannel;
  userId: string;
  destroyed: boolean;
  queue: Song[];
  idleTimeout?: NodeJS.Timeout;
  playing?: Song;
  player?: AudioPlayer;
  boundPlayerStateChange: (
    oldState: AudioPlayerState,
    newState: AudioPlayerState
  ) => void;
  boundConnectionStateChange: (
    oldSate: VoiceConnectionState,
    newState: VoiceConnectionState
  ) => void;
  boundDestroy: () => void;

  constructor(channel: VoiceChannel) {
    this.channel = channel;
    this.userId = channel.client.user?.id as string;
    this.destroyed = false;
    this.queue = [];
    this.playing = undefined;
    this.player = undefined;
    this.boundPlayerStateChange = this.playerStateChange.bind(this);
    this.boundDestroy = this.destroy.bind(this);
    this.boundConnectionStateChange = this.connectionStateChange.bind(this);

    if (!connectionInterfaces.has(this.userId))
      connectionInterfaces.set(
        this.userId,
        new Map<string, VoiceConnectionInterface>()
      );
    const map: Map<string, VoiceConnectionInterface> = connectionInterfaces.get(
      this.userId
    ) as Map<string, VoiceConnectionInterface>;
    map.set(this.channel.id, this);
  }

  async init(): Promise<void> {
    try {
      this.connection =
        getVoiceConnection(this.channel.guild.id) ||
        joinVoiceChannel({
          channelId: this.channel.id,
          guildId: this.channel.guild.id,
          adapterCreator: this.channel.guild.voiceAdapterCreator,
          selfDeaf: true,
          selfMute: false,
        });
      this.connection.once("error", this.boundDestroy);
      this.connection.on("stateChange", this.boundConnectionStateChange);

      await entersState(
        this.connection,
        VoiceConnectionStatus.Ready,
        30000
      ).catch((e: any) => {
        throw new BotError(e, "Failed to join voice channel");
      });

      this.connection.setSpeaking(true);
      this.player = createAudioPlayer();
      this.connection.subscribe(this.player);
      this.player.on("stateChange", this.boundPlayerStateChange);
      this.setIdleTimeout();
    } catch (e: any) {
      this.destroy();
      if (e instanceof BotError) throw e;
      throw new BotError(e, "Failed to join voice channel");
    }
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    console.log("Voice Connection Destroyed");
    this.clearIdleTimeout();
    this.player?.removeListener("stateChange", this.boundPlayerStateChange);
    this.player?.stop(true);
    this.connection?.removeListener("stateChange", this.boundConnectionStateChange);
    this.connection?.removeListener("error", this.boundDestroy);
    this.connection?.destroy();
    const map: Map<string, VoiceConnectionInterface> = connectionInterfaces.get(
      this.userId
    ) as Map<string, VoiceConnectionInterface>;
    map.delete(this.channel.id);
    if (map.size === 0) connectionInterfaces.delete(this.userId);
  }

  async queueSong(song: Song): Promise<void> {
    if (this.destroyed) return;
    this.queue.push(song);
    if (!this.playing) await this.onSongEnd();
  }

  private setIdleTimeout(): void {
    this.clearIdleTimeout();
    if (this.destroyed) return;
    this.idleTimeout = setTimeout(this.boundDestroy, 30000);
  }

  private clearIdleTimeout(): void {
    clearTimeout(this.idleTimeout);
    this.idleTimeout = undefined;
  }

  private async onSongEnd(): Promise<void> {
    if (this.destroyed) return;
    if (this.queue.length === 0) {
      this.setIdleTimeout();
      return;
    }

    this.playing = await updateSong(this.queue.shift() as Song);
    this.clearIdleTimeout();
    const resource: AudioResource = createAudioResource(
      this.playing?.playbackURL?.href as string,
      { inputType: StreamType.Arbitrary }
    );
    this.player?.play(resource);
  }

  private playerStateChange(
    oldState: AudioPlayerState,
    newState: AudioPlayerState
  ) {
    console.log(newState.status);
    if (newState.status === AudioPlayerStatus.Idle) this.onSongEnd();
  }

  private connectionStateChange(
    oldSate: VoiceConnectionState,
    newState: VoiceConnectionState
  ) {
    if (
      newState.status === VoiceConnectionStatus.Destroyed ||
      newState.status === VoiceConnectionStatus.Disconnected
    ) {
      this.connection = undefined;
      this.destroy();
    }
  }
}

export const getVoiceConnectionInterface = async (
  channel: VoiceChannel
): Promise<VoiceConnectionInterface> => {
  let voiceConnection: VoiceConnectionInterface | null = null;
  try {
    const userId: string = channel.client.user?.id as string;
    if (!connectionInterfaces.has(userId))
      connectionInterfaces.set(
        userId,
        new Map<string, VoiceConnectionInterface>()
      );
    const map: Map<string, VoiceConnectionInterface> = connectionInterfaces.get(
      userId
    ) as Map<string, VoiceConnectionInterface>;
    if (map.has(channel.id))
      return map.get(channel.id) as VoiceConnectionInterface;
    voiceConnection = new VoiceConnectionInterface(channel);
    await voiceConnection.init();
    return voiceConnection;
  } catch (e: any) {
    voiceConnection?.destroy();
    if (e instanceof BotError) throw e;
    throw new BotError(e, "Failed to join voice channel");
  }
};

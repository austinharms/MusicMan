import { Song } from "./song";
import { createDiscordJSAdapter } from './adapter';
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
} from '@discordjs/voice';
import { VoiceChannel } from "discord.js";
import { BotError } from "./BotError";

const connectionInterfaces: Map<string, Map<string, VoiceConnectionInterface>> = new Map<string, Map<string, VoiceConnectionInterface>>();

export class VoiceConnectionInterface {
  connection?: VoiceConnection;
  channel: VoiceChannel;
  userId: string;
  destroyed: boolean;
  queue: Song[];
  idleTimeout?: NodeJS.Timeout;
  playing?: Song;
  player?: AudioPlayer;

  constructor(channel: VoiceChannel) {
    this.channel = channel;
    this.userId = channel.client.user?.id as string;
    this.destroyed = false;
    this.queue = [];
    this.playing = undefined;
    this.player = undefined;

    if (!connectionInterfaces.has(this.userId))
      connectionInterfaces.set(this.userId, new Map<string, VoiceConnectionInterface>());
    const map: Map<string, VoiceConnectionInterface> = connectionInterfaces.get(this.userId) as Map<string, VoiceConnectionInterface>;
    map.set(this.channel.id, this);
  };

  async init(): Promise<void> {
    try {
      this.connection = joinVoiceChannel({
        channelId: this.channel.id,
        guildId: this.channel.guild.id,
        adapterCreator: createDiscordJSAdapter(this.channel),
      });

      console.log(this.connection.state);
      this.connection.on("stateChange", (oldSate: VoiceConnectionState, newState: VoiceConnectionState) => {
        console.log(`Connection State Change: ${newState.status}`);
        if (newState.status === VoiceConnectionStatus.Destroyed) {
          this.connection = undefined;
          this.destroy();
        }
      });

      if (this.connection.state.status !== VoiceConnectionStatus.Ready)
        await entersState(this.connection, VoiceConnectionStatus.Ready, 30000).catch((e: any) => { throw new BotError(e, "Failed to join voice channel"); });

      this.player = createAudioPlayer();
      this.connection.subscribe(this.player);
      this.player.on("stateChange", (oldState: AudioPlayerState, newState: AudioPlayerState) => {
        if (newState.status === AudioPlayerStatus.Idle) this.onSongEnd.bind(this);
      });
      this.setIdleTimeout();
    } catch (e: any) {
      if (e instanceof BotError) throw e;
      throw new BotError(e, "Failed to join voice channel");
    }
  };

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.clearIdleTimeout();
    this.connection?.destroy();
    const map: Map<string, VoiceConnectionInterface> = connectionInterfaces.get(this.userId) as Map<string, VoiceConnectionInterface>;
    map.delete(this.channel.id);
    if (map.size === 0) connectionInterfaces.delete(this.userId);
  };

  queueSong(song: Song): void {
    if (this.destroyed) return;
    this.queue.push(song);
    if (!this.playing)
      this.onSongEnd();
  };

  private setIdleTimeout(): void {
    if (this.destroyed) return;
    this.clearIdleTimeout();
    this.idleTimeout = setTimeout(this.destroy.bind(this), 30000);
  };

  private clearIdleTimeout(): void {
    clearTimeout(this.idleTimeout);
    this.idleTimeout = undefined;
  };

  private async onSongEnd(): Promise<void> {
    if (this.destroyed) return;
    if (this.queue.length === 0) {
      this.setIdleTimeout();
      return;
    }

    this.playing = this.queue.shift();
    this.clearIdleTimeout();
    const resource: AudioResource = createAudioResource(this.playing?.playbackURL?.href as string, { inputType: StreamType.Arbitrary });
    this.player?.play(resource);
  };
};

export const getVoiceConnectionInterface = async (channel: VoiceChannel): Promise<VoiceConnectionInterface> => {
  let voiceConnection: VoiceConnectionInterface | null = null;
  try {
    const userId: string = channel.client.user?.id as string;
    if (!connectionInterfaces.has(userId))
      connectionInterfaces.set(userId, new Map<string, VoiceConnectionInterface>());
    const map: Map<string, VoiceConnectionInterface> = connectionInterfaces.get(userId) as Map<string, VoiceConnectionInterface>;
    if (map.has(channel.id)) return map.get(channel.id) as VoiceConnectionInterface;
    voiceConnection = new VoiceConnectionInterface(channel);
    await voiceConnection.init();
    return voiceConnection;
  } catch (e: any) {
    voiceConnection?.destroy();
    if (e instanceof BotError) throw e;
    throw new BotError(e, "Failed to join voice channel");
  }
};
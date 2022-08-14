import { Song } from "./song";
import {
  joinVoiceChannel,
  VoiceConnection,
  entersState,
  VoiceConnectionStatus,
  VoiceConnectionState,
  AudioPlayer,
  createAudioPlayer,
  AudioPlayerState,
  AudioPlayerStatus,
  getVoiceConnection,
} from "@discordjs/voice";
import { VoiceChannel } from "discord.js";
import { BotError } from "./BotError";
import { createSongStream, SongStream } from "./songStream";

const connectionInterfaces: Map<
  string,
  Map<string, VoiceConnectionInterface>
> = new Map<string, Map<string, VoiceConnectionInterface>>();

export class VoiceConnectionInterface {
  private _connection?: VoiceConnection;
  private _channel: VoiceChannel;
  private _userId: string;
  private _destroyed: boolean;
  private _queue: Song[];
  private _idleTimeout?: NodeJS.Timeout;
  private _playing?: SongStream;
  private _player?: AudioPlayer;
  private _pendingSongChange: boolean;
  private boundPlayerStateChange: (
    oldState: AudioPlayerState,
    newState: AudioPlayerState
  ) => void;
  private boundConnectionStateChange: (
    oldSate: VoiceConnectionState,
    newState: VoiceConnectionState
  ) => void;
  private boundDestroy: () => void;

  constructor(channel: VoiceChannel) {
    this._channel = channel;
    this._userId = channel.client.user?.id as string;
    this._destroyed = false;
    this._queue = [];
    this._playing = undefined;
    this._player = undefined;
    this._pendingSongChange = false;
    this.boundPlayerStateChange = this.playerStateChange.bind(this);
    this.boundDestroy = this.destroy.bind(this);
    this.boundConnectionStateChange = this.connectionStateChange.bind(this);

    if (!connectionInterfaces.has(this._userId))
      connectionInterfaces.set(
        this._userId,
        new Map<string, VoiceConnectionInterface>()
      );
    const map: Map<string, VoiceConnectionInterface> = connectionInterfaces.get(
      this._userId
    ) as Map<string, VoiceConnectionInterface>;
    map.set(this._channel.id, this);
  }

  async init(): Promise<void> {
    try {
      this._connection = getVoiceConnection(this._channel.guild.id);
      if (this._connection) {
        switch (this._connection.state.status) {
          case VoiceConnectionStatus.Disconnected:
            this._connection.rejoin({
              channelId: this._channel.id,
              selfDeaf: true,
              selfMute: false,
            });
            break;

          case VoiceConnectionStatus.Connecting:
          case VoiceConnectionStatus.Signalling:
          case VoiceConnectionStatus.Ready:
            if (this._connection.joinConfig.channelId !== this._channel.id) {
              // Don't want to destroy another VoiceConnectionInterface VoiceConnection
              this._connection = undefined;
              this.destroy();
              throw new BotError(
                "Voice Connection already in use",
                "Bot already in use"
              );
            }
            break;
        }
      } else {
        this._connection = joinVoiceChannel({
          channelId: this._channel.id,
          guildId: this._channel.guild.id,
          adapterCreator: this._channel.guild.voiceAdapterCreator,
          selfDeaf: true,
          selfMute: false,
        });
      }

      this._connection.once("error", this.boundDestroy);
      this._connection.on("stateChange", this.boundConnectionStateChange);

      await entersState(
        this._connection,
        VoiceConnectionStatus.Ready,
        30000
      ).catch((e: any) => {
        throw new BotError(e, "Failed to join voice channel");
      });

      this._connection.setSpeaking(false);
      this._player = createAudioPlayer();
      this._connection.subscribe(this._player);
      this._player.on("stateChange", this.boundPlayerStateChange);
      this.setIdleTimeout();
    } catch (e: any) {
      this.destroy();
      if (e instanceof BotError) throw e;
      throw new BotError(e, "Failed to join voice channel");
    }
  }

  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this.clearIdleTimeout();
    this.queue.length = 0;
    this._playing?.destroy();
    this._playing = undefined;
    this._player?.removeListener("stateChange", this.boundPlayerStateChange);
    this._player?.stop(true);
    this._player = undefined;
    this._connection?.removeListener(
      "stateChange",
      this.boundConnectionStateChange
    );
    this._connection?.removeListener("error", this.boundDestroy);
    this._connection?.destroy();
    this._connection = undefined;
    const map: Map<string, VoiceConnectionInterface> = connectionInterfaces.get(
      this._userId
    ) as Map<string, VoiceConnectionInterface>;
    map.delete(this._channel.id);
    if (map.size === 0) connectionInterfaces.delete(this._userId);
  }

  async queueSong(songs: Song[], front: boolean = false): Promise<void> {
    try {
      if (this._destroyed)
        new BotError(
          "Attempted to queue songs on destroyed VoiceConnectionInterface",
          "Failed to queue song"
        );
      if (!front) {
        this._queue.push(...songs);
      } else {
        this._queue.unshift(...songs);
      }

      if (!this._playing) await this.onSongEnd();
    } catch (e: any) {
      if (!(e instanceof BotError)) e = new BotError(e, "Failed to queue song");
      throw e;
    }
  }

  removeSong(index: number): Song {
    try {
      if (this._queue.length === 0)
        throw new BotError(
          "VoiceConnectionInterface remove queue empty",
          `Queue is empty`
        );

      if (index < 1 || index > this._queue.length)
        throw new BotError(
          "VoiceConnectionInterface remove index out of range",
          `Index out of range: min: 1, max: ${this._queue.length}`
        );

      return this._queue.splice(index - 1, 1)[0];
    } catch (e: any) {
      if (!(e instanceof BotError))
        e = new BotError(e, "Failed to remove song");
      throw e;
    }
  }

  async skipSongs(count: number = 1): Promise<void> {
    try {
      if (count < 1 || (count > this._queue.length && this._queue.length > 0))
        throw new BotError(
          "VoiceConnectionInterface skip count out of range",
          `Count out of range: min: 1, max: ${this._queue.length}`
        );
      if (count > 1) this._queue.splice(0, count - 1);
      await this.onSongEnd(true);
    } catch (e: any) {
      if (!(e instanceof BotError)) e = new BotError(e, "Failed to skip song");
      throw e;
    }
  }

  async stopSongs(): Promise<void> {
    try {
      this._queue.length = 0;
      await this.onSongEnd();
    } catch (e: any) {
      if (!(e instanceof BotError))
        e = new BotError(e, "Failed to stop playing");
      throw e;
    }
  }

  get destroyed(): boolean {
    return this._destroyed;
  }

  get channel(): VoiceChannel {
    return this._channel;
  }

  get queue(): Song[] {
    return [...this._queue];
  }

  get playing(): boolean {
    return !!this._playing && !this._playing.destroyed;
  }

  getCurrentSongStream(): SongStream | null {
    return this._playing || null;
  }

  private setIdleTimeout(): void {
    this.clearIdleTimeout();
    if (this._destroyed) return;
    this._idleTimeout = setTimeout(this.boundDestroy, 30000);
  }

  private clearIdleTimeout(): void {
    clearTimeout(this._idleTimeout);
    this._idleTimeout = undefined;
  }

  private async onSongEnd(autoRetry: boolean = false): Promise<void> {
    if (this._destroyed) return;
    // this is needed if an AudioPlayer event if emitted while a command is running
    if (this._pendingSongChange) return;
    this._pendingSongChange = true;
    while (true) {
      try {
        this.clearIdleTimeout();
        this._playing?.destroy();
        this._playing = undefined;
        if (this._queue.length === 0) {
          this.setIdleTimeout();
          this._pendingSongChange = false;
          return;
        }

        this._playing = await createSongStream(this._queue.shift() as Song);
        // needed if the VoiceConnectionInterface is destroyed while the SongStream is loaded
        if (!this._player) {
          this._playing.destroy();
          this._playing = undefined;
          this._pendingSongChange = false;
          return;
        }

        this._player?.play(this._playing.resource!);
        await entersState(this._player!, AudioPlayerStatus.Playing, 30000);
        this._pendingSongChange = false;
        return;
      } catch (e: any) {
        if (!(e instanceof BotError))
          e = new BotError(e, "Failed to play next song");
        console.warn(e);
        this._pendingSongChange = false;
        if (autoRetry) continue;
        this.setIdleTimeout();
        throw e;
      }
    }
  }

  private playerStateChange(
    oldState: AudioPlayerState,
    newState: AudioPlayerState
  ) {
    if (
      newState.status === AudioPlayerStatus.Idle &&
      oldState.status !== AudioPlayerStatus.Idle
    )
      this.onSongEnd(true).catch(console.warn);
  }

  private connectionStateChange(
    oldSate: VoiceConnectionState,
    newState: VoiceConnectionState
  ) {
    if (
      newState.status === VoiceConnectionStatus.Destroyed ||
      newState.status === VoiceConnectionStatus.Disconnected
    ) {
      this._connection = undefined;
      this.destroy();
    }
  }
}

export const getVoiceConnectionInterface = (
  channel: VoiceChannel
): VoiceConnectionInterface | null => {
  const userId: string | undefined = channel.client.user?.id;
  if (!userId) return null;
  return connectionInterfaces.get(userId)?.get(channel.id) || null;
};

// returns existing interface if it exists if not creates a new one
export const createVoiceConnectionInterface = async (
  channel: VoiceChannel
): Promise<VoiceConnectionInterface> => {
  let voiceConnection: VoiceConnectionInterface | null = null;
  try {
    const userId: string | undefined = channel.client.user?.id;
    if (!userId)
      throw new BotError(
        "createVoiceConnectionInterface user id not defined",
        "Failed to join voice channel"
      );
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
import { FFmpeg, opus } from "prism-media";
import { Format, Song } from "./song";
import { updateSong } from "./songResolver";
import {
  AudioResource,
  createAudioResource,
  StreamType,
} from "@discordjs/voice";
import { BotError } from "./BotError";
import { createSongFormatPlayer, FormatPlayer } from "./formatPlayer";

export const BASE_FFMPEG_ARGS: string[] = [
  "-analyzeduration",
  "0",
  "-loglevel",
  "0",
  "-f",
  "s16le",
  "-ar",
  "48000",
  "-ac",
  "2",
];

export interface SongStreamOptions {
  headers: { [key: string]: string };
  bassGain?: number;
  playbackOffset?: number;
}

export class SongStream {
  private _song: Song;
  private _destroyed: boolean;
  private _resource?: AudioResource;
  private _ffmpegStream?: FFmpeg;
  private _opusStream?: opus.Encoder;
  private _formatPlayer?: FormatPlayer;
  private readonly boundError: (e: any) => void;
  readonly options?: SongStreamOptions;

  constructor(song: Song, options?: SongStreamOptions) {
    this._song = song;
    this._destroyed = false;
    this.options = options;
    this.boundError = this.error.bind(this);
  }

  public async init(): Promise<void> {
    try {
      this._song = await updateSong(this._song);
      // Create FFmpeg Stream
      const ffmpegArgs: string[] = [...BASE_FFMPEG_ARGS];
      if (this.options?.bassGain)
        ffmpegArgs.push("-af", "bass=g=" + this.options.bassGain);
      if (this.options?.playbackOffset)
        ffmpegArgs.push("-ss", this.options.playbackOffset.toString());
      this._ffmpegStream = new FFmpeg({
        args: ffmpegArgs,
      });
      this._ffmpegStream.once("error", this.boundError);

      // Create Opus Stream
      this._opusStream = new opus.Encoder({
        rate: 48000,
        channels: 2,
        frameSize: 960,
      });
      this._opusStream.once("error", this.boundError);

      // Create discordjs Resource
      this._resource = createAudioResource(this._opusStream, {
        inputType: StreamType.Opus,
        inlineVolume: false,
      });

      this._ffmpegStream.pipe(this._opusStream);
      this._formatPlayer = createSongFormatPlayer(this._song, this._ffmpegStream);
      this._formatPlayer.once("error", this.boundError);
    } catch (e: any) {
      if (!(e instanceof BotError))
        e = new BotError(e, "Failed to create song stream");
      this.destroy();
      throw e;
    }
  }

  public get song(): Song {
    return this._song;
  }

  public get destroyed(): boolean {
    return this._destroyed;
  }

  public get resource(): AudioResource | null {
    return this._resource || null;
  }

  public destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;

    this._formatPlayer?.destroy();
    this._formatPlayer = undefined;

    if (this._ffmpegStream && !this._ffmpegStream.destroyed) {
      this._ffmpegStream.removeListener("error", this.boundError);
      this._ffmpegStream.destroy();
      // required to ensure buffered data is drained, prevents memory leak
      this._ffmpegStream.read();
      this._ffmpegStream = undefined;
    }

    if (this._resource?.audioPlayer) this._resource.audioPlayer.stop();

    // this.resource.playStream "should" be cleaned up by this._resource.audioPlayer.stop(), but just in case its not
    if (this._resource && !this._resource.playStream.destroyed) {
      this._resource.playStream.destroy();
      // required to ensure buffered data is drained, prevents memory leak
      this._resource.playStream.read();
      this._resource = undefined;
    }

    // this.resource.playStream "should" be this._opusStream, but just in case its not
    if (this._opusStream && !this._opusStream.destroyed) {
      this._opusStream.removeListener("error", this.boundError);
      this._opusStream.destroy();
      // required to ensure buffered data is drained, prevents memory leak
      this._opusStream.read();
      this._opusStream = undefined;
    }
  }

  private error(e: any): void {
    console.warn(new BotError(e, "Song Stream Error"));
    this.destroy();
  }
}

export const createSongStream = async (song: Song): Promise<SongStream> => {
  try {
    Format.ARBITRARY;
    const stream: SongStream = new SongStream(song);
    await stream.init();
    return stream;
  } catch (e: any) {
    if (!(e instanceof BotError))
      e = new BotError(e, "Failed to create song stream");
    throw e;
  }
};

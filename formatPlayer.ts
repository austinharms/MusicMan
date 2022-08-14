import EventEmitter from "events";
import { Writable } from "stream";
import { BotError } from "./BotError";
import { Format, Song, Source } from "./song";
import { default as m3u8stream } from "m3u8stream";
import { config } from "./configuration";
import { default as miniget, Options as MinigetOptions } from "miniget";

export const DL_CHUNK_SIZE: number = 1024 * 1024 * 10;

export const BASE_MINIGET_OPTIONS: miniget.Options = {
  maxReconnects: 6,
  maxRetries: 3,
  backoff: { inc: 500, max: 10000 },
  highWaterMark: 1024 * 512,
};

export declare interface FormatPlayer {
  on(event: "error", listener: (e: any) => void): this;
  once(event: "error", listener: (e: any) => void): this;
  on(event: "destroyed", listener: () => void): this;
  once(event: "destroyed", listener: () => void): this;
}

export class FormatPlayer extends EventEmitter {
  private _song: Song;
  protected _outputStream: Writable;
  private _destroyed: boolean;
  readonly format: Format;

  constructor(format: Format, song: Song, stream: Writable) {
    if (song.format !== format)
      throw new BotError(
        `SongStream song format was incorrect, expected "${format}", got "${song.format}""`,
        "Failed to play song, Incorrect format"
      );
    super();
    this.format = format;
    this._destroyed = false;
    this._song = song;
    this._outputStream = stream;
  }

  get song(): Song {
    return this._song;
  }

  get destroyed(): boolean {
    return this._destroyed;
  }

  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    console.log("Format Player Destroyed");
    this.emit("destroyed");
  }
}

export class ArbitraryFormatPlayer extends FormatPlayer {
  private _minigetStream?: miniget.Stream;

  constructor(song: Song, stream: Writable) {
    super(Format.ARBITRARY, song, stream);
    const options: MinigetOptions = { ...BASE_MINIGET_OPTIONS };
    if (song.source === Source.YT) {
      options.headers = {
        ...options.headers,
        ...config.yt.headers,
      };
    }

    this._minigetStream = miniget(song.playbackURL?.href as string, options);
    this._minigetStream.pipe(this._outputStream);
  }

  destroy(): void {
    if (this.destroyed) return;
    super.destroy();

    this._minigetStream?.unpipe(this._outputStream);
    this._minigetStream?.destroy();
    // required to ensure buffered data is drained, prevents memory leak
    this._minigetStream?.read();
    this._minigetStream = undefined;
  }
}

// TODO update this to request the data in "chunks"
export class ChunkedFormatPlayer extends FormatPlayer {
  private _minigetStream?: miniget.Stream;

  constructor(song: Song, stream: Writable) {
    super(Format.CHUNKED, song, stream);
    const options: MinigetOptions = { ...BASE_MINIGET_OPTIONS };
    if (song.source === Source.YT) {
      options.headers = {
        ...options.headers,
        ...config.yt.headers,
      };
    }

    this._minigetStream = miniget(song.playbackURL?.href as string, options);
    this._minigetStream.pipe(this._outputStream);
  }

  destroy(): void {
    if (this.destroyed) return;
    super.destroy();

    this._minigetStream?.unpipe(this._outputStream);
    this._minigetStream?.destroy();
    // required to ensure buffered data is drained, prevents memory leak
    this._minigetStream?.read();
    this._minigetStream = undefined;
  }
}

export const createSongFormatPlayer = (
  song: Song,
  stream: Writable
): FormatPlayer => {
  if (song.format === undefined)
    throw new BotError(
      "FormatPlayer song format was undefined",
      "Failed to play song, Unknown format"
    );

  switch (song.format) {
    case Format.CHUNKED:
        return new ChunkedFormatPlayer(song, stream);
    case Format.ARBITRARY:
    default:
      return new ArbitraryFormatPlayer(song, stream);
  }
};
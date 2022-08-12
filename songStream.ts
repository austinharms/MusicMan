import { default as miniget } from "miniget";
import { FFmpeg } from "prism-media";
import { default as m3u8stream  } from "m3u8stream";
import { Readable as ReadableStream, Stream } from "stream";
import { Song } from "./song";
import { config } from "./configuration";

export const getSongStream = async (song: Song): Promise<Stream> => {
    return new ReadableStream();
};
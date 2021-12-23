// Code based/taken from ytdl-core,
// file https://github.com/fent/node-ytdl-core/blob/40d0c54da10a12397ac63b0dd39ed27de4ff294b/lib/index.js#L145
// package: https://www.npmjs.com/package/ytdl-core

const BotError = require("./BotError");
const URLUtilities = require("./URLUtilities");
const miniget = require("miniget");
const FFmpeg = require("prism-media").FFmpeg;
const m3u8stream = require("m3u8stream");

const dlChunkSize = 1024 * 1024 * 10;
const baseRequestOptions = {
  maxReconnects: 6,
  maxRetries: 3,
  backoff: { inc: 500, max: 10000 },
  highWaterMark: 1024 * 512,
  headers: {},
};

const baseArgs = [
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

const pipeAndSetEvents = (req, stream, end) => {
  [
    "abort",
    "request",
    "response",
    "error",
    "redirect",
    "retry",
    "reconnect",
  ].forEach((event) => {
    req.prependListener(event, stream.emit.bind(stream, event));
  });
  req.pipe(stream, { end });
};

const createStreams = async function (song, base = 0) {
  try {
    const reqOptions = Object.assign({}, baseRequestOptions);
    if (song.isYT) reqOptions.headers = URLUtilities.GetRequestHeaders();
    await URLUtilities.UpdatePlaybackURL(song);

    let req;
    let shouldEnd = true;
    let contentLength,
      downloaded = 0;

    base = Math.min(Math.max(base, -50), 50);
    const ffmpegArgs = [...baseArgs, "-af", `bass=g=${base}`, "-ss", `${song.offset}`];

    const streams = { 
      transcoder: new FFmpeg({ args: ffmpegArgs }),
    };

    if (song.type === "STREAM") {
      const isLive = song.format.startsWith("LIVE-");
      const format = isLive
        ? song.format.substring("LIVE-".length)
        : song.format;
      req = m3u8stream(song.playableURL, {
        chunkReadahead: +song.live_chunk_readahead,
        begin: song.offset || (format.isLive && Date.now()),
        liveBuffer: 20000,
        requestOptions: reqOptions,
        parser: format,
        id: song.itag,
      });

      req.on("progress", (segment, totalSegments) => {
        streams.transcoder.emit("progress", segment.size, segment.num, totalSegments);
      });
      pipeAndSetEvents(req, streams.transcoder, shouldEnd);
    } else { // if (song.type === "CHUNKED") { // Just assume it's chunked
      const ondata = (chunk) => {
        downloaded += chunk.length;
        streams.transcoder.emit("progress", chunk.length, downloaded, contentLength);
      };

      let start = 0;
      let end = start + dlChunkSize;
      contentLength = song.contentLength - start;

      const getNextChunk = () => {
        if (end >= contentLength) end = 0;
        shouldEnd = !end;

        reqOptions.headers = Object.assign({}, reqOptions.headers, {
          Range: `bytes=${start}-${end || ""}`,
        });

        req = miniget(song.playableURL, reqOptions);
        req.on("data", ondata);
        req.on("end", () => {
          if (streams.transcoder.destroyed) return;
          if (end) {
            start = end + 1;
            end += dlChunkSize;
            getNextChunk();
          }
        });
        pipeAndSetEvents(req, streams.transcoder, shouldEnd);
      };
      getNextChunk();
    }

    streams.request = req;
    streams.destroy = (function() {
      this.transcoder.destroy();
      this.transcoder.end();
      this.request.destroy();
      this.request.end();
    }).bind(streams);

    return streams;
  } catch (e) {
    if (e instanceof BotError.ErrorObject) throw e;
    throw BotError(e, "Failed to Create Stream", "AudioUtil:createStream");
  }
};

module.exports.CreateStreams = createStreams;

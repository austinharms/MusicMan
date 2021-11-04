// Code based/taken from ytdl-core,
// file https://github.com/fent/node-ytdl-core/blob/40d0c54da10a12397ac63b0dd39ed27de4ff294b/lib/index.js#L145
// package: https://www.npmjs.com/package/ytdl-core

const URLUtilities = require("./URLUtilities");
const miniget = require("miniget");
const FFmpeg = require("prism-media").FFmpeg;
const m3u8stream = require('m3u8stream');

const dlChunkSize = 1024 * 1024 * 10;
const requestOptions = {
  maxReconnects: 6,
  maxRetries: 3,
  backoff: { inc: 500, max: 10000 },
  highWaterMark: 1024 * 512,
  headers: {},
};

const baseArgs = [
  '-analyzeduration',
  '0',
  '-loglevel',
  '0',
  '-f',
  'mp3',
  '-ar',
  '48000',
  '-ac',
  '2',
];

const pipeAndSetEvents = (req, stream, end) => {
  [
    'abort', 'request', 'response', 'error', 'redirect', 'retry', 'reconnect',
  ].forEach(event => {
    req.prependListener(event, stream.emit.bind(stream, event));
  });
  req.pipe(stream, { end });
};

const createStreams = async function(song) {
  await URLUtilities.UpdatePlaybackURL(song);

  let req;
  let shouldEnd = true;
  let contentLength, downloaded = 0;

  const transcoder = new FFmpeg({
    args: baseArgs,
  });

  if (song.type === "STREAM") {
    const isLive = song.format.startsWith("LIVE-");
    const format = isLive?song.format.substring("LIVE-".length):song.format;
    req = m3u8stream(song.playableURL, {
      chunkReadahead: +info.live_chunk_readahead,
      begin: song.offset || (format.isLive && Date.now()),
      liveBuffer: 20000,
      requestOptions: options.requestOptions,
      parser: format,
      id: song.itag,
    });

    req.on('progress', (segment, totalSegments) => {
      transcoder.emit('progress', segment.size, segment.num, totalSegments);
    });
    pipeAndSetEvents(req, transcoder, shouldEnd);
  } else { // if (song.type === "CHUNKED") { // Just assume it's chunked
    const ondata = chunk => {
      downloaded += chunk.length;
      transcoder.emit('progress', chunk.length, downloaded, contentLength);
    };
  }
};
const ytdl = require("discord-ytdl-core");
const miniget = require("miniget");
const FFmpeg = require("prism-media").FFmpeg;
const m3u8stream = require('m3u8stream');

//This SHOULD be able to play a url
const playURL = async (url) => {
  let req;
  let shouldEnd = true;
  let contentLength, downloaded = 0;
  let output;

  const dlChunkSize = 1024 * 1024 * 10;
  const requestOptions = {
    maxReconnects: 6,
    maxRetries: 3,
    backoff: { inc: 500, max: 10000 },
    highWaterMark: 1024 * 512,
    headers: {
      cookie: process.env.YT_COOKIE,
      "x-youtube-identity-token": process.env.YT_ID,
    },
  };

  const FFmpegArgs = [
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

  const transcoder = new FFmpeg({
    args: FFmpegArgs,
  });

  const ondata = (chunk) => {
    downloaded += chunk.length;
    output.emit("progress", chunk.length, downloaded, contentLength);
  };

  const info = await ytdl.getInfo(url);
  const format = ytdl.chooseFormat(info.formats, { quality: "highestaudio", filter: 'audioonly' });
  console.log(format);
  const shouldBeChunked = !format.hasAudio || !format.hasVideo;

 if (shouldBeChunked) {
    let start = 0;
    let end = dlChunkSize;
    const rangeEnd = undefined;

    contentLength = parseInt(format.contentLength);

    const getNextChunk = () => {
      if (end >= contentLength) end = 0;
      shouldEnd = !end;

      requestOptions.headers.Range = `bytes=${start}-${end || ""}`;
      req = miniget(format.url, requestOptions);
      req.on("data", ondata);
      req.on("end", () => {
        if (output.destroyed) {
          return;
        }
        if (end && end !== rangeEnd) {
          start = end + 1;
          end += dlChunkSize;
          getNextChunk();
        }
      });

      output = req.pipe(transcoder, { end: shouldEnd });
      [
        "abort",
        "request",
        "response",
        "error",
        "redirect",
        "retry",
        "reconnect",
      ].forEach((event) => req.prependListener(event, output.emit.bind(transcoder, event)));
    };
    getNextChunk();
  } else {
    req = miniget(format.url, requestOptions);
    req.on("response", (res) => {
      if (output.destroyed) {
        return;
      }
      contentLength = contentLength || parseInt(res.headers["content-length"]);
    });
    req.on("data", ondata);

    output = req.pipe(transcoder, { end: shouldEnd });
    [
      "abort",
      "request",
      "response",
      "error",
      "redirect",
      "retry",
      "reconnect",
    ].forEach((event) => req.prependListener(event, output.emit.bind(transcoder, event)));
  }

  return output;
};

module.exports = playURL;
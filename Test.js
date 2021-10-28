const ytdl = require("discord-ytdl-core");
const PassThrough = require("stream").PassThrough;
const miniget = require("miniget");

//This SHOULD be able to play a url (untested)
const playURL = async (url) => {
  //Create The Stream, Should be done after a format is found, TODO fix that
  const stream = new PassThrough({
    highWaterMark: 1024 * 512,
  });
  stream._destroy = () => {
    stream.destroyed = true;
  };

  const info = await ytdl.getInfo(url);
  const format = ytdl.chooseFormat(info.formats, { quality: "highestaudio" });
  // const options = {
  //   encoderArgs: this.getArgList(),
  //   seek: this.currentSong.offset,
  //   //fmt: "mp3", Not Needed, I think
  //   //quality: "highestaudio",
  //   //filter: "audioonly", Is it nedded? What used it?
  //   // requestOptions: {
  //   //   headers: {
  //   //     cookie: process.env.YT_COOKIE,
  //   //     "x-youtube-identity-token": process.env.YT_ID,
  //   //   },
  //   // },
  // };

  let req;
  let shouldEnd = true;
  let contentLength,
    downloaded = 0;

  const dlChunkSize = 1024 * 1024 * 10;
  const shouldBeChunked = !format.hasAudio || !format.hasVideo;

  const ondata = (chunk) => {
    downloaded += chunk.length;
    stream.emit("progress", chunk.length, downloaded, contentLength);
  };

  const requestOptions = {
    maxReconnects: 6,
    maxRetries: 3,
    backoff: { inc: 500, max: 10000 },
    headers: {
      cookie: process.env.YT_COOKIE,
      "x-youtube-identity-token": process.env.YT_ID,
    },
  };

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
        if (stream.destroyed) {
          return;
        }
        if (end && end !== rangeEnd) {
          start = end + 1;
          end += dlChunkSize;
          getNextChunk();
        }
      });

      //Forward events from the request to the stream.
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
      req.pipe(stream, { shouldEnd });
    };
    getNextChunk();
  } else {
    req = miniget(format.url, requestOptions);
    req.on("response", (res) => {
      if (stream.destroyed) {
        return;
      }
      contentLength = contentLength || parseInt(res.headers["content-length"]);
    });
    req.on("data", ondata);
    //Forward events from the request to the stream.
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
    req.pipe(stream, { shouldEnd });
  }

  stream._destroy = () => {
    stream.destroyed = true;
    req.destroy();
    req.end();
  };

  return stream;
};

module.exports = playURL;
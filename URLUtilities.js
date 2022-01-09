const BotError = require("./BotError");
const ytdl = require("ytdl-core");
const ytpl = require("ytpl");
const ytsr = require('ytsr');
const isURL = new RegExp(/^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/gm);
const requestOptions = {
  headers: {
    cookie: process.env.YT_COOKIE,
    "x-youtube-identity-token": process.env.YT_ID,
  }
};

const resolveSong = async (input) => {
  try {
    if (input.length <= 2)
      throw BotError(new Error("Invalid Input"), "Invalid URL/Search Input, Must be Longer Than 2 Characters", "URLUtil:resolveSong", -1, -1, -1, true);

    if (validateURL(input)) {
      if (ytpl.validateID(input)) {
        return (await ytpl(input, {
          requestOptions,
          limit: Infinity,
        })).items
        .filter(video => (!video.isLive) && video.isPlayable)
        .map(video => ({
            isYT: true,
            url: video.url,
            title: video.title,
            thumbnail: video.bestThumbnail.url,
            length: video.durationSec,
            offset: 0,
            playableURL: null,
            urlExperation: null,
            type: null,
          }));
      } else if (ytdl.validateURL(input)) {
        const videoInfo = await ytdl.getInfo(input, {
          requestOptions,
        });

        if (videoInfo.videoDetails.isPrivate)
          throw BotError(new Error("Cannot Play Private YT Video"), "Cannot play Video, Video is Private", "URLUtil:resolveSong");

        let video = null;
        try{
          video = ytdl.chooseFormat(videoInfo.formats, { quality: "highestaudio", filter: 'audioonly' });
        } catch(e) {
          throw BotError(e, "Cannot play Video, Invalid Format", "URLUtil:resolveSong:chooseFormat");
        }

        const urlExperation = (parseInt(video.url.split("expire")[1].split("&")[0].substring(1)) - 10) * 1000;
        const song = {
          isYT: true,
          url: input,
          title: videoInfo.videoDetails.title,
          thumbnail: videoInfo.videoDetails.thumbnail.url,
          length: parseInt(videoInfo.videoDetails.lengthSeconds),
          offset: 0,
          playableURL: video.url,
          urlExperation,
          type: ((video.isHLS || video.isDashMPD)?"STREAM":"CHUNKED"),
        };

        if (song.type === "STREAM") {
          song.live_chunk_readahead = videoInfo.live_chunk_readahead;
          song.itag = video.itag;
          if (video.isLive) {
            song.format = video.isDashMPD ? "LIVE-dash-mpd" : "LIVE-m3u8";
          } else {
            song.format = video.isDashMPD ? "dash-mpd" : "m3u8";
          }
        } else {
          song.contentLength = parseInt(video.contentLength);
        }

        return [song];
      } else {
        return [{
          isYT: false,
          url: input,
          title: input,
          thumbnail: input,
          length: -1,
          offset: 0,
          playableURL: input,
          urlExperation: -1,
          type: "CHUNKED",
        }];
      }
    } else {
      const res = await ytsr(input, {
        safeSearch: false,
        limit: 5,
        pages: 1,
      });
      const video = res.items.find(i => i.type === "video" && !i.isUpcoming && !i.isLive && i.url);
      if (!video)
        throw BotError(new Error("No Valid Videos in Search Results"), "Failed to Find a Video", "URLUtil:resolveSong:search");

      let length = video.duration.split(":").reverse().reduce((total, cur, index) => total + (Math.pow(60, index) * parseInt(cur)),0);
      return [{
        isYT: true,
        url: video.url,
        title: video.title,
        thumbnail: video.bestThumbnail.url,
        length,
        offset: 0,
        playableURL: null,
        urlExperation: null,
        type: null,
      }];
    }
  } catch(e) {
    if (e instanceof BotError.ErrorObject) throw e;
    throw BotError(e, "Failed to get Song", "URLUtil:resolveSong");
  }
};

const updatePlaybackURL = async (song) => {
  try {
    if (!song.isYT) return;
    if (song.playableURL === null || song.urlExperation <= Date.now()) {
      const videoInfo = await ytdl.getInfo(song.url, {
        requestOptions,
      });

      if (videoInfo.videoDetails.isPrivate)
        throw BotError(new Error("Cannot Play Private YT Video"), "Cannot play Video, Video is Private", "URLUtil:resolveSong");

      let video = null;
      try{
        video = ytdl.chooseFormat(videoInfo.formats, { quality: "highestaudio", filter: 'audioonly' });
      } catch(e) {
        throw BotError(e, "Cannot play Video, Invalid Format", "URLUtil:resolveSong:chooseFormat");
      }

      const urlExperation = parseInt(video.url.split("expire")[1].split("&")[0].substring(1)) * 1000;
      song.urlExperation = urlExperation;
      song.playableURL = video.url;
      song.type = ((video.isHLS || video.isDashMPD)?"STREAM":"CHUNKED");

      if (song.type === "STREAM") {
        song.live_chunk_readahead = videoInfo.live_chunk_readahead;
        song.itag = video.itag;
        if (video.isLive) {
          song.format = video.isDashMPD ? "LIVE-dash-mpd" : "LIVE-m3u8";
        } else {
          song.format = video.isDashMPD ? "dash-mpd" : "m3u8";
        }
      } else {
        song.contentLength = parseInt(video.contentLength);
      }
    }
  } catch(e) {
    if (e instanceof BotError.ErrorObject) throw e;
    throw BotError(e, "Failed to Update Song", "URLUtil:resolveSong");
  }
};

const getRequestHeaders = () => {
  return Object.assign({}, requestOptions.headers);
};

const validateURL = (string) => {
  let url;
  
  try {
    url = new URL(string);
  } catch {
    return false;  
  }

  return url.protocol === "http:" || url.protocol === "https:";
};

module.exports.ResolveSong = resolveSong;
module.exports.UpdatePlaybackURL = updatePlaybackURL;
module.exports.GetRequestHeaders = getRequestHeaders;
module.exports.ValidateURL = validateURL;
const BotError = require("./BotError");
const ytdl = require("ytdl-core");
const ytpl = require("ytpl");
const ytsr = require('ytsr');
const isURL = new RegExp(/^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/gm);
const HEADERS = {
  cookie: process.env.YT_COOKIE,
  "x-youtube-identity-token": process.env.YT_ID,
};

const resolveSong = async (input) => {
  try {
    if (input.length <= 2) throw BotError(new Error("Invalid Input"), "Invalid URL/Search Input, Must be Longer Than 2 Characters", "URLUtil:resolveSong", -1, -1, -1, true);
    console.log("Input: ", input);
    console.log("IsURL:", isURL.test(input));
    if (isURL.test(input)) {
      console.log("URL");
      if (ytpl.validateID(input)) {
        const videos = await ytpl(input, {
          requestOptions: {
            headers: HEADERS,
          },
          limit: Infinity,
        });
        console.log("Playlist: ", videos);
      } else if (ytdl.validateURL(input)) {
        const video = await ytdl.getBasicInfo(input, {
          requestOptions: {
            headers: HEADERS,
          },
        });
        console.log("URL: ",video);
      } else {
        const song = {
          isYT: false,
          url: input,
          title: input,
          thumbnail: input,
          length: -1,
          offset: 0,
          playableURL: input,
          urlExperation: null,
        };

        console.log("Raw: ", song);
        return [song];
      }
    } else {
      const res = await ytsr(input, {
        safeSearch: false,
        limit: 5,
        pages: 1,
      });
      const video = res.items.find(i => i.type === "video" && !i.isUpcoming && !i.isLive && i.views > 0 && i.url);
      if (!video)
        throw BotError(new Error("No Valid Videos in Search Results"), "Failed to Find a Video", "URLUtil:resolveSong:search");

      let length = video.duration.split(":").reverse().reduce((total, cur, index) => total + (Math.pow(60, index) * parseInt(cur)),0);
      const song = {
        isYT: true,
        url: video.url,
        title: video.title,
        thumbnail: video.bestThumbnail.url,
        length,
        offset: 0,
        playableURL: null,
        urlExperation: null
      };

      console.log("Search: ", video);
      return [song];
    }
  } catch(e) {
    if (e instanceof BotError.ErrorObject) throw e;
    throw BotError(e, "Failed to get Song", "URLUtil:resolveSong");
  }
};

const getPlaybackURL = async (song) => {

};

const getRequestHeaders = (song) => {
  return Object.assign({}, HEADERS);
};

module.exports.ResolveSong = resolveSong;
module.exports.GetPlaybackURL = getPlaybackURL;
module.exports.GetRequestHeaders = getRequestHeaders;
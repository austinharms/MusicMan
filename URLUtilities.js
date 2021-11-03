const BotError = require("./BotError");
const ytdl = require("ytdl");
const ytpl = require("ytpl");
const ytsr = require('ytsr');
const isURL = new RegExp(/^(https?|chrome):\/\/[^\s$.?#].[^\s]*$/gm);

const resolveSong = async (input) => {
  try {
    if (input.length <= 2) throw BotError(new Error("Invalid Input"), "Invalid URL/Search Input, Must be Longer Than 2 Characters", "URLUtil:resolveSong", -1, -1, -1, true);
    if (isURL.test(input)) {

    } else {
      const res = await ytsr(input, {
        safeSearch: false,
        limit: 5,
        pages: 1,
      });
      const video = res.items.find(i => i.type === "video" && !i.isUpcoming && !i.isLive && i.views > 0 && i.url);
      if (!video)
        throw BotError(new Error("No Valid Videos in Search Results"), "Failed to Find a Video", "URLUtil:resolveSong:search");
    }
  } catch(e) {
    if (e instanceof BotError.ErrorObject) throw e;
    throw BotError(e, "Failed to get Song", "URLUtil:resolveSong");
  }
};

const getPlaybackURL = async (song) => {

};

const getRequestHeaders = async (song) => {

};

module.exports.ResolveSong = resolveSong;
module.exports.GetPlaybackURL = getPlaybackURL;
module.exports.GetRequestHeaders = getRequestHeaders;
import { Song, Format, Source } from "./song";
import {
  validateID as validatePlaylistURL,
  default as getPlaylist,
  Result as PlaylistResult,
  Item as PlaylistSong,
} from "ytpl";
import {
  validateURL as validateVideoURL,
  getInfo as getVideo,
  videoInfo as VideoInfo,
  chooseFormat as getVideoFormat,
  videoFormat as VideoFormat,
} from "ytdl-core";
import {
  default as searchVideo,
  Result as SearchResult,
  Item as SearchSong,
  Video as SearchVideo,
} from "ytsr";
import { BotError } from "./BotError";

export class ResolveError extends BotError {
  constructor(message: string | Error, userMessage?: string) {
    super(message);
    this.name = "ResolveError";
    this.userMessage = userMessage || "Failed to get Songs";
  }
}

export const getSongs = async (input: string): Promise<Song[]> => {
  try {
    if (input.length <= 2)
      throw new ResolveError(
        "getSongs input length must be greater than 2",
        "Invalid Input, Input must be longer than 2 characters"
      );

    if (isURL(input)) {
      const url: URL = new URL(input);
      if (validatePlaylistURL(url.href)) {
        return getYTPlaylist(url);
      } else if (validateVideoURL(url.href)) {
        return [await getYTVideo(url)];
      } else {
        return [await getArbitrarySong(url)];
      }
    } else {
      return [await searchYTVideo(input)];
    }

    throw new ResolveError("getSongs fall through", "Failed to find video");
  } catch (e: any) {
    if (e instanceof ResolveError) throw e;
    throw new ResolveError(e);
  }
};

export const getYTPlaylist = async (url: URL): Promise<Song[]> => {
  try {
    if (!validatePlaylistURL(url.href)) throw new ResolveError("getYTPlaylist Invalid YT Playlist URL", "Invalid playlist URL");
    const playlist: PlaylistResult = await getPlaylist(url.href);
    const songs: PlaylistSong[] = playlist.items;
    return songs.map((song: PlaylistSong): Song => ({
      url: new URL(song.url),
      playbackURL: null,
      length: song.durationSec || undefined,
      live: song.isLive,
      thumbnail: song.bestThumbnail?.url && new URL(song.bestThumbnail.url) || undefined,
      source: Source.YT,
      title: song.title,
    }));
  } catch (e: any) {
    if (e instanceof ResolveError) throw e;
    throw new ResolveError(e, "Failed to load playlist");
  }
};

export const getYTVideo = async (url: URL): Promise<Song> => {
  try {
    if (!validateVideoURL(url.href)) throw new ResolveError("getYTVideo Invalid YT Video URL", "Invalid video URL");
    const video: VideoInfo = await getVideo(url.href);
    if (video.videoDetails.isPrivate)
      throw new ResolveError(
        "Cannot Get Private Video",
        "This video is private"
      );

    let format: VideoFormat | null = null;
    try {
      format = getVideoFormat(video.formats, {
        quality: "highestaudio",
        filter: "audioonly",
      });
    } catch (e: any) {
      throw new ResolveError(e, "Failed to load video, Invalid Format");
    }

    const song: Song = {
      title: video.videoDetails.title,
      url: new URL(video.videoDetails.video_url),
      playbackURL: new URL(format.url),
      source: Source.YT,
      thumbnail: video.videoDetails.thumbnails[0]?.url && new URL(video.videoDetails.thumbnails[0].url) || undefined,
      length: parseInt(video.videoDetails.lengthSeconds),
      size: parseInt(format.contentLength),
      live: format.isLive,
    };

    if (format.isHLS) song.format = Format.M3U8;
    if (format.isDashMPD) song.format = Format.DASH_MPD;
    const formatURL: URL = new URL(format.url);
    if (formatURL.searchParams.has("expire")) {
      const time: number = parseInt(formatURL.searchParams.get("expire") as string);
      if (!isNaN(time)) song.expirationDate = new Date(time * 1000);
    }

    return song;
  } catch (e: any) {
    if (e instanceof ResolveError) throw e;
    throw new ResolveError(e, "Failed to load video");
  }
};

export const searchYTVideo = async (query: string): Promise<Song> => {
  if (query.length <= 2)
    throw new ResolveError(
      "searchYTVideo input length must be greater than 2",
      "Search must be longer than 2 characters"
    );

  const results: SearchResult = await searchVideo(query, {
    limit: 10,
    pages: 1,
    safeSearch: false,
  });

  const video: SearchVideo | undefined = results.items.find(
    (video: SearchSong) =>
      video.type === "video" && !video.isUpcoming && video.url
  ) as SearchVideo;

  if (!video)
    throw new ResolveError(
      "searchYTVideo empty search results",
      "No search results"
    );

  return ({
    url: new URL(video.url),
    playbackURL: null,
    length: (video.duration && video.duration.split(":").reverse().reduce((total, cur, index) => total + (Math.pow(60, index) * parseInt(cur)), 0)) || undefined,
    live: video.isLive,
    thumbnail: video.bestThumbnail?.url && new URL(video.bestThumbnail.url) || undefined,
    source: Source.YT,
    title: video.title,
  });
};

export const getArbitrarySong = async (url: URL): Promise<Song> => {
  return ({
    url: url,
    playbackURL: url,
    thumbnail: url,
    source: Source.ARBITRARY,
    format: Format.ARBITRARY,
    title: url.href,
  });
};

export const isURL = (testURL: string): boolean => {
  try {
    const url: URL = new URL(testURL);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const UpdateSong = async (song: Song): Promise<Song> => {
  switch (song.source) {
    case Source.YT:
      if (!song.playbackURL || song.expirationDate && song.expirationDate <= new Date(new Date().getTime() - 600000)) {
        console.log("Update Video: " + song.url);
        return await getYTVideo(song.url);
      }

    case Source.ARBITRARY:
    default:
      return song;
  }
};
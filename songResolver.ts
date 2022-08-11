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

export class ResolveError extends Error {
  userMessage: string;

  constructor(message: string | Error, userMessage?: string) {
    if (message instanceof Error) {
      super(message.message);
      this.stack = message.stack;
    } else {
      super(message);
    }

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
      if (validatePlaylistURL(input)) {
        try {
          const playlist: PlaylistResult = await getPlaylist(input);
          const songs: PlaylistSong[] = playlist.items;
          return songs.map(playlistSongToSong);
        } catch (e: any) {
          if (e instanceof ResolveError) throw e;
          throw new ResolveError(e, "Failed to load playlist");
        }
      } else if (validateVideoURL(input)) {
        try {
          const video: VideoInfo = await getVideo(input);
          if (video.videoDetails.isPrivate)
            throw new ResolveError(
              "Cannot Get Private Video",
              "This video is private"
            );

          return [videoInfoToSong(video)];
        } catch (e: any) {
          if (e instanceof ResolveError) throw e;
          throw new ResolveError(e, "Failed to load video");
        }
      } else {
        // TODO: add ARBITRARY song source support
      }
    } else {
      const results: SearchResult = await searchVideo(input, {
        limit: 10,
        pages: 1,
        safeSearch: false,
      });

      const video: SearchSong | undefined = results.items.find(
        (video: SearchSong) =>
          video.type === "video" && !video.isUpcoming && video.url
      );
      if (!video)
        throw new ResolveError(
          "getSongs empty search results",
          "No search results"
        );

      return [searchVideoToSong(video as SearchVideo)];
    }

    throw new ResolveError("getSongs fall through", "Failed to find video");
  } catch (e: any) {
    if (e instanceof ResolveError) throw e;
    throw new ResolveError(e);
  }
};

export const isURL = (testURL: string): boolean => {
  try {
    const url: URL = new URL(testURL);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const getFormat = (videoInfo: VideoInfo): VideoFormat => {
  try {
    return getVideoFormat(videoInfo.formats, {
      quality: "highestaudio",
      filter: "audioonly",
    });
  } catch (e: any) {
    throw new ResolveError(e, "Failed to load video, Invalid Format");
  }
};

const videoInfoToSong = (videoInfo: VideoInfo): Song => {
  const format: VideoFormat = getFormat(videoInfo);
  const song: Song = {
    title: videoInfo.videoDetails.title,
    url: videoInfo.videoDetails.video_url,
    playbackURL: format.url,
    source: Source.YT,
    thumbnail: videoInfo.videoDetails.thumbnails[0]?.url,
    length: parseInt(videoInfo.videoDetails.lengthSeconds),
    size: parseInt(format.contentLength),
    live: format.isLive,
  };

  if (format.isHLS) song.format = Format.M3U8;
  if (format.isDashMPD) song.format = Format.DASH_MPD;
  const url: URL = new URL(format.url);
  if (url.searchParams.has("expire")) {
    const time: number = parseInt(url.searchParams.get("expire") as string);
    if (!isNaN(time)) song.expirationDate = new Date(time * 1000);
  }

  return song;
};

const playlistSongToSong = (song: PlaylistSong): Song => ({
  url: song.url,
  playbackURL: null,
  length: song.durationSec || undefined,
  live: song.isLive,
  thumbnail: song.bestThumbnail?.url || undefined,
  source: Source.YT,
  title: song.title,
});

const searchVideoToSong = (song: SearchVideo): Song => ({
  url: song.url,
  playbackURL: null,
  length: (song.duration && song.duration.split(":").reverse().reduce((total, cur, index) => total + (Math.pow(60, index) * parseInt(cur)),0)) || undefined,
  live: song.isLive,
  thumbnail: song.bestThumbnail?.url || undefined,
  source: Source.YT,
  title: song.title,
});

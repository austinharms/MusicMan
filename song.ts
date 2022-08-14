export const enum Source {
    YT,
    ARBITRARY,
};

export const enum Format {
    ARBITRARY,
    CHUNKED,
    DASH_MPD,
    M3U8,
};

export interface Song {
    // the requested url
    url: URL;
    // the decoded(playable) url
    playbackURL: URL | null;
    // used for display embed
    thumbnail?: URL;
    // title used for display
    title: string;
    // where the song came from
    source: Source;
    // the date the decoded url expires
    expirationDate?: Date;
    // length of song in seconds
    length?: number;
    // byte size (content-length) of song
    size?: number;
    // is the content live(stream, radio)
    live?: boolean;
    // needed for live content
    itag?: number;
    // how should the song be played/downloaded
    format?: Format;
};
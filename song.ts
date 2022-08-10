export enum SongSource {
    YT,
    UNKNOWN
};

export interface Song {
    url: string;
    playbackURL: string;
    source: SongSource;

};
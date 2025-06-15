import { Model } from "./base.model";

export interface Song extends Model {
    name: string;
    album?: string;
    duration: number;
    image?: {
        url: string | undefined;
        large: string | undefined;
        medium: string | undefined;
        small: string | undefined;
        thumbnail: string | undefined;
    };
    playlistid_IDS: string[];
    lyrics?: string;
    artists_IDS: string[];
    audioUrl?: string;
    
    users_like: string[];
    likes_count: number;
}
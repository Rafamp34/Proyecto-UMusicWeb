import { Model } from "./base.model";

export interface Artist extends Model {
    name: string;
    listeners: number;
    songs_IDS: string[];
    image?: {
        url: string | undefined;
        large: string | undefined;
        medium: string | undefined;
        small: string | undefined;
        thumbnail: string | undefined;
    };
    artists_follow: string[];
    followers_count: number;
    verified?: boolean;
}
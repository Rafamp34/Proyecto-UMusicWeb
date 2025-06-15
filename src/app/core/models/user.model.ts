// src/app/core/models/user.model.ts
import { Model } from "./base.model";

export interface User extends Model {
    username: string;
    email: string;
    provider?: string;
    password?: string;
    resetPasswordToken?: string;
    confirmationToken?: string;
    confirmed?: boolean;
    blocked?: boolean;
    role?: string;
    playlists_IDS: string[];
    image?: {
        url: string | undefined;
        large: string | undefined;
        medium: string | undefined;
        small: string | undefined;
        thumbnail: string | undefined;
    };
    
    followers: number;
    following: number;
    following_ids: string[];
    followers_FK: string[];
    liked_songs: string[];
    following_artists: string[];
}

export interface SignInPayload {
    email: string;
    password: string;
}

export interface SignUpPayload {
    email: string;
    password: string;
    name: string;
    surname: string;
    birthDate: string;
    gender: string;
    group: string;
    user: string;
}

export interface UserDisplayData {
    id: string;
    username: string;
    displayName: string;    
    email: string;
    image?: {
        url: string | undefined;
        thumbnail: string | undefined;
    };
    followers_count: number;
    following_count: number;
    playlists_count: number;
}
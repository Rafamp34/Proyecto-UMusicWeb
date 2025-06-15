import { Injectable } from "@angular/core";
import { IAuthMapping } from "../interfaces/auth-mapping.interface";
import { SignInPayload, SignUpPayload} from "../../models/auth.model";
import { User } from "../../models/user.model"; 

export interface StrapiMeResponse {
    id: number;
    username: string;
    email: string;
    provider: string;
    confirmed: boolean;
    blocked: boolean;
    createdAt: string;
    updatedAt: string;
    avatar?: {
        url: string;
        large: string;
        medium: string;
        small: string;
        thumbnail: string;
    };
}

export interface StrapiSignInResponse {
    jwt: string;
    user: StrapiUser;
}

export interface StrapiSignUpResponse {
    jwt: string;
    user: StrapiUser;
}

export interface StrapiUser {
    id: number;
    username: string;
    email: string;
    provider: string;
    confirmed: boolean;
    blocked: boolean;
    createdAt: string;
    updatedAt: string;
    avatar?: {
        url: string;
        large: string;
        medium: string;
        small: string;
        thumbnail: string;
    };
}

interface StrapiSignIn {
    identifier: string;
    password: string;
}

interface StrapiSignUp {
    email: string;
    password: string;
    username: string;
}

@Injectable({
    providedIn: 'root'
})
export class StrapiAuthMappingService implements IAuthMapping {
    signInPayload(payload: SignInPayload): StrapiSignIn {
        return {
            identifier: payload.email,
            password: payload.password
        };
    }

    signUpPayload(payload: SignUpPayload): StrapiSignUp {
        return {
            email: payload.email,
            password: payload.password,
            username: payload.name + " " + payload.surname
        };
    }

    signIn(response: StrapiSignInResponse): User {
        return {
            id: response.user.id.toString(),
            username: response.user.username || '',
            email: response.user.email,
            // ✅ CAMPOS SOCIALES INICIALIZADOS
            followers: 0,
            following: 0,
            following_ids: [],
            followers_FK: [],
            liked_songs: [],
            following_artists: [],
            playlists_IDS: [],
            provider: response.user.provider,
            confirmed: response.user.confirmed,
            blocked: response.user.blocked,
            image: response.user.avatar ? {
                url: response.user.avatar.url,
                large: response.user.avatar.large,
                medium: response.user.avatar.medium,
                small: response.user.avatar.small,
                thumbnail: response.user.avatar.thumbnail
            } : undefined,
        };
    }

    signUp(response: StrapiSignUpResponse): User {
        return {
            id: response.user.id.toString(),
            username: response.user.username || '',
            email: response.user.email,
            followers: 0,
            following: 0,
            following_ids: [],
            followers_FK: [],
            liked_songs: [],
            following_artists: [],
            playlists_IDS: [],
            provider: response.user.provider,
            confirmed: response.user.confirmed,
            blocked: response.user.blocked,
            image: response.user.avatar ? {
                url: response.user.avatar.url,
                large: response.user.avatar.large,
                medium: response.user.avatar.medium,
                small: response.user.avatar.small,
                thumbnail: response.user.avatar.thumbnail
            } : undefined,
        };
    }

    me(response: any): User {
        let userData: any;
        
        if (response?.data) {
            // Caso 1: Respuesta viene wrapped con { data: usuario }
            userData = response.data;
        } else if (response?.id && response?.email) {
            // Caso 2: Respuesta viene directamente como usuario
            userData = response;
        } else {
            console.error('StrapiAuthMapping - Unknown response structure:', response);
            throw new Error('Invalid user data structure');
        }
        
        
        if (!userData || !userData.id || !userData.email) {
            console.error('StrapiAuthMapping - Missing required user data:', userData);
            throw new Error('Missing required user data (id or email)');
        }
        
        const username = userData.username || userData.email?.split('@')[0] || 'User';
        
        const mappedUser: User = {
            id: userData.id.toString(),
            username: username,
            email: userData.email,
            followers: userData.followers || 0,
            following: userData.following || 0,
            following_ids: userData.following_ids || [],
            followers_FK: userData.followers_FK || [],
            liked_songs: userData.liked_songs || [],
            following_artists: userData.following_artists || [],
            playlists_IDS: userData.playlists_IDS || [],
            provider: userData.provider || 'local',
            confirmed: userData.confirmed ?? false,
            blocked: userData.blocked ?? false,
            image: userData.avatar ? {
                url: userData.avatar.url,
                large: userData.avatar.large,
                medium: userData.avatar.medium,
                small: userData.avatar.small,
                thumbnail: userData.avatar.thumbnail
            } : undefined,
        };
        
        return mappedUser;
    }
}
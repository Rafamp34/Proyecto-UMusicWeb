// src/app/core/models/firebase/firebase-user.model.ts
export interface FirebaseUser {
    id: string;
    uid: string;
    email: string;
    name: string;
    surname: string;
    displayName?: string;
    image?: string;
    followers: string[];
    following: string[];
    playlists_ids: string[];
    emailVerified: boolean;
}
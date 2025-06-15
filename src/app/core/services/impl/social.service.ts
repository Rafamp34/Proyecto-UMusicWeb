// src/app/core/services/impl/social.service.ts - IMPLEMENTACIÓN COMPLETA CON SEGUIMIENTO DE ARTISTAS

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of, forkJoin } from 'rxjs';
import { map, switchMap, catchError, take, tap, delay } from 'rxjs/operators';
import { UserService } from './user.service';
import { SongsService } from './songs.service';
import { PlaylistsService } from './playlists.service';
import { ArtistsService } from './artists.service';
import { BaseAuthenticationService } from './base-authentication.service';
import { User } from '../../models/user.model';
import { Song } from '../../models/song.model';
import { Playlist } from '../../models/playlist.model';
import { Artist } from '../../models/artist.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class SocialService {
    // ================================================================
    // PROPERTIES FOR LIKES
    // ================================================================
    private likedSongsSubject = new BehaviorSubject<Set<string>>(new Set());
    public likedSongs$ = this.likedSongsSubject.asObservable();
    private likedSongsCache = new Map<string, boolean>();
    
    // ================================================================
    // PROPERTIES FOR ARTIST FOLLOWING
    // ================================================================
    private followedArtistsSubject = new BehaviorSubject<Set<string>>(new Set());
    public followedArtists$ = this.followedArtistsSubject.asObservable();
    private followedArtistsCache = new Map<string, boolean>();
    
    // ================================================================
    // SHARED PROPERTIES
    // ================================================================
    private currentUserId: string | null = null;
    private isInitialized = false;
    
    constructor(
        private userService: UserService,
        private songsService: SongsService,
        private playlistsService: PlaylistsService,
        private artistsService: ArtistsService,
        private authService: BaseAuthenticationService,
        private http: HttpClient
    ) {
        this.initializeService();
    }

    // ================================================================
    // INITIALIZATION
    // ================================================================

    private getCurrentUser(): User | null {
        try {
            return (this.authService as any)._user?.value || null;
        } catch (error) {
            console.error('SocialService: Error getting current user:', error);
            return null;
        }
    }

    private initializeService() {
        // Suscribirse a cambios de usuario
        this.authService.user$.subscribe(user => {
            if (user && user.id !== this.currentUserId) {
                this.currentUserId = user.id;
                this.isInitialized = false;
                this.loadUserLikes(user.id);
                this.loadUserFollowedArtists(user.id);
            } else if (!user && this.currentUserId) {
                this.currentUserId = null;
                this.clearAllCache();
            }
        });

        // Intentar inicializar con usuario existente
        setTimeout(() => {
            if (!this.isInitialized) {
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.id) {
                    this.currentUserId = currentUser.id;
                    this.loadUserLikes(currentUser.id);
                    this.loadUserFollowedArtists(currentUser.id);
                }
            }
        }, 500);
    }

    // ================================================================
    // LIKES IMPLEMENTATION (keeping existing working code)
    // ================================================================

    private loadUserLikes(userId: string) {
        if (this.isInitialized && this.currentUserId === userId) {
            return;
        }
        
        this.loadLikesFromSongs(userId).pipe(
            switchMap(songsWithLikes => {
                const likedSongsSet = new Set<string>();
                songsWithLikes.forEach(song => {
                    if (song.users_like.includes(userId)) {
                        likedSongsSet.add(song.id);
                    }
                });
                
                this.likedSongsCache.clear();
                likedSongsSet.forEach(songId => {
                    const cacheKey = `${userId}-${songId}`;
                    this.likedSongsCache.set(cacheKey, true);
                });
                
                this.likedSongsSubject.next(likedSongsSet);
                this.isInitialized = true;
                
                return this.syncUserLikedSongs(userId, Array.from(likedSongsSet));
            })
        ).subscribe({
            next: () => {},
            error: (error) => {
                console.error('SocialService: Error loading user likes:', error);
                this.likedSongsSubject.next(new Set());
                this.isInitialized = true;
            }
        });
    }

    private loadLikesFromSongs(userId: string): Observable<Song[]> {
        return this.songsService.getAll(1, 1000, {}).pipe(
            map(response => {
                const songs = Array.isArray(response) ? response : response.data;
                return songs.filter(song => 
                    song.users_like && song.users_like.includes(userId)
                );
            }),
            catchError(error => {
                console.error('SocialService: Error loading songs for likes:', error);
                return of([]);
            })
        );
    }

    private syncUserLikedSongs(userId: string, actualLikedSongs: string[]): Observable<any> {
        return this.userService.getById(userId).pipe(
            take(1),
            switchMap(user => {
                if (!user) return of(null);
                
                const userLikedSongs = user.liked_songs || [];
                const areEqual = this.arraysEqual(userLikedSongs.sort(), actualLikedSongs.sort());
                
                if (!areEqual) {
                    return this.updateUserLikedSongsOnly(userId, actualLikedSongs);
                } else {
                    return of(null);
                }
            })
        );
    }

    private updateUserLikedSongsOnly(userId: string, likedSongs: string[]): Observable<any> {
        const token = (this.authService as any).getToken?.() || '';
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const payload = {
            data: {
                liked_songs: likedSongs
            }
        };

        return this.http.put(
            `https://umusic-rtfn.onrender.com/api/users/${userId}`,
            payload,
            { headers }
        ).pipe(
            tap(response => {}),
            catchError(error => {
                console.error('SocialService: Error updating user liked_songs:', error);
                return of(null);
            })
        );
    }

    likeSong(songId: string): Observable<boolean> {        
        return this.authService.user$.pipe(
            take(1),
            switchMap(currentUser => {
                if (!currentUser) {
                    console.error('SocialService: No authenticated user');
                    return of(false);
                }

                return this.performLikeOperation(songId, currentUser.id, true);
            }),
            catchError(error => {
                console.error('SocialService: Error in likeSong:', error);
                return of(false);
            })
        );
    }

    unlikeSong(songId: string): Observable<boolean> {        
        return this.authService.user$.pipe(
            take(1),
            switchMap(currentUser => {
                if (!currentUser) {
                    console.error('SocialService: No authenticated user');
                    return of(false);
                }

                return this.performLikeOperation(songId, currentUser.id, false);
            }),
            catchError(error => {
                console.error('SocialService: Error in unlikeSong:', error);
                return of(false);
            })
        );
    }

    private performLikeOperation(songId: string, userId: string, isLiking: boolean): Observable<boolean> {        
        return this.songsService.getById(songId).pipe(
            take(1),
            switchMap(song => {
                if (!song) {
                    console.error('SocialService: Song not found');
                    return of(false);
                }

                const currentlyLiked = song.users_like.includes(userId);
                if (isLiking === currentlyLiked) {
                    return of(true);
                }

                this.updateLikeCacheImmediately(userId, songId, isLiking);

                return this.updateSongWithDirectHTTP(songId, userId, isLiking, song).pipe(
                    switchMap(() => {                        
                        const currentLikedSongs = Array.from(this.likedSongsSubject.value);
                        return this.updateUserLikedSongsOnly(userId, currentLikedSongs).pipe(
                            map(() => {
                                return true;
                            }),
                            catchError(error => {
                                console.warn('SocialService: User sync failed, but song was updated:', error);
                                return of(true);
                            })
                        );
                    }),
                    catchError(error => {
                        console.error('SocialService: Song update failed:', error);
                        this.updateLikeCacheImmediately(userId, songId, !isLiking);
                        return of(false);
                    })
                );
            }),
            catchError(error => {
                console.error('SocialService: Error in performLikeOperation:', error);
                return of(false);
            })
        );
    }

    private updateSongWithDirectHTTP(songId: string, userId: string, isLiking: boolean, song: Song): Observable<any> {        
        const newUsersLike = isLiking 
            ? [...song.users_like, userId]
            : song.users_like.filter(id => id !== userId);
        
        const newLikesCount = isLiking 
            ? song.likes_count + 1 
            : Math.max(0, song.likes_count - 1);

        const strapiPayload = {
            data: {
                users_like: newUsersLike.map(id => parseInt(id, 10)),
                likes_count: newLikesCount
            }
        };

        const token = (this.authService as any).getToken?.() || '';
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        return this.http.put(
            `https://umusic-rtfn.onrender.com/api/songs/${songId}`,
            strapiPayload,
            { headers }
        ).pipe(
            tap(response => {})
        );
    }

    private updateLikeCacheImmediately(userId: string, songId: string, isLiked: boolean) {
        const cacheKey = `${userId}-${songId}`;
        this.likedSongsCache.set(cacheKey, isLiked);
        
        const currentLikedSongs = this.likedSongsSubject.value;
        const newLikedSongs = new Set(currentLikedSongs);
        
        if (isLiked) {
            newLikedSongs.add(songId);
        } else {
            newLikedSongs.delete(songId);
        }
        
        this.likedSongsSubject.next(newLikedSongs);
    }

    isSongLiked(songId: string): Observable<boolean> {
        return this.likedSongs$.pipe(
            map(likedSongs => {
                const isLiked = likedSongs.has(songId);
                return isLiked;
            })
        );
    }

    // ================================================================
    // ARTIST FOLLOWING IMPLEMENTATION (copying likes pattern)
    // ================================================================

    /**
     * Cargar artistas seguidos desde los datos del usuario y sincronizar con artistas
     */
    private loadUserFollowedArtists(userId: string) {
        this.loadFollowsFromArtists(userId).pipe(
            switchMap(artistsWithFollows => {
                const followedArtistsSet = new Set<string>();
                artistsWithFollows.forEach(artist => {
                    if (artist.artists_follow.includes(userId)) {
                        followedArtistsSet.add(artist.id);
                    }
                });
                
                this.followedArtistsCache.clear();
                followedArtistsSet.forEach(artistId => {
                    const cacheKey = `${userId}-${artistId}`;
                    this.followedArtistsCache.set(cacheKey, true);
                });
                
                this.followedArtistsSubject.next(followedArtistsSet);
                
                return this.syncUserFollowedArtists(userId, Array.from(followedArtistsSet));
            })
        ).subscribe({
            next: () => {
            },
            error: (error) => {
                console.error('SocialService: Error loading user followed artists:', error);
                this.followedArtistsSubject.next(new Set());
            }
        });
    }

    /**
     * Cargar artistas seguidos desde la tabla de artistas
     */
    private loadFollowsFromArtists(userId: string): Observable<Artist[]> {
        return this.artistsService.getAll(1, 1000, {}).pipe(
            map(response => {
                const artists = Array.isArray(response) ? response : response.data;
                return artists.filter(artist => 
                    artist.artists_follow && artist.artists_follow.includes(userId)
                );
            }),
            catchError(error => {
                console.error('SocialService: Error loading artists for follows:', error);
                return of([]);
            })
        );
    }

    /**
     * Sincronizar following_artists del usuario con la realidad de los artistas
     */
    private syncUserFollowedArtists(userId: string, actualFollowedArtists: string[]): Observable<any> {
        return this.userService.getById(userId).pipe(
            take(1),
            switchMap(user => {
                if (!user) return of(null);
                
                const userFollowedArtists = user.following_artists || [];
                const areEqual = this.arraysEqual(userFollowedArtists.sort(), actualFollowedArtists.sort());
                
                if (!areEqual) {
                    return this.updateUserFollowedArtistsOnly(userId, actualFollowedArtists);
                } else {
                    return of(null);
                }
            })
        );
    }

    /**
     * Actualizar solo following_artists del usuario
     */
    private updateUserFollowedArtistsOnly(userId: string, followedArtists: string[]): Observable<any> {
        const token = (this.authService as any).getToken?.() || '';
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const payload = {
            data: {
                following_artists: followedArtists
            }
        };

        return this.http.put(
            `https://umusic-rtfn.onrender.com/api/users/${userId}`,
            payload,
            { headers }
        ).pipe(
            tap(response => {
            }),
            catchError(error => {
                console.error('SocialService: Error updating user following_artists:', error);
                return of(null);
            })
        );
    }

    /**
     * Seguir a un artista
     */
    followArtist(artistId: string): Observable<boolean> {        
        return this.authService.user$.pipe(
            take(1),
            switchMap(currentUser => {
                if (!currentUser) {
                    console.error('SocialService: No authenticated user');
                    return of(false);
                }

                return this.performFollowOperation(artistId, currentUser.id, true);
            }),
            catchError(error => {
                console.error('SocialService: Error in followArtist:', error);
                return of(false);
            })
        );
    }

    /**
     * Dejar de seguir a un artista
     */
    unfollowArtist(artistId: string): Observable<boolean> {        
        return this.authService.user$.pipe(
            take(1),
            switchMap(currentUser => {
                if (!currentUser) {
                    console.error('SocialService: No authenticated user');
                    return of(false);
                }

                return this.performFollowOperation(artistId, currentUser.id, false);
            }),
            catchError(error => {
                console.error('SocialService: Error in unfollowArtist:', error);
                return of(false);
            })
        );
    }

    /**
     * Ejecutar operación de seguimiento
     */
    private performFollowOperation(artistId: string, userId: string, isFollowing: boolean): Observable<boolean> {        
        return this.artistsService.getById(artistId).pipe(
            take(1),
            switchMap(artist => {
                if (!artist) {
                    console.error('SocialService: Artist not found');
                    return of(false);
                }

                const currentlyFollowing = artist.artists_follow.includes(userId);
                if (isFollowing === currentlyFollowing) {
                    return of(true);
                }

                this.updateFollowCacheImmediately(userId, artistId, isFollowing);

                return this.updateArtistWithDirectHTTP(artistId, userId, isFollowing, artist).pipe(
                    switchMap(() => {                        
                        const currentFollowedArtists = Array.from(this.followedArtistsSubject.value);
                        return this.updateUserFollowedArtistsOnly(userId, currentFollowedArtists).pipe(
                            map(() => {
                                return true;
                            }),
                            catchError(error => {
                                console.warn('SocialService: User sync failed, but artist was updated:', error);
                                return of(true);
                            })
                        );
                    }),
                    catchError(error => {
                        console.error('SocialService: Artist update failed:', error);
                        this.updateFollowCacheImmediately(userId, artistId, !isFollowing);
                        return of(false);
                    })
                );
            }),
            catchError(error => {
                console.error('SocialService: Error in performFollowOperation:', error);
                return of(false);
            })
        );
    }

    /**
     * Actualizar artista directamente con HTTP
     */
    private updateArtistWithDirectHTTP(artistId: string, userId: string, isFollowing: boolean, artist: Artist): Observable<any> {        
        const newArtistsFollow = isFollowing 
            ? [...artist.artists_follow, userId]
            : artist.artists_follow.filter(id => id !== userId);
        
        const newFollowersCount = isFollowing 
            ? artist.followers_count + 1 
            : Math.max(0, artist.followers_count - 1);

        const strapiPayload = {
            data: {
                artists_follow: newArtistsFollow.map(id => parseInt(id, 10)),
                followers_count: newFollowersCount
            }
        };

        const token = (this.authService as any).getToken?.() || '';
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        return this.http.put(
            `https://umusic-rtfn.onrender.com/api/artists/${artistId}`,
            strapiPayload,
            { headers }
        ).pipe(
            tap(response => {
            })
        );
    }

    /**
     * Actualizar cache de seguimiento inmediatamente
     */
    private updateFollowCacheImmediately(userId: string, artistId: string, isFollowed: boolean) {
        const cacheKey = `${userId}-${artistId}`;
        this.followedArtistsCache.set(cacheKey, isFollowed);
        
        const currentFollowedArtists = this.followedArtistsSubject.value;
        const newFollowedArtists = new Set(currentFollowedArtists);
        
        if (isFollowed) {
            newFollowedArtists.add(artistId);
        } else {
            newFollowedArtists.delete(artistId);
        }
        
        this.followedArtistsSubject.next(newFollowedArtists);
    }

    /**
     * Verificar si un artista está siendo seguido
     */
    isArtistFollowed(artistId: string): Observable<boolean> {
        return this.followedArtists$.pipe(
            map(followedArtists => {
                const isFollowed = followedArtists.has(artistId);
                return isFollowed;
            })
        );
    }

    // ================================================================
    // UTILITY METHODS
    // ================================================================

    private arraysEqual(a: string[], b: string[]): boolean {
        if (a.length !== b.length) return false;
        return a.every((val, index) => val === b[index]);
    }

    private clearAllCache() {
        this.likedSongsCache.clear();
        this.likedSongsSubject.next(new Set());
        
        this.followedArtistsCache.clear();
        this.followedArtistsSubject.next(new Set());
        
        this.isInitialized = false;
    }

    public reloadUserSocialData(): void {
        if (this.currentUserId) {
            this.isInitialized = false;
            this.loadUserLikes(this.currentUserId);
            this.loadUserFollowedArtists(this.currentUserId);
        }
    }

    // ================================================================
    // RANKING METHODS
    // ================================================================

    getTopSongs(limit: number = 10): Observable<Song[]> {
        return this.songsService.getAll(1, 100, {}).pipe(
            take(1),
            map(response => {
                const songs = Array.isArray(response) ? response : response.data;
                return songs
                    .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
                    .slice(0, limit);
            })
        );
    }

    getTopPlaylists(limit: number = 10): Observable<Playlist[]> {
        return this.playlistsService.getAll(1, 100, {}).pipe(
            take(1),
            map(response => {
                const playlists = Array.isArray(response) ? response : response.data;
                return playlists
                    .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
                    .slice(0, limit);
            })
        );
    }

    getTopArtists(limit: number = 10): Observable<Artist[]> {
        return this.artistsService.getAll(1, 100, {}).pipe(
            take(1),
            map(response => {
                const artists = Array.isArray(response) ? response : response.data;
                return artists
                    .sort((a, b) => (b.followers_count || 0) - (a.followers_count || 0))
                    .slice(0, limit);
            })
        );
    }

    // ================================================================
    // DEBUG METHODS
    // ================================================================

    clearLikeCache(): void {
        this.clearAllCache();
        if (this.currentUserId) {
            setTimeout(() => {
                this.loadUserLikes(this.currentUserId!);
                this.loadUserFollowedArtists(this.currentUserId!);
            }, 100);
        }
    }

    isServiceInitialized(): boolean {
        return this.isInitialized && this.currentUserId !== null;
    }

    getDebugInfo(): any {
        return {
            currentUserId: this.currentUserId,
            isInitialized: this.isInitialized,
            likesCacheSize: this.likedSongsCache.size,
            likedSongsCount: this.likedSongsSubject.value.size,
            allLikedSongs: Array.from(this.likedSongsSubject.value),
            followsCacheSize: this.followedArtistsCache.size,
            followedArtistsCount: this.followedArtistsSubject.value.size,
            allFollowedArtists: Array.from(this.followedArtistsSubject.value)
        };
    }
}
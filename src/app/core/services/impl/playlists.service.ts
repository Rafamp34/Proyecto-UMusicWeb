import { Injectable, Inject } from '@angular/core';
import { BaseService } from './base-service.service';
import { IPlaylistsService } from '../interfaces/playlists-service.interface';
import { Playlist } from '../../models/playlist.model';
import { PLAYLISTS_REPOSITORY_TOKEN } from '../../repositories/repository.tokens';
import { Paginated } from '../../models/paginated.model';
import { IPlaylistsRepository } from '../../repositories/intefaces/playlists-repository.interface';
import { map, Observable, switchMap, catchError, of } from 'rxjs';
import { SearchParams } from '../../repositories/intefaces/base-repository.interface';

@Injectable({
  providedIn: 'root'
})
export class PlaylistsService extends BaseService<Playlist> implements IPlaylistsService {
  constructor(
    @Inject(PLAYLISTS_REPOSITORY_TOKEN) repository: IPlaylistsRepository
  ) {
    super(repository);
  }

  override add(playlist: any): Observable<Playlist> {
    const playlistData: Playlist = {
      id: playlist.id,
      name: playlist.name,
      author: playlist.author,
      duration: playlist.duration,
      song_IDS: playlist.song_IDS || [],
      users_IDS: playlist.users_IDS || [],
      image: this.mapImageField(playlist.image),
      likes_count: 0
    };

    return super.add(playlistData);
  }

  override update(id: string, playlist: any): Observable<Playlist> {
    const playlistData: Playlist = {
      id,
      name: playlist.name,
      author: playlist.author,
      duration: playlist.duration,
      song_IDS: playlist.song_IDS || [],
      users_IDS: playlist.users_IDS || [],
      image: this.mapImageField(playlist.image),
      likes_count: 0
    };
    return super.update(id, playlistData);
  }

  private mapImageField(image: any): any {
    if (!image) return undefined;
    if (typeof image === 'number') {
      return image;
    }
    if (typeof image === 'object') {
      if (image?.data?.id) {
        return image.data.id;
      }
      if (image?.id) {
        return image.id;
      }
    }
    console.warn('⚠️ Unrecognized image format:', image);
    return undefined;
  }

  getAllByUser(userId: string): Observable<Playlist[]> {
    const filters: SearchParams = { 'user': userId };
    return this.repository.getAll(1, 1000, filters).pipe(
      map(res => Array.isArray(res) ? res : res.data),
      catchError(error => {
        console.error('Error in getAllByUser:', error);
        return of([]);
      })
    );
  }

  getByUserId(userId: string): Observable<Playlist[]> {
    return this.repository.getAll(1, 1000, {}).pipe(
      map(res => {
        const playlists = Array.isArray(res) ? res : res.data;
        return playlists.filter(playlist => 
          Array.isArray(playlist.users_IDS) && 
          playlist.users_IDS.includes(userId)
        );
      }),
      catchError(error => {
        console.error('Error in getByUserId:', error);
        return of([]);
      })
    );
  }

  getByUserDisplayName(displayName: string): Observable<Playlist[]> {
    if (!displayName) return of([]);
    return this.repository.getAll(1, 1000, {}).pipe(
      map(res => {
        const playlists = Array.isArray(res) ? res : res.data;
        return playlists.filter(playlist => 
          playlist.author?.toLowerCase() === displayName.toLowerCase()
        );
      }),
      catchError(error => {
        console.error('Error in getByUserDisplayName:', error);
        return of([]);
      })
    );
  }

  getUserPlaylists(userId: string): Observable<Playlist[] | Paginated<Playlist>> {
    const filters: SearchParams = { 'user': userId };
    return this.getAll(1, 25, filters).pipe(
      catchError(error => {
        console.error('Error in getUserPlaylists:', error);
        return of([]);
      })
    );
  }

  addSong(playlistId: string, songId: string): Observable<Playlist> {
    return this.getById(playlistId).pipe(
      switchMap(playlist => {
        if (!playlist) throw new Error('Playlist not found');
        const updatedPlaylist: Playlist = {
          ...playlist,
          song_IDS: [...(playlist.song_IDS || []), songId]
        };
        return this.update(playlistId, updatedPlaylist);
      }),
      catchError(error => {
        console.error('Error adding song to playlist:', error);
        throw error;
      })
    );
  }

  removeSong(playlistId: string, songId: string): Observable<Playlist> {
    return this.getById(playlistId).pipe(
      switchMap(playlist => {
        if (!playlist) throw new Error('Playlist not found');
        const updatedPlaylist: Playlist = {
          ...playlist,
          song_IDS: (playlist.song_IDS || []).filter(id => id !== songId)
        };
        return this.update(playlistId, updatedPlaylist);
      }),
      catchError(error => {
        console.error('Error removing song from playlist:', error);
        throw error;
      })
    );
  }
}

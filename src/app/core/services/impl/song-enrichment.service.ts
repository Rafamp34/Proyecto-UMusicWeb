// src/app/core/services/impl/song-enrichment.service.ts - ARREGLADO
import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, map, catchError, lastValueFrom } from 'rxjs';
import { Song } from '../../models/song.model';
import { ArtistsService } from './artists.service';

export interface EnrichedSong extends Song {
    artistNames?: string[];
}

@Injectable({
    providedIn: 'root'
})
export class SongEnrichmentService {
    constructor(private artistsService: ArtistsService) {}

    enrichSong(song: Song): Observable<EnrichedSong> {
        
        if (!song.artists_IDS || song.artists_IDS.length === 0) {
        return of({ ...song, artistNames: ['Unknown Artist'] });
        }

        return this.artistsService.getByIds(song.artists_IDS).pipe(
        map(artists => {
            const artistNames = artists.map(artist => artist.name);
            return {
            ...song,
            artistNames: artistNames
            };
        }),
        catchError(error => {
            return of({ ...song, artistNames: ['Unknown Artist'] });
        })
        );
    }

    enrichSongs(songs: Song[]): Observable<EnrichedSong[]> {
        if (songs.length === 0) {
        return of([]);
        }

        const enrichmentObservables = songs.map(song => this.enrichSong(song));
        
        return forkJoin(enrichmentObservables).pipe(
        catchError(error => {
            console.error('Error enriching songs:', error);
            // Fallback: devolver canciones con nombres de artistas por defecto
            return of(songs.map(song => ({ 
            ...song, 
            artistNames: ['Unknown Artist'] 
            })));
        })
        );
    }

  // ✅ ARREGLADO: Usar lastValueFrom en lugar de toPromise()
    async enrichSongsAsync(songs: Song[]): Promise<EnrichedSong[]> {
        const enrichedSongs: EnrichedSong[] = [];
        
        for (const song of songs) {
        try {
            if (song.artists_IDS && song.artists_IDS.length > 0) {
            
            // ✅ ARREGLADO: Usar lastValueFrom en lugar de toPromise()
            const artists = await lastValueFrom(this.artistsService.getByIds(song.artists_IDS));
            
            if (artists && artists.length > 0) {
                enrichedSongs.push({
                ...song,
                artistNames: artists.map(artist => artist.name)
                });
            } else {
                console.warn('🎨 No artists found for song:', song.name);
                enrichedSongs.push({
                ...song,
                artistNames: ['Unknown Artist']
                });
            }
            } else {
            enrichedSongs.push({
                ...song,
                artistNames: ['Unknown Artist']
            });
            }
        } catch (error) {
            console.error('🎨 Error loading artists for song:', song.name, error);
            enrichedSongs.push({
            ...song,
            artistNames: ['Unknown Artist']
            });
        }
        }
        
        return enrichedSongs;
    }
}
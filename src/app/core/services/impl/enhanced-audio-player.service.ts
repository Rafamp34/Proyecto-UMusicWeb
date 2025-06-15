// src/app/core/services/impl/enhanced-audio-player.service.ts
import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { AudioPlayerService } from './audio-player.service';
import { SongEnrichmentService } from './song-enrichment.service';
import { Song } from '../../models/song.model';
import { EnrichedSong } from '../../models/enriched-song.interface';

@Injectable({
    providedIn: 'root'
})
export class EnhancedAudioPlayerService {
    constructor(
        private audioPlayerService: AudioPlayerService,
        private songEnrichmentService: SongEnrichmentService
    ) {}

    async playEnrichedSong(song: Song | EnrichedSong): Promise<void> {
        if (this.isEnrichedSong(song)) {
        // Ya tiene artistNames, usar directamente
        await this.audioPlayerService.play(song);
        } else {
        // Necesita ser enriquecida
        const enrichedSong = await this.songEnrichmentService.enrichSong(song).toPromise();
        if (enrichedSong) {
            await this.audioPlayerService.play(enrichedSong);
        }
        }
    }

    async setEnrichedQueue(songs: (Song | EnrichedSong)[], startIndex: number = 0): Promise<void> {
        const enrichedSongs: EnrichedSong[] = [];
        
        for (const song of songs) {
        if (this.isEnrichedSong(song)) {
            enrichedSongs.push(song);
        } else {
            const enriched = await this.songEnrichmentService.enrichSong(song).toPromise();
            if (enriched) {
            enrichedSongs.push(enriched);
            }
        }
        }
        
        this.audioPlayerService.setQueue(enrichedSongs, startIndex);
    }

    private isEnrichedSong(song: Song | EnrichedSong): song is EnrichedSong {
        return 'artistNames' in song && Array.isArray((song as EnrichedSong).artistNames);
    }

    // Delegar todos los otros métodos al AudioPlayerService
    get playerState$() {
        return this.audioPlayerService.playerState$;
    }

    pause() {
        this.audioPlayerService.pause();
    }

    resume() {
        this.audioPlayerService.resume();
    }

    next() {
        this.audioPlayerService.next();
    }

    previous() {
        this.audioPlayerService.previous();
    }

    seekTo(time: number) {
        this.audioPlayerService.seekTo(time);
    }

    setVolume(volume: number) {
        this.audioPlayerService.setVolume(volume);
    }

    toggleShuffle() {
        this.audioPlayerService.toggleShuffle();
    }

    toggleRepeat() {
        this.audioPlayerService.toggleRepeat();
    }

    formatTime(seconds: number): string {
        return this.audioPlayerService.formatTime(seconds);
    }

    getPlayerState() {
        return this.audioPlayerService.getPlayerState();
    }

    getCurrentSong() {
        return this.audioPlayerService.getCurrentSong();
    }

    removeFromQueue(index: number) {
        this.audioPlayerService.removeFromQueue(index);
    }
}
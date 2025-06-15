// src/app/core/services/impl/audio-player.service.ts - ACTUALIZADO
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, takeWhile, map } from 'rxjs';
import { Song } from '../../models/song.model';
import { EnrichedSong } from '../../models/enriched-song.interface';

export interface PlayerState {
    isPlaying: boolean;
    isPaused: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isLoading: boolean;
    progress: number; // 0-100
    currentSong: EnrichedSong | null;
    queue: EnrichedSong[];
    currentIndex: number;
    isShuffled: boolean;
    repeatMode: 'none' | 'one' | 'all';
    // NUEVO: Información de contexto
    playingFrom?: {
        type: 'playlist' | 'album' | 'artist' | 'liked' | 'search';
        name: string;
        id?: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class AudioPlayerService {
    private audio: HTMLAudioElement;
    private _playerState = new BehaviorSubject<PlayerState>({
        isPlaying: false,
        isPaused: false,
        currentTime: 0,
        duration: 0,
        volume: 0.7, // MEJORADO: Volumen inicial al 70%
        isLoading: false,
        progress: 0,
        currentSong: null,
        queue: [],
        currentIndex: -1,
        isShuffled: false,
        repeatMode: 'none'
    });

    public playerState$ = this._playerState.asObservable();

    constructor() {
        this.audio = new Audio();
        this.audio.volume = 0.7; // Establecer volumen inicial
        this.setupAudioEvents();
        this.setupProgressTracking();
    }

    private setupAudioEvents() {
        this.audio.addEventListener('loadstart', () => {
            this.updateState({ isLoading: true });
        });

        this.audio.addEventListener('loadedmetadata', () => {
            this.updateState({ 
                duration: this.audio.duration,
                isLoading: false 
            });
        });

        this.audio.addEventListener('play', () => {
            this.updateState({ 
                isPlaying: true, 
                isPaused: false 
            });
        });

        this.audio.addEventListener('pause', () => {
            this.updateState({ 
                isPlaying: false, 
                isPaused: true 
            });
        });

        this.audio.addEventListener('ended', () => {
            this.handleSongEnd();
        });

        this.audio.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.updateState({ 
                isLoading: false, 
                isPlaying: false 
            });
        });

        this.audio.addEventListener('timeupdate', () => {
            const currentTime = this.audio.currentTime;
            const duration = this.audio.duration || 0;
            const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
            
            this.updateState({
                currentTime,
                progress
            });
        });
    }

    private setupProgressTracking() {
        interval(1000).pipe(
            takeWhile(() => true)
        ).subscribe(() => {
            if (this.audio && !this.audio.paused) {
                const currentTime = this.audio.currentTime;
                const duration = this.audio.duration || 0;
                const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
                
                this.updateState({
                    currentTime,
                    progress
                });
            }
        });
    }

    private updateState(partialState: Partial<PlayerState>) {
        const currentState = this._playerState.value;
        this._playerState.next({ ...currentState, ...partialState });
    }

    // NUEVO: Método para establecer contexto de reproducción
    setPlayingContext(context: { type: 'playlist' | 'album' | 'artist' | 'liked' | 'search', name: string, id?: string }) {
        this.updateState({
            playingFrom: context
        });
    }

    // Métodos públicos del reproductor
    loadSong(song: Song | EnrichedSong): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!song.audioUrl) {
                console.warn('No audio URL found for song:', song.name);
                this.audio.src = 'assets/audio/sample.mp3';
            } else {
                this.audio.src = song.audioUrl;
            }

            this.updateState({
                currentSong: song as EnrichedSong,
                isLoading: true,
                currentTime: 0,
                progress: 0
            });

            this.audio.addEventListener('loadeddata', () => resolve(), { once: true });
            this.audio.addEventListener('error', () => reject(), { once: true });
        });
    }

    async play(song?: Song | EnrichedSong): Promise<void> {
        try {
            if (song) {
                await this.loadSong(song);
            }
            
            await this.audio.play();
        } catch (error) {
            console.error('Error playing audio:', error);
            this.updateState({ isLoading: false });
        }
    }

    pause() {
        this.audio.pause();
    }

    resume() {
        this.audio.play();
    }

    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        this.updateState({
            isPlaying: false,
            isPaused: false,
            currentTime: 0,
            progress: 0
        });
    }

    seekTo(time: number) {
        this.audio.currentTime = time;
    }

    // MEJORADO: Control de volumen más suave
    setVolume(volume: number) {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        
        // Transición suave del volumen
        const currentVolume = this.audio.volume;
        const steps = 10;
        const increment = (clampedVolume - currentVolume) / steps;
        
        let step = 0;
        const volumeInterval = setInterval(() => {
            step++;
            const newVolume = currentVolume + (increment * step);
            this.audio.volume = step === steps ? clampedVolume : newVolume;
            
            if (step >= steps) {
                clearInterval(volumeInterval);
                this.updateState({ volume: clampedVolume });
            }
        }, 20); // 20ms entre pasos para transición suave
    }

    // Control de cola de reproducción
    setQueue(songs: (Song | EnrichedSong)[], startIndex: number = 0) {
        this.updateState({
            queue: songs.map(song => song as EnrichedSong),
            currentIndex: startIndex
        });
    }

    addToQueue(song: Song | EnrichedSong) {
        const currentState = this._playerState.value;
        this.updateState({
            queue: [...currentState.queue, song as EnrichedSong]
        });
    }

    removeFromQueue(index: number) {
        const currentState = this._playerState.value;
        const newQueue = currentState.queue.filter((_, i) => i !== index);
        let newIndex = currentState.currentIndex;
        
        if (index < currentState.currentIndex) {
            newIndex--;
        } else if (index === currentState.currentIndex) {
            newIndex = Math.min(newIndex, newQueue.length - 1);
        }

        this.updateState({
            queue: newQueue,
            currentIndex: newIndex
        });
    }

    next() {
        const state = this._playerState.value;
        if (state.queue.length === 0) return;

        let nextIndex = state.currentIndex + 1;
        
        if (state.repeatMode === 'all' && nextIndex >= state.queue.length) {
            nextIndex = 0;
        } else if (nextIndex >= state.queue.length) {
            return;
        }

        this.updateState({ currentIndex: nextIndex });
        this.play(state.queue[nextIndex]);
    }

    previous() {
        const state = this._playerState.value;
        if (state.queue.length === 0) return;

        let prevIndex = state.currentIndex - 1;
        
        if (prevIndex < 0) {
            if (state.repeatMode === 'all') {
                prevIndex = state.queue.length - 1;
            } else {
                return;
            }
        }

        this.updateState({ currentIndex: prevIndex });
        this.play(state.queue[prevIndex]);
    }

    toggleShuffle() {
        const state = this._playerState.value;
        this.updateState({ isShuffled: !state.isShuffled });
        
        if (!state.isShuffled) {
            // Activar shuffle: mezclar cola
            const shuffledQueue = [...state.queue];
            for (let i = shuffledQueue.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledQueue[i], shuffledQueue[j]] = [shuffledQueue[j], shuffledQueue[i]];
            }
            this.updateState({ queue: shuffledQueue });
        }
    }

    toggleRepeat() {
        const state = this._playerState.value;
        const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
        const currentIndex = modes.indexOf(state.repeatMode);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        
        this.updateState({ repeatMode: nextMode });
    }

    private handleSongEnd() {
        const state = this._playerState.value;
        
        if (state.repeatMode === 'one') {
            this.audio.currentTime = 0;
            this.audio.play();
        } else {
            this.next();
        }
    }

    // Métodos de utilidad
    formatTime(seconds: number): string {
        if (isNaN(seconds)) return '0:00';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    getCurrentSong(): EnrichedSong | null {
        return this._playerState.value.currentSong;
    }

    getPlayerState(): PlayerState {
        return this._playerState.value;
    }

    getPlayingFrom(): string {
        const context = this._playerState.value.playingFrom;
        if (!context) return 'Música';
        
        switch (context.type) {
            case 'playlist': return `Playing from playlist`;
            case 'album': return `Playing from album`;
            case 'artist': return `Playing from artist`;
            case 'liked': return `Playing from liked songs`;
            case 'search': return `Playing from search`;
            default: return 'Música';
        }
    }
}
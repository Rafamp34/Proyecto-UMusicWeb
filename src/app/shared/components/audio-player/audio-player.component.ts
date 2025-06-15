// src/app/shared/components/audio-player/audio-player.component.ts - ACTUALIZADO CON SCROLL FIX
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AudioPlayerService, PlayerState } from '../../../core/services/impl/audio-player.service';
import { EnrichedSong } from '../../../core/models/enriched-song.interface';

@Component({
    selector: 'app-audio-player',
    templateUrl: './audio-player.component.html',
    styleUrls: ['./audio-player.component.scss']
})
export class AudioPlayerComponent implements OnInit, OnDestroy {
    playerState: PlayerState | null = null;
    isExpanded = false;
    showQueue = false;
    private destroy$ = new Subject<void>();
    
    private previousVolume = 0.7;
    private isMuted = false;

    constructor(
        private audioPlayerService: AudioPlayerService
    ) {}

    ngOnInit() {
        this.audioPlayerService.playerState$
            .pipe(takeUntil(this.destroy$))
            .subscribe(state => {
                this.playerState = state;
                
                // ✅ GESTIÓN DEL SCROLL - Cuando cambia el estado del player
                this.handleScrollPadding();
            });
    }

    ngOnDestroy() {
        // ✅ LIMPIAR SCROLL al destruir el componente
        this.removeScrollPadding();
        
        this.destroy$.next();
        this.destroy$.complete();
    }

    // ================================================================
    // ✅ MÉTODOS PARA GESTIONAR EL SCROLL
    // ================================================================

    /**
     * Maneja el padding del scroll según si el player está visible
     */
    private handleScrollPadding() {
        if (this.showPlayer) {
            // Mostrar miniplayer - agregar padding
            this.addScrollPadding();
        } else {
            // Ocultar miniplayer - remover padding
            this.removeScrollPadding();
        }
    }

    /**
     * Agrega padding al body para evitar que el miniplayer tape contenido
     */
    private addScrollPadding() {
        document.body.classList.add('has-miniplayer');
    }

    /**
     * Remueve el padding del body
     */
    private removeScrollPadding() {
        document.body.classList.remove('has-miniplayer');
    }

    // ================================================================
    // MÉTODOS EXISTENTES (manteniendo toda la funcionalidad)
    // ================================================================

    getPlayingFromText(): string {
        if (!this.playerState?.playingFrom) {
            return 'Playing from Library';
        }
        
        const context = this.playerState.playingFrom;
        switch (context.type) {
            case 'playlist': return 'Playing from Playlist';
            case 'album': return 'Playing from Album';
            case 'artist': return 'Playing from Artist';
            case 'liked': return 'Playing from Liked Songs';
            case 'search': return 'Playing from Search';
            default: return 'Playing Music';
        }
    }

    togglePlayPause() {
        if (!this.playerState?.currentSong) return;

        if (this.playerState.isPlaying) {
            this.audioPlayerService.pause();
        } else {
            this.audioPlayerService.resume();
        }
    }

    next() {
        this.audioPlayerService.next();
    }

    previous() {
        this.audioPlayerService.previous();
    }

    onProgressChange(event: any) {
        if (!this.playerState?.duration) return;
        
        const value = parseFloat(event.detail.value);
        const time = (value / 100) * this.playerState.duration;
        this.audioPlayerService.seekTo(time);
    }

    onVolumeChange(event: any) {
        const volume = parseFloat(event.detail.value) / 100;
        this.audioPlayerService.setVolume(volume);
        
        this.isMuted = volume === 0;
        if (volume > 0) {
            this.previousVolume = volume;
        }
    }

    toggleMute() {
        if (this.isMuted) {
            this.audioPlayerService.setVolume(this.previousVolume);
            this.isMuted = false;
        } else {
            this.previousVolume = this.playerState?.volume || 0.7;
            this.audioPlayerService.setVolume(0);
            this.isMuted = true;
        }
    }

    getVolumeIcon(): string {
        const volume = this.volume;
        
        if (this.isMuted || volume === 0) {
            return 'volume-mute';
        } else if (volume < 30) {
            return 'volume-low';
        } else if (volume < 70) {
            return 'volume-medium';
        } else {
            return 'volume-high';
        }
    }

    toggleShuffle() {
        this.audioPlayerService.toggleShuffle();
    }

    toggleRepeat() {
        this.audioPlayerService.toggleRepeat();
    }

    toggleExpanded() {
        this.isExpanded = !this.isExpanded;
        
        // ✅ Recalcular padding cuando se expande/contrae
        setTimeout(() => {
            this.handleScrollPadding();
        }, 100);
    }

    toggleQueue() {
        this.showQueue = !this.showQueue;
    }

    removeFromQueue(index: number) {
        this.audioPlayerService.removeFromQueue(index);
    }

    playSongFromQueue(song: EnrichedSong, index: number) {
        this.audioPlayerService.play(song);
    }

    // ================================================================
    // GETTERS (manteniendo todos los existentes)
    // ================================================================

    get currentSong(): EnrichedSong | null {
        return this.playerState?.currentSong || null;
    }

    get isPlaying(): boolean {
        return this.playerState?.isPlaying || false;
    }

    get progress(): number {
        return this.playerState?.progress || 0;
    }

    get currentTime(): string {
        return this.audioPlayerService.formatTime(this.playerState?.currentTime || 0);
    }

    get duration(): string {
        return this.audioPlayerService.formatTime(this.playerState?.duration || 0);
    }

    get volume(): number {
        return (this.playerState?.volume || 0.7) * 100;
    }

    get isShuffled(): boolean {
        return this.playerState?.isShuffled || false;
    }

    get repeatMode(): string {
        return this.playerState?.repeatMode || 'none';
    }

    get queue(): EnrichedSong[] {
        return this.playerState?.queue || [];
    }

    get currentIndex(): number {
        return this.playerState?.currentIndex || -1;
    }

    get showPlayer(): boolean {
        return !!this.playerState?.currentSong;
    }

    get Math() {
        return Math;
    }

    getRepeatIcon(): string {
        switch (this.repeatMode) {
            case 'one': return 'repeat-once';
            case 'all': return 'repeat';
            default: return 'repeat';
        }
    }

    getRepeatColor(): string {
        return this.repeatMode !== 'none' ? 'primary' : 'medium';
    }
}
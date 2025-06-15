// src/app/shared/components/song-grid-card/song-grid-card.component.ts - ACTUALIZADO
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Song } from 'src/app/core/models/song.model';
import { EnrichedSong } from 'src/app/core/models/enriched-song.interface';
import { Artist } from 'src/app/core/models/artist.model';
import { ArtistsService } from 'src/app/core/services/impl/artists.service';
import { AudioPlayerService } from 'src/app/core/services/impl/audio-player.service';
import { BehaviorSubject, takeUntil, Subject } from 'rxjs';

@Component({
  selector: 'app-song-grid-card',
  templateUrl: './song-grid-card.component.html',
  styleUrls: ['./song-grid-card.component.scss']
})
export class SongGridCardComponent implements OnInit, OnDestroy {
  @Input() song!: Song | EnrichedSong;
  @Input() playlist: (Song | EnrichedSong)[] = []; // ✅ NUEVO: Lista completa para el reproductor
  @Output() edit = new EventEmitter<Song | EnrichedSong>();
  @Output() delete = new EventEmitter<Song | EnrichedSong>();
  @Output() playSong = new EventEmitter<Song | EnrichedSong>(); // Mantener compatibilidad

  private _artistNames = new BehaviorSubject<string[]>(['Unknown Artist']);
  artistNames$ = this._artistNames.asObservable();
  
  isCurrentSongPlaying = false;
  isHovered = false;
  private destroy$ = new Subject<void>();

  constructor(
    private artistsService: ArtistsService,
    private audioPlayerService: AudioPlayerService // ✅ NUEVO
  ) {}

  ngOnInit() {
    this.loadArtists();
    this.subscribeToPlayerState(); // ✅ NUEVO
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ✅ NUEVO: Suscribirse al estado del reproductor
  private subscribeToPlayerState() {
    this.audioPlayerService.playerState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.isCurrentSongPlaying = 
          state.currentSong?.id === this.song?.id && state.isPlaying;
      });
  }

  private loadArtists() {
    if (this.song.artists_IDS?.length) {
      this.artistsService.getByIds(this.song.artists_IDS).subscribe({
        next: (artists) => {
          this._artistNames.next(artists.map(artist => artist.name));
        },
        error: (error) => {
          console.error('Error loading artists:', error);
          this._artistNames.next(['Unknown Artist']);
        }
      });
    } else {
      this._artistNames.next(['Unknown Artist']);
    }
  }

  onEdit() {
    this.edit.emit(this.song);
  }

  onDelete() {
    this.delete.emit(this.song);
  }

  // ✅ ACTUALIZADO: Nuevo método de reproducción
  async onPlay() {
    if (!this.song) return;

    const currentState = this.audioPlayerService.getPlayerState();
    
    if (currentState.currentSong?.id === this.song.id) {
      // Es la misma canción, toggle play/pause
      if (currentState.isPlaying) {
        this.audioPlayerService.pause();
      } else {
        this.audioPlayerService.resume();
      }
    } else {
      // Es una canción diferente, cargar y reproducir
      if (this.playlist.length > 0) {
        const songIndex = this.playlist.findIndex(s => s.id === this.song.id);
        this.audioPlayerService.setQueue(this.playlist, songIndex);
      } else {
        this.audioPlayerService.setQueue([this.song], 0);
      }
      
      await this.audioPlayerService.play(this.song);
    }

    // Emitir evento para compatibilidad hacia atrás
    this.playSong.emit(this.song);
  }

  onMouseEnter() {
    this.isHovered = true;
  }

  onMouseLeave() {
    this.isHovered = false;
  }
}
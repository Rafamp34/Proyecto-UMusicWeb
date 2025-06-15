// src/app/shared/components/play-button/play-button.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Song } from '../../../core/models/song.model';
import { EnrichedSong } from '../../../core/models/enriched-song.interface';
import { AudioPlayerService } from '../../../core/services/impl/audio-player.service';

@Component({
  selector: 'app-play-button',
  template: `
    <ion-button 
      [fill]="fill" 
      [size]="size" 
      [color]="color"
      [class]="customClass"
      (click)="togglePlay()">
      <ion-icon 
        [name]="isCurrentSongPlaying ? 'pause' : 'play'" 
        [slot]="iconSlot">
      </ion-icon>
      <ng-content></ng-content>
    </ion-button>
  `,
  styleUrls: ['./play-button.component.scss']
})
export class PlayButtonComponent implements OnInit, OnDestroy {
  @Input() song!: Song | EnrichedSong;
  @Input() playlist: (Song | EnrichedSong)[] = [];
  @Input() fill: string = 'clear';
  @Input() size: string = 'default';
  @Input() color: string = 'primary';
  @Input() iconSlot: string = 'icon-only';
  @Input() customClass: string = '';
  
  @Output() playStarted = new EventEmitter<Song | EnrichedSong>();
  @Output() playPaused = new EventEmitter<Song | EnrichedSong>();

  isCurrentSongPlaying = false;
  private destroy$ = new Subject<void>();

  constructor(private audioPlayerService: AudioPlayerService) {}

  ngOnInit() {
    this.audioPlayerService.playerState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.isCurrentSongPlaying = 
          state.currentSong?.id === this.song?.id && state.isPlaying;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async togglePlay() {
    if (!this.song) return;

    const currentState = this.audioPlayerService.getPlayerState();
    
    if (currentState.currentSong?.id === this.song.id) {
      // Es la misma canción, toggle play/pause
      if (currentState.isPlaying) {
        this.audioPlayerService.pause();
        this.playPaused.emit(this.song);
      } else {
        this.audioPlayerService.resume();
        this.playStarted.emit(this.song);
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
      this.playStarted.emit(this.song);
    }
  }
}


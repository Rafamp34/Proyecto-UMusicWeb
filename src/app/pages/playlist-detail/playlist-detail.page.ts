
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, catchError, of, switchMap, Subject } from 'rxjs';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { Playlist } from 'src/app/core/models/playlist.model';
import { Song } from 'src/app/core/models/song.model';
import { EnrichedSong } from 'src/app/core/models/enriched-song.interface';
import { PlaylistsService } from 'src/app/core/services/impl/playlists.service';
import { SongsService } from 'src/app/core/services/impl/songs.service';
import { BaseAuthenticationService } from 'src/app/core/services/impl/base-authentication.service';
import { AudioPlayerService } from 'src/app/core/services/impl/audio-player.service';
import { SongModalComponent } from 'src/app/shared/components/song-modal/song-modal.component';
import { filter, map, tap, takeUntil } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { SongDetailModalComponent } from 'src/app/shared/components/song-detail-modal/song-detail-modal.component';
import { TranslateService } from '@ngx-translate/core';
import { ArtistsService } from 'src/app/core/services/impl/artists.service';
import { User } from 'src/app/core/models/user.model';
import { UserService } from 'src/app/core/services/impl/user.service';
import { ShareService } from 'src/app/core/services/impl/share.service';

interface SongWithArtists extends Song {
  artistNames?: string[];
}

@Component({
  selector: 'app-playlist-detail',
  templateUrl: './playlist-detail.page.html',
  styleUrls: ['./playlist-detail.page.scss'],
})
export class PlaylistDetailPage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  private _playlist = new BehaviorSubject<Playlist | null>(null);
  playlist$ = this._playlist.asObservable();
  
  private _songs = new BehaviorSubject<SongWithArtists[]>([]);
  songs$ = this._songs.asObservable();

  private _currentUser = new BehaviorSubject<User | null>(null);
  currentUser$ = this._currentUser.asObservable();

  // ✅ INTEGRACIÓN CON AudioPlayerService
  playerState$ = this.audioPlayerService.playerState$;
  
  isOwner = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private playlistsSvc: PlaylistsService,
    private songsSvc: SongsService,
    private authSvc: BaseAuthenticationService,
    private audioPlayerService: AudioPlayerService, // 👈 Tu servicio de audio
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private translate: TranslateService,
    private artistsSvc: ArtistsService,
    private userService: UserService,
    private shareService: ShareService,
  ) { }

  async ngOnInit() {    
    this.authSvc.user$.pipe(
      takeUntil(this.destroy$),
      filter(user => user !== undefined),
      switchMap(user => {
        if (!user) {
          return of(null);
        }
        return this.userService.getById(user.id);
      })
    ).subscribe({
      next: (userData) => {
        if (userData) {
          const updatedUser: User = {
            ...userData,
            image: userData.image || undefined
          };
          this._currentUser.next(updatedUser);
        }
      },
      error: (error) => {
        console.error('🎵 Error loading user data:', error);
      }
    });

    // ✅ PASO 2: Cargar playlist desde la URL
    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        
        if (!params['id']) {
          console.error('🎵 No playlist ID in route');
          return of(null);
        }
        
        return this.playlistsSvc.getById(params['id']).pipe(
          catchError(error => {
            console.error('🎵 Error loading playlist:', error);
            this.showToast('PLAYLIST.ERRORS.LOAD');
            return of(null);
          })
        );
      })
    ).subscribe({
      next: async (playlist) => {
        
        if (playlist) {
          
          if (!playlist.name || !playlist.author) {
            console.error('🎵 Playlist has invalid data:', playlist);
            this.showToast('PLAYLIST.ERRORS.INVALID_DATA');
            this.router.navigate(['/home']);
            return;
          }
          
          this._playlist.next(playlist);
          
          // ✅ Cargar canciones si existen
          if (playlist.song_IDS && playlist.song_IDS.length > 0) {
            await this.loadSongs(playlist);
          } else {
            this._songs.next([]);
          }
          
          // ✅ Verificar ownership
          try {
            const currentUser = await this.authSvc.getCurrentUser();
            if (currentUser && playlist.users_IDS && playlist.users_IDS.length > 0) {
              this.isOwner = playlist.users_IDS.includes(currentUser.id);
            }
          } catch (error) {
            console.error('🎵 Error checking ownership:', error);
          }
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (error) => {
        console.error('🎵 Critical error loading playlist:', error);
        this.showToast('PLAYLIST.ERRORS.LOAD');
        this.router.navigate(['/home']);
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggle play/pause o reproduce toda la playlist si no hay nada reproduciéndose
   */
  async onPlay() {
    const playerState = this.audioPlayerService.getPlayerState();
    const songs = this._songs.value;
    const playlist = this._playlist.value;
    
    if (songs.length === 0) return;

    // Si hay una canción actual y está reproduciéndose, pausar
    if (playerState.currentSong && playerState.isPlaying) {
      this.audioPlayerService.pause();
      return;
    }

    // Si hay una canción actual pero está pausada, reanudar
    if (playerState.currentSong && playerState.isPaused) {
      this.audioPlayerService.resume();
      return;
    }

    // Si no hay canción actual, reproducir toda la playlist desde el inicio
    
    if (playlist) {
      this.audioPlayerService.setPlayingContext({
        type: 'playlist',
        name: playlist.name,
        id: playlist.id
      });
    }
    
    const enrichedSongs = this.convertToEnrichedSongs(songs);
    this.audioPlayerService.setQueue(enrichedSongs, 0);
    await this.audioPlayerService.play(enrichedSongs[0]);
  }

  /**
   * Activa shuffle y reproduce la playlist mezclada
   */
  async onShuffle() {
    const songs = this._songs.value;
    const playlist = this._playlist.value;
    if (songs.length === 0) return;
    
    // ✅ NUEVO: Establecer contexto de reproducción
    if (playlist) {
      this.audioPlayerService.setPlayingContext({
        type: 'playlist',
        name: `${playlist.name} (Shuffled)`,
        id: playlist.id
      });
    }
    
    // Convertir a EnrichedSong
    const enrichedSongs = this.convertToEnrichedSongs(songs);
    
    // Mezclar las canciones manualmente
    const shuffledSongs = [...enrichedSongs];
    for (let i = shuffledSongs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledSongs[i], shuffledSongs[j]] = [shuffledSongs[j], shuffledSongs[i]];
    }
    
    // Configurar la cola con las canciones mezcladas
    this.audioPlayerService.setQueue(shuffledSongs, 0);
    
    // Activar el modo shuffle en el reproductor
    const playerState = this.audioPlayerService.getPlayerState();
    if (!playerState.isShuffled) {
      this.audioPlayerService.toggleShuffle();
    }
    
    // Reproducir la primera canción de la lista mezclada
    await this.audioPlayerService.play(shuffledSongs[0]);
  }

  /**
   * Reproduce una canción específica (reemplaza tu método playSong)
   */
  async playSong(song: SongWithArtists, index: number) {    
    const songs = this._songs.value;
    const enrichedSongs = this.convertToEnrichedSongs(songs);
    
    // Configurar la cola desde la canción seleccionada
    this.audioPlayerService.setQueue(enrichedSongs, index);
    
    // Reproducir la canción seleccionada
    await this.audioPlayerService.play(enrichedSongs[index]);
  }

  /**
   * Verifica si una canción está reproduciéndose actualmente
   */
  isCurrentlyPlaying(song: Song): boolean {
    const playerState = this.audioPlayerService.getPlayerState();
    return playerState.currentSong?.id === song.id && playerState.isPlaying;
  }

  /**
   * Verifica si una canción es la actual (reproduciendo o pausada)
   */
  isCurrentSong(song: Song): boolean {
    const playerState = this.audioPlayerService.getPlayerState();
    return playerState.currentSong?.id === song.id;
  }

  /**
   * Convierte SongWithArtists[] a EnrichedSong[]
   */
  private convertToEnrichedSongs(songs: SongWithArtists[]): EnrichedSong[] {
    return songs.map(song => ({
      ...song,
      audioUrl: song.audioUrl || `assets/audio/sample-${song.id}.mp3`, // URL de ejemplo si no existe
      artistNames: song.artistNames || ['Unknown Artist']
    } as EnrichedSong));
  }

  // ✅ GETTERS PARA EL TEMPLATE (para compatibilidad)
  
  get isPlaying$() {
    return this.playerState$.pipe(map(state => state.isPlaying));
  }

  get currentSong() {
    return this.audioPlayerService.getPlayerState().currentSong;
  }

  /**
   * Verifica si el botón debe mostrar "pause" (hay música reproduciéndose)
   */
  get shouldShowPause$() {
    return this.playerState$.pipe(
      map(state => state.isPlaying && state.currentSong !== null)
    );
  }

  /**
   * Verifica si el shuffle está activo
   */
  get isShuffleActive$() {
    return this.playerState$.pipe(
      map(state => state.isShuffled)
    );
  }

  // ✅ MÉTODOS EXISTENTES (mantener todos los que ya tienes)

  private async loadSongs(playlist: Playlist) {
    
    if (!playlist.song_IDS?.length) {
      this._songs.next([]);
      return;
    }

    const songRequests = playlist.song_IDS.map(id => {
      return this.songsSvc.getById(id).pipe(
        catchError(err => {
          console.error(`🎵 Error loading song ${id}:`, err);
          return of(null);
        })
      );
    });

    forkJoin(songRequests)
      .pipe(
        map(songs => {
          const validSongs = songs.filter((song): song is Song => song !== null);
          return validSongs;
        }),
        switchMap(async (songs) => {
          const enrichedSongs = await this.enrichSongWithArtists(songs);
          return enrichedSongs;
        })
      )
      .subscribe({
        next: (songs) => {
          this._songs.next(songs);
        },
        error: (error) => {
          console.error('🎵 Error in loadSongs:', error);
          this._songs.next([]);
        }
      });
  }

  private async enrichSongWithArtists(songs: Song[]): Promise<SongWithArtists[]> {
    const enrichedSongs: SongWithArtists[] = [];
    
    for (const song of songs) {
      
      if (!song) {
        continue;
      }
      
      if (song.artists_IDS && song.artists_IDS.length > 0) {
        try {
          const artists = await this.artistsSvc.getByIds(song.artists_IDS).toPromise();
          if (artists) {
            const enrichedSong: SongWithArtists = {
              ...song,
              artistNames: artists.map(artist => artist.name)
            };
            enrichedSongs.push(enrichedSong);
          } else {
            enrichedSongs.push({ ...song, artistNames: ['Unknown Artist'] });
          }
        } catch (error) {
          console.error('🎵 Error loading artists for song:', song.id, error);
          enrichedSongs.push({ ...song, artistNames: ['Unknown Artist'] });
        }
      } else {
        enrichedSongs.push({ ...song, artistNames: ['Unknown Artist'] });
      }
    }
    
    return enrichedSongs;
  }

  // ✅ Resto de métodos permanecen iguales...
  async addSong() {
    const modal = await this.modalCtrl.create({
      component: SongDetailModalComponent,
      componentProps: {
        excludeSongIds: this._songs.value.map(s => s.id)
      }
    });
  
    modal.onDidDismiss().then(async (result) => {
      if (result.role === 'select' && result.data) {
        const playlist = this._playlist.value;
        if (!playlist) return;

        const updatedPlaylist: Playlist = {
          ...playlist,
          song_IDS: [...playlist.song_IDS, result.data.id]
        };

        this.playlistsSvc.update(playlist.id, updatedPlaylist).subscribe({
          next: () => {
            this._playlist.next(updatedPlaylist);
            
            this.songsSvc.getById(result.data.id).subscribe(async newSong => {
              if (newSong) {
                const enrichedNewSong = await this.enrichSongWithArtists([newSong]);
                this._songs.next([...this._songs.value, ...enrichedNewSong]);
              }
            });
            
            this.showToast('PLAYLIST.SUCCESS.SONG_ADDED');
          },
          error: () => this.showToast('PLAYLIST.ERRORS.SONG_ADD')
        });
      }
    });
  
    await modal.present();
  }

  async editSong(song: Song, event: Event) {
    event.stopPropagation();
    const modal = await this.modalCtrl.create({
      component: SongDetailModalComponent,
      componentProps: {
        song: song,
        mode: 'edit'
      }
    });

    modal.onDidDismiss().then((result) => {
      if (result.role === 'saved' && this._playlist.value) {
        this.loadSongs(this._playlist.value);
        this.showToast('PLAYLIST.SUCCESS.SONG_UPDATED');
      }
    });

    await modal.present();
  }

  private async showConfirmRemoveDialog(): Promise<boolean> {
    const alert = await this.alertCtrl.create({
      header: await this.translate.get('PLAYLIST.REMOVE_SONG.HEADER').toPromise(),
      message: await this.translate.get('PLAYLIST.REMOVE_SONG.MESSAGE').toPromise(),
      buttons: [
        {
          text: await this.translate.get('COMMON.CANCEL').toPromise(),
          role: 'cancel'
        },
        {
          text: await this.translate.get('COMMON.DELETE').toPromise(),
          role: 'confirm'
        }
      ]
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }

  async removeSong(song: Song, event: Event) {
    event.stopPropagation();
    
    const confirmed = await this.showConfirmRemoveDialog();
    if (!confirmed) return;

    const playlist = this._playlist.value;
    if (!playlist) return;

    const updatedPlaylist = {
      ...playlist,
      song_IDS: playlist.song_IDS.filter(id => id !== song.id)
    };

    this.playlistsSvc.update(playlist.id, updatedPlaylist).subscribe({
      next: () => {
        this._playlist.next(updatedPlaylist);
        this._songs.next(this._songs.value.filter(s => s.id !== song.id));
        this.showToast('PLAYLIST.SUCCESS.SONG_REMOVED');
      },
      error: () => this.showToast('PLAYLIST.ERRORS.SONG_REMOVE')
    });
  }

  onBack() {
    this.router.navigate(['/home']);
  }

  private async showToast(translationKey: string) {
    try {
      const message = await this.translate.get(translationKey).toPromise();
      const toast = await this.toastCtrl.create({
        message,
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();
    } catch (error) {
      console.error('Error showing toast:', error);
    }
  }

  async sharePlaylist() {
    const playlist = this._playlist.value;
    
    if (!playlist) return;
    
    const title = playlist.name;
    const text = `Check out this playlist: ${playlist.name} by ${playlist.author}`;
    const url = window.location.href;
    
    try {
      await this.shareService.shareItem({
        title: title,
        text: text,
        url: url,
        dialogTitle: 'Share Playlist'
      });
    } catch (error) {
      console.error('Error sharing playlist:', error);
      const toast = await this.toastCtrl.create({
        message: 'Could not share playlist',
        duration: 2000,
        position: 'bottom'
      });
      await toast.present();
    }
  }

  formatDuration(seconds: number): string {
    if (!seconds) return '00:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = remainingSeconds.toString().padStart(2, '0');
    
    return `${formattedMinutes}:${formattedSeconds}`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = 'assets/default-avatar.png';
    }
  }
}
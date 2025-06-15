// src/app/pages/songs/songs.page.ts - ACTUALIZADO
import { Component, OnInit, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { AlertController, LoadingController, ModalController, Platform, ToastController } from '@ionic/angular';
import { SongsService } from '../../core/services/impl/songs.service';
import { Song } from '../../core/models/song.model';
import { Paginated } from '../../core/models/paginated.model';
import { TranslateService } from '@ngx-translate/core';
import { BaseAuthenticationService } from '../../core/services/impl/base-authentication.service';
import { SongModalComponent } from 'src/app/shared/components/song-modal/song-modal.component';
import { SearchParams } from '../../core/repositories/intefaces/base-repository.interface';
import { ArtistsService } from 'src/app/core/services/impl/artists.service';
// ✅ NUEVO IMPORT
import { AudioPlayerService } from '../../core/services/impl/audio-player.service';

interface SongWithArtists extends Song {
  artistNames?: string[];
}

@Component({
  selector: 'app-songs',
  templateUrl: './songs.page.html',
  styleUrls: ['./songs.page.scss'],
})
export class SongsPage implements OnInit, OnDestroy {
  private _songs: BehaviorSubject<SongWithArtists[]> = new BehaviorSubject<SongWithArtists[]>([]);
  songs$: Observable<SongWithArtists[]> = this._songs.asObservable();
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  isWeb: boolean = false;
  page: number = 1;
  pageSize: number = 25;
  pages: number = 0;
  currentSearchTerm: string = '';
  
  // ✅ NUEVO: Para el reproductor
  allSongs: SongWithArtists[] = [];
  currentPlayingSong: string | null = null;

  constructor(
    private songsSvc: SongsService,
    private artistsSvc: ArtistsService,
    private modalCtrl: ModalController,
    private translate: TranslateService,
    private alertCtrl: AlertController,
    private platform: Platform,
    private authSvc: BaseAuthenticationService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    // ✅ NUEVO SERVICIO
    private audioPlayerService: AudioPlayerService
  ) {
    this.isWeb = this.platform.is('desktop');
  }

  ngOnInit() {
    this.loadSongs();
    this.setupSearch();
    this.subscribeToPlayerState(); // ✅ NUEVO
    
    // Suscribirse a cambios en la lista de canciones
    this.songs$.pipe(takeUntil(this.destroy$)).subscribe(songs => {
      this.allSongs = songs;
    });
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
        this.currentPlayingSong = state.currentSong?.id || null;
      });
  }

  // ✅ NUEVO: Verificar si una canción se está reproduciendo
  isCurrentlyPlaying(song: Song): boolean {
    return this.currentPlayingSong === song.id;
  }

  private setupSearch() {
    this.searchSubject.pipe(
      takeUntil(this.destroy$),
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(term => {
      this.currentSearchTerm = term;
      this.loadSongs(true);
    });
  }

  onSearchChange(event: any) {
    const searchTerm = event.detail.value?.trim() ?? '';
    this.searchSubject.next(searchTerm);
  }

  private createSearchFilters(): SearchParams {
    const filters: SearchParams = {};
    if (this.currentSearchTerm) {
      filters['name'] = this.currentSearchTerm;
    }
    return filters;
  }

  private async enrichSongWithArtists(songs: Song[]): Promise<SongWithArtists[]> {
    const enrichedSongs: SongWithArtists[] = [];
    
    for (const song of songs) {
      if (song.artists_IDS && song.artists_IDS.length > 0) {
        try {
          const artists = await this.artistsSvc.getByIds(song.artists_IDS).toPromise();
          if (artists) {
            const enrichedSong: SongWithArtists = {
              ...song,
              artistNames: artists.map(artist => artist.name)
            };
            enrichedSongs.push(enrichedSong);
          }
        } catch (error) {
          console.error('Error loading artists for song:', song.id, error);
          enrichedSongs.push({ ...song, artistNames: [] });
        }
      } else {
        enrichedSongs.push({ ...song, artistNames: [] });
      }
    }
    
    return enrichedSongs;
  }

  loadSongs(isSearch: boolean = false) {
    if (isSearch) {
      this.page = 1;
      this._songs.next([]); 
    }

    const filters = this.createSearchFilters();

    this.songsSvc.getAll(this.page, this.pageSize, filters).pipe(
      switchMap(async (paginatedResponse: Paginated<Song>) => {
        const enrichedSongs = await this.enrichSongWithArtists(paginatedResponse.data);
        return {
          data: enrichedSongs,
          pages: paginatedResponse.pages
        };
      })
    ).subscribe({
      next: (result) => {
        if (isSearch || this.page === 1) {
          this._songs.next([...result.data]);
        } else {
          this._songs.next([...this._songs.value, ...result.data]);
        }
        this.page++;
        this.pages = result.pages;
      },
      error: (error) => {
        console.error('Error loading songs:', error);
      }
    });
  }

  // ✅ NUEVOS MÉTODOS PARA REPRODUCCIÓN
  async playAllSongs() {
    if (this.allSongs.length === 0) return;
    
    this.audioPlayerService.setQueue(this.allSongs, 0);
    await this.audioPlayerService.play(this.allSongs[0]);
    
    const toast = await this.toastCtrl.create({
      message: `Reproduciendo ${this.allSongs.length} canciones`,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  async shuffleAndPlay() {
    if (this.allSongs.length === 0) return;
    
    const shuffledSongs = [...this.allSongs];
    for (let i = shuffledSongs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledSongs[i], shuffledSongs[j]] = [shuffledSongs[j], shuffledSongs[i]];
    }
    
    this.audioPlayerService.setQueue(shuffledSongs, 0);
    await this.audioPlayerService.play(shuffledSongs[0]);
    
    const toast = await this.toastCtrl.create({
      message: 'Reproducción aleatoria activada',
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  async playSpecificSong(song: SongWithArtists, index: number) {
    this.audioPlayerService.setQueue(this.allSongs, index);
    await this.audioPlayerService.play(song);
  }

  async onAddSong() {
    const modal = await this.modalCtrl.create({
      component: SongModalComponent,
      componentProps: {},
      cssClass: 'custom-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.role === 'create') {
        this.songsSvc.add(result.data).subscribe({
          next: () => this.loadSongs(true),
          error: console.error
        });
      }
    });

    await modal.present();
  }

  async onUpdateSong(song: Song) {
    const modal = await this.modalCtrl.create({
      component: SongModalComponent,
      componentProps: {
        song: song
      },
      cssClass: 'custom-modal'
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.role === 'update') {
        try {
          // ✅ CAMBIAR ESTA LÍNEA:
          // this.songsSvc.updateSongs(song.id, { data: result.data }).subscribe({
          
          // ✅ POR ESTA:
          await this.songsSvc.updateSongWithImage(song.id, result.data);
          
          // Recargar canciones
          this.loadSongs(true);
          
          // Mostrar mensaje de éxito
          const toast = await this.toastCtrl.create({
            message: 'Canción actualizada correctamente',
            duration: 2000,
            position: 'bottom',
            color: 'success'
          });
          await toast.present();
          
        } catch (error) {
          console.error('Error al actualizar canción:', error);
          
          // Mostrar mensaje de error
          let errorMessage = 'Error desconocido';
          if (error && typeof error === 'object' && 'message' in error) {
            errorMessage = (error as any).message;
          }
          const toast = await this.toastCtrl.create({
            message: 'Error al actualizar la canción: ' + errorMessage,
            duration: 3000,
            position: 'bottom',
            color: 'danger'
          });
          await toast.present();
        }
      }
    });

    await modal.present();
  }

  async onDeleteSong(song: Song) {
    const alert = await this.alertCtrl.create({
      header: await this.translate.get('SONG.MESSAGES.DELETE_CONFIRM').toPromise(),
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'OK',
          role: 'confirm',
          handler: () => {
            this.songsSvc.delete(song.id).subscribe({
              next: () => this.loadSongs(true),
              error: console.error
            });
          }
        }
      ]
    });

    await alert.present();
  }

  onIonInfinite(ev: any) {
    if (this.page <= this.pages) {
      this.songsSvc.getAll(this.page, this.pageSize).subscribe({
        next: (response: Paginated<Song>) => {
          this._songs.next([...this._songs.value, ...response.data]);
          this.page++;
          ev.target.complete();
        },
        error: (error) => {
          console.error('Error loading more songs:', error);
          ev.target.complete();
        }
      });
    } else {
      ev.target.complete();
    }
  }

  // ✅ ACTUALIZADO: Método de reproducción mejorado
  onPlaySong(song: Song) {
    const songIndex = this.allSongs.findIndex(s => s.id === song.id);
    if (songIndex !== -1) {
      this.playSpecificSong(song as SongWithArtists, songIndex);
    }
  }

  async onSongReorder(event: {item: any, targetIndex: number, sourceIndex: number}) {
    const songs = [...this._songs.value];
    
    if (event.sourceIndex === event.targetIndex) return;
    
    const movedSong = songs[event.sourceIndex];
    songs.splice(event.sourceIndex, 1);
    songs.splice(event.targetIndex, 0, movedSong);
    
    this._songs.next([...songs]);
    
    const toast = await this.toastCtrl.create({
      message: await this.translate.get('SONG.REORDERING').toPromise() || 'Reordenando canciones...',
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }
}
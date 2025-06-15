// src/app/pages/home/home.page.ts - CON BÚSQUEDA EN TIEMPO REAL

import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, forkJoin, map, Observable, of, Subject, combineLatest, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { Playlist } from 'src/app/core/models/playlist.model';
import { User } from 'src/app/core/models/user.model';
import { Song } from 'src/app/core/models/song.model';
import { Artist } from 'src/app/core/models/artist.model';
import { BaseAuthenticationService } from 'src/app/core/services/impl/base-authentication.service';
import { PlaylistsService } from 'src/app/core/services/impl/playlists.service';
import { SongsService } from 'src/app/core/services/impl/songs.service';
import { filter, take, takeUntil, tap, distinctUntilChanged as distinctUntilChangedOperator } from 'rxjs/operators';
import { LanguageService } from '../../core/services/language.service';
import { UserService } from 'src/app/core/services/impl/user.service';
import { ArtistsService } from 'src/app/core/services/impl/artists.service';
import { SongEnrichmentService, EnrichedSong } from 'src/app/core/services/impl/song-enrichment.service';
import { ICollectionSubscription } from 'src/app/core/services/interfaces/collection-subscription.interface';
import { COLLECTION_SUBSCRIPTION_TOKEN } from 'src/app/core/repositories/repository.tokens';
import { EnhancedAudioPlayerService } from 'src/app/core/services/impl/enhanced-audio-player.service';
import { ToastController } from '@ionic/angular';
import { SocialService } from 'src/app/core/services/impl/social.service';

// Interfaces para búsqueda
interface ReactiveEnrichedSong extends EnrichedSong {
  isLikedByCurrentUser: boolean;
}

interface SearchResult {
  songs: ReactiveEnrichedSong[];
  playlists: Playlist[];
  artists: Artist[];
}

interface SearchSuggestion {
  type: 'song' | 'playlist' | 'artist';
  id: string;
  name: string;
  subtitle?: string;
  image?: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit, OnDestroy {
  isMobile: boolean = false;
  showSearch: boolean = false;
  currentLang: string;
  selectedTab: 'all' | 'music' | 'podcasts' = 'all';
  searchQuery: string = '';
  mobileSearchOpen = false;

  // ================================================================
  // PROPIEDADES DE BÚSQUEDA
  // ================================================================
  private searchSubject = new Subject<string>();
  isSearching = false;
  showSearchResults = false;
  searchSuggestions: SearchSuggestion[] = [];
  searchResults: SearchResult = {
    songs: [],
    playlists: [],
    artists: []
  };

  // ================================================================
  // PROPIEDADES EXISTENTES
  // ================================================================
  private _quickAccess = new BehaviorSubject<Playlist[]>([]);
  quickAccess$ = this._quickAccess.asObservable();

  private _baseNewReleases = new BehaviorSubject<EnrichedSong[]>([]);
  private _baseRecommendedSongs = new BehaviorSubject<EnrichedSong[]>([]);

  newReleases$!: Observable<ReactiveEnrichedSong[]>;
  recommendedSongs$!: Observable<ReactiveEnrichedSong[]>;

  private _currentUser = new BehaviorSubject<User | null>(null);
  currentUser$ = this._currentUser.asObservable();

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    public authSvc: BaseAuthenticationService,
    private playlistsSvc: PlaylistsService,
    private songsSvc: SongsService,
    private artistsSvc: ArtistsService,
    private songEnrichmentService: SongEnrichmentService,
    private languageService: LanguageService,
    private userService: UserService,
    private enhancedAudioPlayer: EnhancedAudioPlayerService,
    private toastController: ToastController,
    private socialService: SocialService,
    
    @Inject(COLLECTION_SUBSCRIPTION_TOKEN) 
    private collectionSubscriptionSvc: ICollectionSubscription<Playlist> & ICollectionSubscription<Song>
  ) {
    this.currentLang = this.languageService.getStoredLanguage();
    this.setupReactiveObservables();
    this.setupSearchObservables();
  }

  // ================================================================
  // CONFIGURACIÓN DE OBSERVABLES
  // ================================================================

  private setupReactiveObservables() {
    this.newReleases$ = combineLatest([
      this._baseNewReleases.asObservable(),
      this.socialService.likedSongs$
    ]).pipe(
      map(([songs, likedSongs]) => {
        return songs.map(song => ({
          ...song,
          isLikedByCurrentUser: likedSongs.has(song.id)
        })) as ReactiveEnrichedSong[];
      }),
      distinctUntilChangedOperator((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      takeUntil(this.destroy$)
    );

    this.recommendedSongs$ = combineLatest([
      this._baseRecommendedSongs.asObservable(),
      this.socialService.likedSongs$
    ]).pipe(
      map(([songs, likedSongs]) => {
        return songs.map(song => ({
          ...song,
          isLikedByCurrentUser: likedSongs.has(song.id)
        })) as ReactiveEnrichedSong[];
      }),
      distinctUntilChangedOperator((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      takeUntil(this.destroy$)
    );
  }

  // ================================================================
  // ✅ NUEVA FUNCIONALIDAD DE BÚSQUEDA
  // ================================================================

  /**
   * Configurar observables de búsqueda en tiempo real
   */
  private setupSearchObservables() {
    this.searchSubject.pipe(
      debounceTime(300), // Esperar 300ms después de que el usuario deje de escribir
      distinctUntilChanged(), // Solo procesar si el término cambió
      tap(term => {
        this.isSearching = !!term;
        this.showSearchResults = !!term;
        
        if (!term) {
          this.clearSearchResults();
        }
      }),
      switchMap(term => {
        if (!term || term.length < 2) {
          return of(null);
        }
        
        // Realizar búsqueda en paralelo
        return this.performSearch(term);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (results) => {
        this.isSearching = false;
        if (results) {
          this.searchResults = results;
          this.generateSearchSuggestions(results);
        }
      },
      error: (error) => {
        console.error('Search error:', error);
        this.isSearching = false;
        this.clearSearchResults();
      }
    });
  }

  /**
   * Realizar búsqueda en tiempo real
   */
  private performSearch(term: string): Observable<SearchResult> {
    const searchTerm = term.toLowerCase().trim();
    
    return forkJoin({
      songs: this.searchSongs(searchTerm),
      playlists: this.searchPlaylists(searchTerm),
      artists: this.searchArtists(searchTerm)
    }).pipe(
      map(({ songs, playlists, artists }) => ({
        songs,
        playlists,
        artists
      })),
      catchError(error => {
        console.error('Search error:', error);
        return of({
          songs: [],
          playlists: [],
          artists: []
        });
      })
    );
  }

  /**
   * Buscar canciones
   */
  private searchSongs(term: string): Observable<ReactiveEnrichedSong[]> {
    return this.songsSvc.getAll(1, 10, { name: term }).pipe(
      map(response => Array.isArray(response) ? response : response.data),
      switchMap(songs => this.songEnrichmentService.enrichSongs(songs)),
      switchMap(enrichedSongs => {
        // Combinar con likes del usuario
        return this.socialService.likedSongs$.pipe(
          take(1),
          map(likedSongs => 
            enrichedSongs.map(song => ({
              ...song,
              isLikedByCurrentUser: likedSongs.has(song.id)
            })) as ReactiveEnrichedSong[]
          )
        );
      }),
      catchError(error => {
        console.error('Error searching songs:', error);
        return of([]);
      })
    );
  }

  /**
   * Buscar playlists
   */
  private searchPlaylists(term: string): Observable<Playlist[]> {
    return this.playlistsSvc.getAll(1, 10, { name: term }).pipe(
      map(response => Array.isArray(response) ? response : response.data),
      catchError(error => {
        console.error('Error searching playlists:', error);
        return of([]);
      })
    );
  }

  /**
   * Buscar artistas
   */
  private searchArtists(term: string): Observable<Artist[]> {
    return this.artistsSvc.getAll(1, 10, { name: term }).pipe(
      map(response => Array.isArray(response) ? response : response.data),
      catchError(error => {
        console.error('Error searching artists:', error);
        return of([]);
      })
    );
  }

  /**
   * Generar sugerencias de búsqueda
   */
  private generateSearchSuggestions(results: SearchResult) {
    const suggestions: SearchSuggestion[] = [];

    // Agregar canciones a las sugerencias
    results.songs.slice(0, 3).forEach(song => {
      suggestions.push({
        type: 'song',
        id: song.id,
        name: song.name,
        subtitle: song.artistNames?.join(', ') || 'Unknown Artist',
        image: song.image?.url
      });
    });

    // Agregar playlists a las sugerencias
    results.playlists.slice(0, 2).forEach(playlist => {
      suggestions.push({
        type: 'playlist',
        id: playlist.id,
        name: playlist.name,
        subtitle: `Playlist • ${playlist.author || 'Unknown'}`,
        image: playlist.image?.url
      });
    });

    // Agregar artistas a las sugerencias
    results.artists.slice(0, 2).forEach(artist => {
      suggestions.push({
        type: 'artist',
        id: artist.id,
        name: artist.name,
        subtitle: `Artist • ${artist.followers_count || 0} followers`,
        image: artist.image?.url
      });
    });

    this.searchSuggestions = suggestions;
  }

  /**
   * Limpiar resultados de búsqueda
   */
  private clearSearchResults() {
    this.searchResults = {
      songs: [],
      playlists: [],
      artists: []
    };
    this.searchSuggestions = [];
    this.showSearchResults = false;
  }

  // ================================================================
  // EVENTOS DE BÚSQUEDA
  // ================================================================

  /**
   * Manejar cambio en el campo de búsqueda
   */
  onSearchChange(event: CustomEvent) {
    const term = event.detail.value || '';
    this.searchQuery = term;
    this.searchSubject.next(term);
  }

  /**
   * Manejar foco en el campo de búsqueda
   */
  onSearchFocus() {
    if (this.searchQuery && this.searchQuery.length >= 2) {
      this.showSearchResults = true;
    }
  }

  /**
   * Manejar pérdida de foco (con delay para permitir clicks)
   */
  onSearchBlur() {
    setTimeout(() => {
      this.showSearchResults = false;
    }, 200);
  }

  /**
   * Seleccionar una sugerencia
   */
  selectSearchSuggestion(suggestion: SearchSuggestion) {
    this.searchQuery = suggestion.name;
    this.showSearchResults = false;

    switch (suggestion.type) {
      case 'song':
        const song = this.searchResults.songs.find(s => s.id === suggestion.id);
        if (song) {
          this.openSong(song);
        }
        break;
      case 'playlist':
        const playlist = this.searchResults.playlists.find(p => p.id === suggestion.id);
        if (playlist) {
          this.openPlaylist(playlist);
        }
        break;
      case 'artist':
        this.router.navigate(['/artist', suggestion.id]);
        break;
    }
  }

  /**
   * Ir a página de resultados completos
   */
  goToFullSearchResults() {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], { 
        queryParams: { q: this.searchQuery.trim() } 
      });
    }
  }

  /**
   * Limpiar búsqueda
   */
  clearSearch() {
    this.searchQuery = '';
    this.searchSubject.next('');
    this.clearSearchResults();
  }

  // ================================================================
  // MÉTODOS EXISTENTES (sin cambios)
  // ================================================================

  ngOnInit() {
    this.checkIfMobile();
    window.addEventListener('resize', this.checkIfMobile.bind(this));

    this.authSvc.user$.pipe(
        filter(user => user !== undefined),
        switchMap(user => {
            if (!user) return of(null);
            return this.userService.getById(user.id);
        }),
        takeUntil(this.destroy$)
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
            console.error('Error loading user data:', error);
        }
    });
  
    this.authSvc.ready$.pipe(
        filter(ready => ready === true),
        take(1),
        switchMap(() => {
            return this.authSvc.authenticated$;
        }),
        take(1),
        takeUntil(this.destroy$)
    ).subscribe(isAuthenticated => {
        if (!isAuthenticated) {
            this.router.navigate(['/login']);
            return;
        }

        this.loadUserContent();
        this.setupCollectionSubscriptions();
    });
  }

  ngOnDestroy() {
    this.collectionSubscriptionSvc.unsubscribe('playlists');
    this.collectionSubscriptionSvc.unsubscribe('songs');
    
    this.destroy$.next();
    this.destroy$.complete();
    
    window.removeEventListener('resize', this.checkIfMobile.bind(this));
  }

  toggleSearch() {
    this.showSearch = !this.showSearch;
    if (!this.showSearch) {
      this.clearSearch();
    }
  }

  changeLanguage(lang: string) {
    this.languageService.changeLanguage(lang);
    this.currentLang = lang;
    this.languageService.storeLanguage(lang);
  }

  selectTab(tab: 'all' | 'music' | 'podcasts') {
    this.selectedTab = tab;
  }

  openPlaylist(playlist: Playlist) {
    this.router.navigate(['/playlist', playlist.id]);
  }

  async playPlaylist(playlist: Playlist, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    if (!playlist.song_IDS || playlist.song_IDS.length === 0) {
      await this.showToast('La playlist está vacía', 'warning');
      return;
    }

    try {      
      const songs = await this.getPlaylistSongs(playlist.song_IDS);
      if (songs.length > 0) {
        await this.enhancedAudioPlayer.setEnrichedQueue(songs, 0);
        await this.enhancedAudioPlayer.playEnrichedSong(songs[0]);
        await this.showToast(`Reproduciendo: ${playlist.name}`, 'success');
      } else {
        await this.showToast('No se pudieron cargar las canciones', 'danger');
      }
    } catch (error) {
      console.error('Error playing playlist:', error);
      await this.showToast('Error al reproducir la playlist', 'danger');
    }
  }

  async openSong(song: Song | EnrichedSong) {
    try {
      await this.enhancedAudioPlayer.playEnrichedSong(song);
      await this.showToast(`Reproduciendo: ${song.name}`, 'success');
    } catch (error) {
      console.error('Error playing song:', error);
      await this.showToast('Error al reproducir la canción', 'danger');
    }
  }

  private async getPlaylistSongs(songIds: string[]): Promise<Song[]> {
    try {
      const songs: Song[] = [];
      
      for (const songId of songIds) {
        try {
          const song = await this.songsSvc.getById(songId).toPromise();
          if (song) {
            songs.push(song);
          }
        } catch (error) {
          console.error(`Error loading song ${songId}:`, error);
        }
      }
      
      return songs;
    } catch (error) {
      console.error('Error getting playlist songs:', error);
      return [];
    }
  }

  showAllSongs() {
    this.router.navigate(['/songs']);
  }

  showAllRecommended() {
    this.router.navigate(['/recommended']);
  }

  checkIfMobile() {
    this.isMobile = window.innerWidth <= 768;
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }

  private setupCollectionSubscriptions() {
    // Mantener subscripciones existentes...
    this.collectionSubscriptionSvc
      .subscribe('playlists')
      .pipe(takeUntil(this.destroy$))
      .subscribe(change => {
        const currentPlaylists = this._quickAccess.value;
        
        switch (change.type) {
          case 'added':
            if (change.data && !currentPlaylists.some(p => p.id === change.id)) {
              this._quickAccess.next([...currentPlaylists, change.data as Playlist]);
            }
            break;
          case 'modified':
            if (change.data) {
              const index = currentPlaylists.findIndex(p => p.id === change.id);
              if (index !== -1) {
                const updatedPlaylists = [...currentPlaylists];
                updatedPlaylists[index] = change.data as Playlist;
                this._quickAccess.next(updatedPlaylists);
              }
            }
            break;
          case 'removed':
            this._quickAccess.next(currentPlaylists.filter(p => p.id !== change.id));
            break;
        }
      });

    // Resto de subscripciones existentes...
  }
  
  private loadUserContent() {    
    this.authSvc.user$.pipe(
      filter(user => user !== undefined),
      take(1),
      switchMap(user => {
        if (!user) {
          throw new Error('No user found');
        }

        const allSongs$ = this.songsSvc.getAll(1, 1000, { sort: 'createdAt:desc' }).pipe(
          map(response => 'data' in response ? response.data : response),
          switchMap(songs => {
            return this.songEnrichmentService.enrichSongs(songs);
          }),
          catchError(err => {
            return of([]);
          })
        );

        return forkJoin({
          playlists: this.playlistsSvc.getAll(1, 9, { sort: 'createdAt:desc' }).pipe(
            map(response => 'data' in response ? response.data : response),
            catchError(err => {
              return of([]);
            })
          ),
          allSongs: allSongs$
        });
      }),
      map(({ playlists, allSongs }) => {
        const songs = allSongs.slice(0, 8); 
        const recommendedSongs = allSongs.slice(-8); 

        return {
          playlists,
          songs,
          recommendedSongs
        };
      })
    ).subscribe({
      next: ({ playlists, songs, recommendedSongs }) => {
        
        this._quickAccess.next(playlists);
        this._baseNewReleases.next(songs);
        this._baseRecommendedSongs.next(recommendedSongs);
      },
      error: (error) => {
        console.error('HomePage: Error loading content:', error);
      }
    });
  }

  private isSong(data: any): data is Song {
    return data 
      && typeof data === 'object' 
      && 'artists_IDS' in data 
      && 'name' in data 
      && 'duration' in data;
  }

  trackBySongId(index: number, song: ReactiveEnrichedSong): string {
    return song.id;
  }

  /**
   * Obtener imagen por defecto según el tipo
   */
  getDefaultImage(type: 'song' | 'playlist' | 'artist'): string {
    switch (type) {
      case 'song':
        return 'assets/default-song.png';
      case 'playlist':
        return 'assets/default-playlist.png';
      case 'artist':
        return 'assets/default-artist.png';
      default:
        return 'assets/default-song.png';
    }
  }

  goToAbout() {
    this.router.navigate(['/about']);
  }

  openRepository() {
    const url = 'https://github.com/Rafamp34/Proyecto-UMusicWeb';
    window.open(url, '_blank');
  }

  openMobileSearch() {
    this.mobileSearchOpen = true;
  }

  /**
   * Obtener icono según el tipo
   */
  getTypeIcon(type: 'song' | 'playlist' | 'artist'): string {
    switch (type) {
      case 'song':
        return 'musical-note';
      case 'playlist':
        return 'list';
      case 'artist':
        return 'person';
      default:
        return 'musical-note';
    }
  }

  /**
   * Obtener color según el tipo
   */
  getTypeColor(type: 'song' | 'playlist' | 'artist'): string {
    switch (type) {
      case 'song':
        return 'success';
      case 'playlist':
        return 'secondary';
      case 'artist':
        return 'primary';
      default:
        return 'medium';
    }
  }

  /**
   * TrackBy function para sugerencias de búsqueda
   */
  trackBySuggestionId(index: number, suggestion: SearchSuggestion): string {
    return `${suggestion.type}-${suggestion.id}`;
  }

  /**
   * Exponer router para uso en template
   */
  get routerPublic() {
    return this.router;
}
}
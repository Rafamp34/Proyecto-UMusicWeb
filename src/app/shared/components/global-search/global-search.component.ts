import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Renderer2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, of, from } from 'rxjs';
import { SongsService } from '../../../core/services/impl/songs.service';
import { PlaylistsService } from '../../../core/services/impl/playlists.service';
import { ArtistsService } from '../../../core/services/impl/artists.service';
import { SongEnrichmentService } from '../../../core/services/impl/song-enrichment.service';
import { EnhancedAudioPlayerService } from '../../../core/services/impl/enhanced-audio-player.service';
import { Song } from '../../../core/models/song.model';
import { Playlist } from '../../../core/models/playlist.model';
import { Artist } from '../../../core/models/artist.model';

interface SearchResult {
    type: 'song' | 'playlist' | 'artist' | 'recent';
    id: string;
    title: string;
    subtitle: string;
    image: string;
    data: any;
}

@Component({
    selector: 'app-global-search',
    templateUrl: './global-search.component.html',
    styleUrls: ['./global-search.component.scss']
})
export class GlobalSearchComponent implements OnInit, OnDestroy {
    @ViewChild('searchInput', { static: false }) searchInput!: ElementRef;

    searchQuery = '';
    isSearchActive = false;
    isSearching = false;
    searchResults: SearchResult[] = [];
    recentSearches: SearchResult[] = [];
    
    // Cache para evitar múltiples llamadas
    private allSongs: any[] = [];
    private allPlaylists: Playlist[] = [];
    private allArtists: Artist[] = [];
    private cacheLoaded = false;
    
    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();
    private overlayElement: HTMLElement | null = null;

    constructor(
        private router: Router,
        private renderer: Renderer2,
        @Inject(DOCUMENT) private document: Document,
        private songsService: SongsService,
        private playlistsService: PlaylistsService,
        private artistsService: ArtistsService,
        private songEnrichmentService: SongEnrichmentService,
        private enhancedAudioPlayer: EnhancedAudioPlayerService // Inyectar el reproductor
    ) {}

    ngOnInit() {
        this.loadRecentSearches();
        this.setupSearchObservable();
        this.preloadData();
    }

    ngOnDestroy() {
        this.removeOverlay();
        this.destroy$.next();
        this.destroy$.complete();
    }

    // Precargar datos una sola vez
    private async preloadData() {
        try {            
            const [songsResponse, playlistsResponse, artistsResponse] = await Promise.all([
                this.songsService.getAll(1, 200, {}).toPromise().catch(() => ({ data: [] })),
                this.playlistsService.getAll(1, 100, {}).toPromise().catch(() => ({ data: [] })),
                this.artistsService.getAll(1, 100, {}).toPromise().catch(() => ({ data: [] }))
            ]);

            this.allSongs = Array.isArray(songsResponse) ? songsResponse : (songsResponse?.data || []);
            this.allPlaylists = Array.isArray(playlistsResponse) ? playlistsResponse : (playlistsResponse?.data || []);
            this.allArtists = Array.isArray(artistsResponse) ? artistsResponse : (artistsResponse?.data || []);

            this.allSongs = await this.songEnrichmentService.enrichSongsAsync(this.allSongs);

            this.cacheLoaded = true;
        } catch (error) {
            console.error('❌ Error preloading data:', error);
            this.cacheLoaded = true;
        }
    }

    private setupSearchObservable() {
        this.searchSubject.pipe(
            debounceTime(200),
            distinctUntilChanged(),
            switchMap(query => {
                if (!query || query.length < 2) {
                    this.searchResults = [];
                    this.isSearching = false;
                    return of(null);
                }

                this.isSearching = true;
                return from(this.performSearch(query));
            }),
            takeUntil(this.destroy$)
        ).subscribe({
            next: (results) => {
                this.isSearching = false;
                if (results) {
                    this.searchResults = results;
                }
                this.updateOverlayContent();
            },
            error: (error) => {
                console.error('Search error:', error);
                this.isSearching = false;
                this.searchResults = [];
                this.updateOverlayContent();
            }
        });
    }

    private async performSearch(query: string): Promise<SearchResult[]> {
        
        if (!this.cacheLoaded) {
            await this.waitForCache();
        }
        
        try {
            const [songs, playlists, artists] = await Promise.all([
                this.searchSongsLocal(query),
                this.searchPlaylistsLocal(query),
                this.searchArtistsLocal(query)
            ]);

            const results: SearchResult[] = [];

            // Agregar artistas primero
            artists.slice(0, 4).forEach(artist => {
                results.push({
                    type: 'artist',
                    id: artist.id,
                    title: artist.name,
                    subtitle: `Artista • ${artist.followers_count || 0} seguidores`,
                    image: artist.image?.url || 'assets/default-artist.png',
                    data: artist
                });
            });

            // Agregar canciones
            songs.slice(0, 4).forEach(song => {
                results.push({
                    type: 'song',
                    id: song.id,
                    title: song.name,
                    subtitle: song.artistNames?.join(', ') || 'Unknown Artist',
                    image: song.image?.url || 'assets/default-song.png',
                    data: song
                });
            });

            // Agregar playlists
            playlists.slice(0, 2).forEach(playlist => {
                results.push({
                    type: 'playlist',
                    id: playlist.id,
                    title: playlist.name,
                    subtitle: `Playlist • ${playlist.author || 'Unknown'}`,
                    image: playlist.image?.url || 'assets/default-playlist.png',
                    data: playlist
                });
            });

            return results;
        } catch (error) {
            console.error('❌ Error performing search:', error);
            return [];
        }
    }

    private async searchSongsLocal(query: string): Promise<any[]> {
        const lowerQuery = query.toLowerCase().trim();
        
        const filteredSongs = this.allSongs.filter(song => {
            if (song.name && song.name.toLowerCase().includes(lowerQuery)) {
                return true;
            }
            
            if (song.artistNames && Array.isArray(song.artistNames)) {
                return song.artistNames.some((artistName: string) => 
                    artistName.toLowerCase().includes(lowerQuery)
                );
            }
            
            if (song.album && song.album.toLowerCase().includes(lowerQuery)) {
                return true;
            }
            
            return false;
        });

        return filteredSongs;
    }

    private async searchPlaylistsLocal(query: string): Promise<Playlist[]> {
        const lowerQuery = query.toLowerCase().trim();
        
        const filteredPlaylists = this.allPlaylists.filter(playlist => {
            if (playlist.name && playlist.name.toLowerCase().includes(lowerQuery)) {
                return true;
            }
            
            if (playlist.author && playlist.author.toLowerCase().includes(lowerQuery)) {
                return true;
            }
            
            return false;
        });

        return filteredPlaylists;
    }

    private async searchArtistsLocal(query: string): Promise<Artist[]> {
        const lowerQuery = query.toLowerCase().trim();
        
        const filteredArtists = this.allArtists.filter(artist => {
            if (artist.name && artist.name.toLowerCase().includes(lowerQuery)) {
                return true;
            }
            
            return false;
        });

        return filteredArtists;
    }

    private async waitForCache(): Promise<void> {
        const maxWait = 10000;
        const checkInterval = 100;
        let waited = 0;

        while (!this.cacheLoaded && waited < maxWait) {
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            waited += checkInterval;
        }

        if (!this.cacheLoaded) {
            console.warn('⚠️ Cache loading timeout, proceeding anyway');
        }
    }

    // CREAR OVERLAY SIN BLUR
    private createOverlay() {
        if (this.overlayElement) return;

        this.overlayElement = this.renderer.createElement('div');
        this.renderer.addClass(this.overlayElement, 'global-search-overlay-portal');
        this.renderer.setStyle(this.overlayElement, 'position', 'fixed');
        this.renderer.setStyle(this.overlayElement, 'top', '0');
        this.renderer.setStyle(this.overlayElement, 'left', '0');
        this.renderer.setStyle(this.overlayElement, 'right', '0');
        this.renderer.setStyle(this.overlayElement, 'bottom', '0');
        this.renderer.setStyle(this.overlayElement, 'z-index', '10000');
        // SIN BLUR - Solo fondo semitransparente
        this.renderer.setStyle(this.overlayElement, 'background', 'rgba(0, 0, 0, 0.6)');
        // Removido backdrop-filter

        const panel = this.renderer.createElement('div');
        this.renderer.addClass(panel, 'search-results-panel-portal');
        this.renderer.setStyle(panel, 'position', 'absolute');
        this.renderer.setStyle(panel, 'top', '80px');
        this.renderer.setStyle(panel, 'left', '50%');
        this.renderer.setStyle(panel, 'transform', 'translateX(-50%)');
        this.renderer.setStyle(panel, 'width', '90%');
        this.renderer.setStyle(panel, 'max-width', '480px');
        this.renderer.setStyle(panel, 'background', '#282828');
        this.renderer.setStyle(panel, 'border-radius', '8px');
        this.renderer.setStyle(panel, 'box-shadow', '0 16px 40px rgba(0, 0, 0, 0.6)');
        this.renderer.setStyle(panel, 'max-height', '70vh');
        this.renderer.setStyle(panel, 'overflow-y', 'auto');

        this.updatePanelContent(panel);

        this.renderer.listen(this.overlayElement, 'click', (event) => {
            if (event.target === this.overlayElement) {
                this.deactivateSearch();
            }
        });

        this.renderer.appendChild(this.overlayElement, panel);
        this.renderer.appendChild(this.document.body, this.overlayElement);
    }

    private updateOverlayContent() {
        if (this.overlayElement) {
            const panel = this.overlayElement.querySelector('.search-results-panel-portal') as HTMLElement;
            if (panel) {
                this.updatePanelContent(panel);
            }
        }
    }

    private updatePanelContent(panel: HTMLElement) {
        panel.innerHTML = '';

        if (!this.searchQuery && this.recentSearches.length > 0) {
            this.addRecentSearches(panel);
        } else if (this.isSearching) {
            this.addLoadingState(panel);
        } else if (this.searchQuery && this.searchResults.length > 0) {
            this.addSearchResults(panel);
        } else if (this.searchQuery && this.searchResults.length === 0) {
            this.addNoResults(panel);
        } else {
            this.addSearchTips(panel);
        }
    }

    private addRecentSearches(panel: HTMLElement) {
        const header = this.renderer.createElement('div');
        header.innerHTML = '<h3 style="color: white; font-size: 16px; font-weight: 700; margin: 0; padding: 16px;">Búsquedas recientes</h3>';
        this.renderer.appendChild(panel, header);

        this.recentSearches.forEach(recent => {
            // Restaurar el tipo original para que funcione correctamente
            const originalResult = { ...recent, type: recent.data?.type || recent.type };
            // Si el tipo es 'recent', usar el tipo del data
            if (recent.type === 'recent' && recent.data) {
                if (recent.data.name && recent.data.artistNames) {
                    originalResult.type = 'song';
                } else if (recent.data.name && recent.data.author) {
                    originalResult.type = 'playlist';
                } else if (recent.data.name && !recent.data.author) {
                    originalResult.type = 'artist';
                }
            }
            
            const item = this.createResultItem(originalResult);
            this.renderer.appendChild(panel, item);
        });
    }

    private addSearchResults(panel: HTMLElement) {
        const header = this.renderer.createElement('div');
        header.innerHTML = '<h3 style="color: white; font-size: 16px; font-weight: 700; margin: 0; padding: 16px;">Resultados principales</h3>';
        this.renderer.appendChild(panel, header);

        this.searchResults.forEach(result => {
            const item = this.createResultItem(result);
            this.renderer.appendChild(panel, item);
        });

        // COMENTAR EL BOTÓN "VER TODOS" SI NO TIENES LA RUTA /search
        /*
        const viewAllButton = this.renderer.createElement('div');
        this.renderer.setStyle(viewAllButton, 'display', 'flex');
        this.renderer.setStyle(viewAllButton, 'align-items', 'center');
        this.renderer.setStyle(viewAllButton, 'padding', '12px 16px');
        this.renderer.setStyle(viewAllButton, 'border-top', '1px solid rgba(255, 255, 255, 0.1)');
        this.renderer.setStyle(viewAllButton, 'cursor', 'pointer');
        this.renderer.setStyle(viewAllButton, 'color', '#1db954');
        this.renderer.setStyle(viewAllButton, 'font-size', '14px');
        this.renderer.setStyle(viewAllButton, 'font-weight', '600');

        viewAllButton.innerHTML = `
            <span style="margin-right: 8px;">🔍</span>
            <span style="flex: 1;">Ver todos los resultados para "${this.searchQuery}"</span>
            <span>→</span>
        `;

        this.renderer.listen(viewAllButton, 'click', () => {
            this.goToFullSearch();
        });

        this.renderer.appendChild(panel, viewAllButton);
        */
    }

    private createResultItem(result: SearchResult): HTMLElement {
        const item = this.renderer.createElement('div');
        this.renderer.setStyle(item, 'display', 'flex');
        this.renderer.setStyle(item, 'align-items', 'center');
        this.renderer.setStyle(item, 'padding', '8px 16px');
        this.renderer.setStyle(item, 'cursor', 'pointer');
        this.renderer.setStyle(item, 'transition', 'background 0.2s ease');

        const typeEmoji = this.getTypeEmoji(result.type);
        
        item.innerHTML = `
            <div style="width: 48px; height: 48px; margin-right: 12px; border-radius: 4px; overflow: hidden;">
                <img src="${result.image}" alt="${result.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='assets/default-song.png'">
            </div>
            <div style="flex: 1; min-width: 0;">
                <div style="color: white; font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${result.title}</div>
                <div style="color: #b3b3b3; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${result.subtitle}</div>
            </div>
            <div style="margin-left: 8px; font-size: 18px;">${typeEmoji}</div>
        `;

        this.renderer.listen(item, 'mouseenter', () => {
            this.renderer.setStyle(item, 'background', 'rgba(255, 255, 255, 0.1)');
        });

        this.renderer.listen(item, 'mouseleave', () => {
            this.renderer.setStyle(item, 'background', 'transparent');
        });

        this.renderer.listen(item, 'click', () => {
            this.selectResult(result);
        });

        return item;
    }

    private getTypeEmoji(type: string): string {
        switch (type) {
            case 'song': return '🎵';
            case 'playlist': return '📝';
            case 'artist': return '👤';
            case 'recent': return '🕒';
            default: return '🔍';
        }
    }

    // FUNCIÓN AUXILIAR PARA DETECTAR TIPO DE BÚSQUEDA RECIENTE
    private getRecentItemType(item: any): 'song' | 'playlist' | 'artist' {
        // Si tiene originalType, usarlo
        if (item.originalType) {
            return item.originalType;
        }
        
        // Si no, detectar por las propiedades del data
        if (item.data) {
            if (item.data.artistNames || (item.data.name && item.data.duration)) {
                return 'song';
            } else if (item.data.author !== undefined) {
                return 'playlist';
            } else {
                return 'artist';
            }
        }
        
        // Fallback
        return item.type === 'recent' ? 'song' : item.type;
    }

    private addLoadingState(panel: HTMLElement) {
        panel.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; padding: 32px; color: #b3b3b3;">
                <div style="margin-bottom: 12px; font-size: 24px;">⏳</div>
                <span style="font-size: 14px;">Buscando...</span>
            </div>
        `;
    }

    private addNoResults(panel: HTMLElement) {
        panel.innerHTML = `
            <div style="text-align: center; padding: 32px;">
                <div style="font-size: 48px; color: #b3b3b3; margin-bottom: 16px;">😔</div>
                <h3 style="color: white; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">No hay resultados para "${this.searchQuery}"</h3>
                <p style="color: #b3b3b3; font-size: 14px; margin: 0;">Intenta con otros términos de búsqueda.</p>
            </div>
        `;
    }

    private addSearchTips(panel: HTMLElement) {
        panel.innerHTML = `
            <div style="text-align: center; padding: 32px;">
                <div style="font-size: 48px; color: #b3b3b3; margin-bottom: 16px;">🔍</div>
                <h3 style="color: white; font-size: 18px; font-weight: 700; margin: 0 0 8px 0;">Comienza a escribir para buscar</h3>
                <p style="color: #b3b3b3; font-size: 14px; margin: 0;">Encuentra canciones, artistas y playlists</p>
            </div>
        `;
    }

    private removeOverlay() {
        if (this.overlayElement) {
            this.renderer.removeChild(this.document.body, this.overlayElement);
            this.overlayElement = null;
        }
    }

    activateSearch() {
        this.isSearchActive = true;
        this.createOverlay();
        setTimeout(() => {
            if (this.searchInput) {
                this.searchInput.nativeElement.focus();
            }
        }, 100);
    }

    deactivateSearch() {
        setTimeout(() => {
            this.isSearchActive = false;
            this.searchQuery = '';
            this.searchResults = [];
            this.removeOverlay();
        }, 200);
    }

    onSearchChange(event: any) {
        const query = event.target.value;
        this.searchQuery = query;
        this.searchSubject.next(query);
    }

    // MEJORAR LA SELECCIÓN DE RESULTADOS
    selectResult(result: SearchResult) {
        this.saveToRecentSearches(result);
        
        switch (result.type) {
            case 'song':
                this.playSong(result.data);
                break;
            case 'playlist':
                this.router.navigate(['/playlist', result.id]);
                break;
            case 'artist':
                this.router.navigate(['/artist', result.id]);
                break;
        }
        
        this.deactivateSearch();
    }

    // IMPLEMENTAR REPRODUCCIÓN DE CANCIONES
    private async playSong(song: any) {
        try {
            
            // Usar el servicio de audio mejorado
            await this.enhancedAudioPlayer.playEnrichedSong(song);
            
            
        } catch (error) {
            console.error('❌ Error playing song:', error);
            
        }
    }

    private saveToRecentSearches(result: SearchResult) {
        // GUARDAR CON EL TIPO ORIGINAL, NO COMO 'recent'
        const recent = { 
            ...result, 
            // Mantener el tipo original para que funcione al hacer click
            originalType: result.type, 
            // Guardar toda la información necesaria
            data: result.data
        };
        
        this.recentSearches = this.recentSearches.filter(r => r.id !== result.id);
        this.recentSearches.unshift(recent);
        this.recentSearches = this.recentSearches.slice(0, 6);
        localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
    }

    private loadRecentSearches() {
        try {
            const saved = localStorage.getItem('recentSearches');
            if (saved) {
                this.recentSearches = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading recent searches:', error);
            this.recentSearches = [];
        }
    }

    clearRecentSearches() {
        this.recentSearches = [];
        localStorage.removeItem('recentSearches');
        this.updateOverlayContent();
    }

    goToFullSearch() {
        if (this.searchQuery.trim()) {
            this.router.navigate(['/search'], { 
                queryParams: { q: this.searchQuery.trim() } 
            });
            this.deactivateSearch();
        }
    }
}
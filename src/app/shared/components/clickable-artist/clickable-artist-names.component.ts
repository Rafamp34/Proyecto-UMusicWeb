// src/app/shared/components/clickable-artist/clickable-artist-names.component.ts - FINAL
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { ArtistsService } from 'src/app/core/services/impl/artists.service';

interface ArtistData {
  name: string;
  id?: string;
}

@Component({
  selector: 'app-clickable-artist-names',
  templateUrl: './clickable-artist-names.component.html',
  styleUrls: ['./clickable-artist-names.component.scss']
})
export class ClickableArtistNamesComponent implements OnChanges {
  @Input() artistNames: string[] = [];
  @Input() artistIds: string[] = []; // ✅ OPCIONAL: IDs si los tienes
  @Input() maxArtists: number = 0;
  @Input() showCount: boolean = false;
  @Input() searchEnabled: boolean = true;
  
  @Output() artistClicked = new EventEmitter<{ name: string; id?: string }>();

  artistsData: ArtistData[] = [];

  constructor(
    private router: Router,
    private artistsService: ArtistsService
  ) {}

  ngOnChanges() {
    this.buildArtistsData();
  }

  private buildArtistsData() {
    this.artistsData = this.artistNames.map((name, index) => ({
      name,
      id: this.artistIds && this.artistIds[index] ? this.artistIds[index] : undefined
    }));
  }

  get displayArtists(): ArtistData[] {
    if (this.maxArtists <= 0) {
      return this.artistsData;
    }
    return this.artistsData.slice(0, this.maxArtists);
  }

  get remainingCount(): number {
    if (this.maxArtists <= 0) {
      return 0;
    }
    return Math.max(0, this.artistsData.length - this.maxArtists);
  }

  async onArtistClick(artist: ArtistData) {
    // Emitir evento personalizado
    this.artistClicked.emit(artist);
    
    if (!this.searchEnabled) return;

    // ✅ PRIORIDAD 1: Si tenemos ID, navegar directamente
    if (artist.id) {
      this.router.navigate(['/artist', artist.id]);
      return;
    }

    // ✅ PRIORIDAD 2: Buscar artista por nombre
    try {
      const foundArtist = await this.artistsService.findByExactName(artist.name).toPromise();
      if (foundArtist) {
        this.router.navigate(['/artist', foundArtist.id]);
        return;
      }
    } catch (error) {
      console.warn('Error buscando artista:', error);
    }

    // ✅ FALLBACK: Si no se encuentra, ir a búsqueda
    this.router.navigate(['/songs'], { 
      queryParams: { search: artist.name } 
    });
  }
}
// src/app/core/services/impl/artists.service.ts - ACTUALIZADO
import { Injectable, Inject } from '@angular/core';
import { BaseService } from './base-service.service';
import { IArtistsService } from '../interfaces/artists-service.interface';
import { Artist } from '../../models/artist.model';
import { ARTISTS_REPOSITORY_TOKEN } from '../../repositories/repository.tokens';
import { IArtistsRepository } from '../../repositories/intefaces/artists-repository.interface';
import { map, Observable, forkJoin, tap, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ArtistsService extends BaseService<Artist> implements IArtistsService {
  constructor(
    @Inject(ARTISTS_REPOSITORY_TOKEN) repository: IArtistsRepository
  ) {
    super(repository);
  }
  
  getByIds(ids: string[]): Observable<Artist[]> {
    if (!ids || ids.length === 0) {
      return of([]);
    }

    return forkJoin(
      ids.map(id => {
        return this.getById(id).pipe();
      })
    ).pipe(
      map(artists => {
        const validArtists = artists.filter((artist): artist is Artist => artist !== null);
        return validArtists;
      }),
    );
  }

  // ✅ NUEVO MÉTODO: Buscar artistas por nombre
  searchByName(name: string): Observable<Artist[]> {
    if (!name || name.trim().length === 0) {
      return of([]);
    }

    // Opción 1: Si tu BaseService tiene un método search que acepta parámetros
    // return this.search({ name: name.trim() }).pipe(
    //   map(paginated => paginated.data || [])
    // );

    // Opción 2: Si necesitas usar getAll y filtrar (menos eficiente)
    return this.getAll(1, 100).pipe(
      map(paginated => {
        if (!paginated || !paginated.data) {
          return [];
        }
        
        const searchTerm = name.toLowerCase().trim();
        return paginated.data.filter(artist => 
          artist.name.toLowerCase().includes(searchTerm)
        );
      })
    );

    // Opción 3: Si tu repositorio tiene un método específico para buscar por nombre
    // return (this.repository as IArtistsRepository).searchByName(name);
  }

  // ✅ MÉTODO ADICIONAL: Buscar artista exacto por nombre (para navegación directa)
  findByExactName(name: string): Observable<Artist | null> {
    return this.searchByName(name).pipe(
      map(artists => {
        if (!artists || artists.length === 0) {
          return null;
        }
        
        // Buscar coincidencia exacta primero
        const exactMatch = artists.find(artist => 
          artist.name.toLowerCase() === name.toLowerCase()
        );
        
        // Si no hay coincidencia exacta, devolver el primer resultado
        return exactMatch || artists[0];
      })
    );
  }
}
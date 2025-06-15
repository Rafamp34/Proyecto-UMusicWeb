import { Injectable, Inject } from '@angular/core';
import { BaseService } from './base-service.service';
import { ISongsService } from '../interfaces/songs-service.interface';
import { Song } from '../../models/song.model';
import { SONGS_REPOSITORY_TOKEN } from '../../repositories/repository.tokens';
import { ISongsRepository } from '../../repositories/intefaces/songs-repository.interface';
import { map, Observable } from 'rxjs';
import { Paginated } from '../../models/paginated.model';
import { SearchParams } from '../../repositories/intefaces/base-repository.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment.prod';
import { BaseMediaService } from '../impl/base-media.service';

// Interfaz extendida para canciones con nombres de artistas
export interface SongWithArtists extends Song {
  artistNames?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SongsService extends BaseService<Song> implements ISongsService {
  private apiUrl = `${environment.apiUrl}/api/songs`;

  constructor(
    private http: HttpClient,
    @Inject(SONGS_REPOSITORY_TOKEN) repository: ISongsRepository,
    private mediaService: BaseMediaService
  ) {
    super(repository);
  }

  getByPlaylistId(playlistId: string): Observable<Song[] | null> {
    return this.repository.getAll(1, 1000, { playlistId: playlistId }).pipe(
      map(res => Array.isArray(res) ? res : res.data)
    );
  }

  // Método para obtener canciones con nombres de artistas enriquecidos
  getAllWithArtists(page: number = 1, pageSize: number = 25, filters: SearchParams = {}): Observable<SongWithArtists[] | Paginated<SongWithArtists>> {
    return this.getAll(page, pageSize, filters).pipe(
      map((result: Song[] | Paginated<Song>) => {
        if (Array.isArray(result)) {
          return result.map((song: Song) => this.addPlaceholderArtistNames(song));
        } else {
          return {
            ...result,
            data: result.data.map((song: Song) => this.addPlaceholderArtistNames(song))
          } as Paginated<SongWithArtists>;
        }
      })
    );
  }

  // Método auxiliar para agregar nombres de artistas temporales
  private addPlaceholderArtistNames(song: Song): SongWithArtists {
    return {
      ...song,
      artistNames: song.artists_IDS?.length > 0 ? ['Loading...'] : ['Unknown Artist']
    };
  }

  // Método para obtener una canción con nombres de artistas
  getByIdWithArtists(id: string): Observable<SongWithArtists | null> {
    return this.getById(id).pipe(
      map(song => song ? this.addPlaceholderArtistNames(song) : null)
    );
  }

  updateSongs(id: number | string, body: { data: Partial<Song> }): Observable<any> {
    console.log('🔄 Datos originales:', body);
    
    // Procesar solo la imagen si existe
    if (body.data.image !== undefined) {
      const processedImage = this.processImageForStrapi(body.data.image);
      body.data.image = processedImage;
    }
    
    console.log('📦 Datos procesados para enviar:', body);
    
    return this.http.put(`${this.apiUrl}/${id}`, body);
  }

  // ✅ MÉTODO MEJORADO: Actualizar canción con posible subida de imagen
  async updateSongWithImage(id: number | string, songData: Partial<Song>): Promise<any> {
    console.log('🔄 Actualizando canción con imagen:', id);
    
    // Si hay una imagen en base64, subirla primero
    if (songData.image && typeof songData.image === 'string' && (songData.image as string).startsWith('data:image/')) {
      console.log('📤 Subiendo imagen base64...');
      
      try {
        // Convertir base64 a File
        const imageFile = this.base64ToFile(songData.image as string, 'song-image.png');
        
        // Subir imagen a Strapi
        const uploadResult: any = await this.mediaService.upload(imageFile).toPromise();
        
        console.log('✅ Imagen subida exitosamente:', uploadResult);
        
        // Usar el ID de la imagen subida
        // Strapi puede devolver un array o un objeto, manejar ambos casos
        let imageId: number | undefined = undefined;
        
        if (Array.isArray(uploadResult)) {
          // Si es un array de IDs directos: [195]
          if (typeof uploadResult[0] === 'number') {
            imageId = uploadResult[0];
          } 
          // Si es un array de objetos: [{id: 195}]
          else if (uploadResult[0] && uploadResult[0].id) {
            imageId = uploadResult[0].id;
          }
        } else if (uploadResult) {
          // Si es un objeto: {id: 195}
          if (uploadResult.id) {
            imageId = uploadResult.id;
          }
          // Si es un ID directo: 195
          else if (typeof uploadResult === 'number') {
            imageId = uploadResult;
          }
        }
        
        if (imageId) {
          // Asignar el ID numérico directamente
          (songData as any).image = imageId;
          console.log('🎯 ID de imagen asignado:', imageId);
        } else {
          console.error('❌ No se pudo obtener ID de imagen válido');
          delete songData.image;
        }
        
      } catch (error) {
        console.error('❌ Error al subir imagen:', error);
        // Remover imagen del update si falló la subida
        delete songData.image;
        throw error; // Re-lanzar el error para que el componente lo maneje
      }
    }
    
    // Continuar con la actualización normal
    return this.updateSongs(id, { data: songData }).toPromise();
  }

  // ✅ MÉTODO AUXILIAR: Convertir base64 a File
  private base64ToFile(base64String: string, filename: string): File {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new File([u8arr], filename, { type: mime });
  }

  // ✅ MÉTODO AUXILIAR: Procesar imagen para Strapi
  private processImageForStrapi(imageData: any): any {
    if (imageData === null || imageData === undefined) {
      return null;
    }

    console.log('🖼️ Procesando imagen:', typeof imageData === 'string' ? imageData.substring(0, 50) + '...' : imageData);
    console.log('🖼️ Tipo de imagen:', typeof imageData);

    // Si es un número directamente (ID del archivo en Strapi)
    if (typeof imageData === 'number' && imageData > 0) {
      console.log('✅ Imagen es ID numérico:', imageData);
      return imageData;
    }

    // Si es un objeto con estructura de Strapi response
    if (typeof imageData === 'object' && imageData !== null) {
      // Formato: { data: { id: 123, attributes: {...} } }
      if (imageData.data && typeof imageData.data.id === 'number') {
        console.log('✅ Imagen extraída de data.id:', imageData.data.id);
        return imageData.data.id;
      }
      // Formato: { id: 123, url: "...", ... }
      if (typeof imageData.id === 'number') {
        console.log('✅ Imagen extraída de id:', imageData.id);
        return imageData.id;
      }
      // Formato: { data: { id: "123" } } (ID como string)
      if (imageData.data && imageData.data.id) {
        const parsedId = parseInt(imageData.data.id, 10);
        if (!isNaN(parsedId) && parsedId > 0) {
          console.log('✅ Imagen parseada de data.id string:', parsedId);
          return parsedId;
        }
      }
    }

    // Si es un string que representa un ID numérico
    if (typeof imageData === 'string' && !imageData.startsWith('data:')) {
      const parsedId = parseInt(imageData, 10);
      if (!isNaN(parsedId) && parsedId > 0) {
        console.log('✅ Imagen parseada de string:', parsedId);
        return parsedId;
      }
    }

    // ⚠️ DETECTAR BASE64: Si es una imagen en base64, no podemos procesarla aquí
    if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
      console.error('❌ ERROR: Se detectó imagen en base64. Necesitas subirla primero!');
      console.warn('💡 SOLUCIÓN: Usa MediaService para subir la imagen antes de actualizar la canción');
      return null; // No enviar imagen base64 a Strapi
    }

    return imageData; 
  }
}
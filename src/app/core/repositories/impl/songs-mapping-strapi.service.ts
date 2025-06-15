// src/app/core/repositories/impl/songs-mapping-strapi.service.ts
import { Injectable } from '@angular/core';
import { IBaseMapping } from '../intefaces/base-mapping.interface';
import { Song } from '../../models/song.model';
import { Paginated } from '../../models/paginated.model';

/**
 * Servicio de mapeo para canciones específico para Strapi
 * Maneja la transformación entre el modelo Song y la estructura de datos de Strapi
 */
@Injectable({
    providedIn: 'root'
})
export class SongsMappingStrapi implements IBaseMapping<Song> {

    /**
     * Crea un objeto paginado con canciones mapeadas
     * @param page Número de página actual
     * @param pageSize Tamaño de página
     * @param totalItems Total de elementos disponibles
     * @param items Array de datos sin procesar de Strapi
     * @returns Objeto Paginated con canciones mapeadas
     */
    getPaginated(page: number, pageSize: number, totalItems: number, items: any[]): Paginated<Song> {
        return {
            data: items.map(item => this.getOne({ data: item })),
            page,
            pageSize,
            pages: Math.ceil(totalItems / pageSize)
        };
    }

    /**
     * Convierte un objeto de respuesta de Strapi en un modelo Song
     * @param data Datos sin procesar de Strapi
     * @returns Modelo Song mapeado o null si los datos son inválidos
     */
    getOne(data: any): Song {
        if (!data) return null as any;

        const item = data.data || data;
        const id = item.id;
        const attributes = item.attributes || item;

        if (!attributes) {
            return null as any;
        }

        // Procesar duración - convertir de string MM:SS a segundos o mantener número
        let durationValue = 0;
        if (attributes.duration !== undefined) {
            if (typeof attributes.duration === 'number') {
                durationValue = attributes.duration;
            } else if (typeof attributes.duration === 'string') {
                if (attributes.duration.includes(':')) {
                    const parts = attributes.duration.split(':');
                    durationValue = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
                } else {
                    durationValue = parseInt(attributes.duration, 10) || 0;
                }
            }
        }

        // Mapear IDs de artistas desde relación de Strapi
        let artistIds: string[] = [];
        if (attributes.artists_IDS && attributes.artists_IDS.data && Array.isArray(attributes.artists_IDS.data)) {
            artistIds = attributes.artists_IDS.data
                .filter((artist: any) => artist && artist.id)
                .map((artist: any) => artist.id.toString());
        }

        // Mapear IDs de playlists desde relación de Strapi
        let playlistIds: string[] = [];
        if (attributes.playlistid_IDS && attributes.playlistid_IDS.data && Array.isArray(attributes.playlistid_IDS.data)) {
            playlistIds = attributes.playlistid_IDS.data
                .filter((p: any) => p && p.id)
                .map((p: any) => p.id.toString());
        }

        // Mapear imagen con todos los formatos disponibles
        let imageData = undefined;
        if (attributes.image && attributes.image.data && attributes.image.data.attributes) {
            const imgAttrs = attributes.image.data.attributes;
            imageData = {
                url: imgAttrs.url,
                large: imgAttrs.formats?.large?.url || imgAttrs.url,
                medium: imgAttrs.formats?.medium?.url || imgAttrs.url,
                small: imgAttrs.formats?.small?.url || imgAttrs.url,
                thumbnail: imgAttrs.formats?.thumbnail?.url || imgAttrs.url,
            };
        }

        // Mapear URL de audio desde archivo relacionado
        let audioUrl: string | undefined = undefined;
        if (attributes.audioUrl && attributes.audioUrl.data && attributes.audioUrl.data.attributes) {
            audioUrl = attributes.audioUrl.data.attributes.url;
        }

        // Mapear usuarios que han dado like (relación de Strapi)
        let usersLike: string[] = [];
        if (attributes.users_like && attributes.users_like.data && Array.isArray(attributes.users_like.data)) {
            usersLike = attributes.users_like.data
                .filter((user: any) => user && user.id)
                .map((user: any) => user.id.toString());
        }

        // Procesar contador de likes
        let likesCount = 0;
        if (attributes.likes_count !== undefined) {
            if (typeof attributes.likes_count === 'string') {
                likesCount = parseInt(attributes.likes_count, 10) || 0;
            } else if (typeof attributes.likes_count === 'number') {
                likesCount = attributes.likes_count;
            }
        }

        const mappedSong: Song = {
            id: id.toString(),
            name: attributes.name || 'Unknown Song',
            album: attributes.album || 'Unknown Album',
            duration: durationValue,
            audioUrl: audioUrl,
            artists_IDS: artistIds,
            playlistid_IDS: playlistIds,
            lyrics: attributes.lyrics || undefined,
            image: imageData,
            users_like: usersLike,
            likes_count: likesCount
        };

        return mappedSong;
    }

    /**
     * Prepara los datos parciales de la canción para actualización en Strapi
     * @param data Datos parciales del Song a actualizar
     * @returns Objeto con estructura compatible con Strapi para PUT/PATCH
     */
    setUpdate(data: Partial<Song>): any {
        const mappedData: any = {};
        
        // Mapear campos simples
        if (data.name !== undefined) mappedData.name = data.name;
        if (data.album !== undefined) mappedData.album = data.album;
        if (data.duration !== undefined) mappedData.duration = data.duration;
        if (data.lyrics !== undefined) mappedData.lyrics = data.lyrics;
        if (data.likes_count !== undefined) mappedData.likes_count = data.likes_count;
        
        // Mapear relaciones - convertir strings a IDs numéricos para Strapi
        if (data.users_like !== undefined) {
            mappedData.users_like = data.users_like
                .map(id => {
                    const numId = parseInt(id, 10);
                    return isNaN(numId) ? null : numId;
                })
                .filter(id => id !== null && id > 0);
        }
        
        if (data.artists_IDS !== undefined) {
            mappedData.artists_IDS = data.artists_IDS
                .map(id => parseInt(id, 10))
                .filter(id => !isNaN(id) && id > 0);
        }
        
        if (data.playlistid_IDS !== undefined) {
            mappedData.playlistid_IDS = data.playlistid_IDS
                .map(id => parseInt(id, 10))
                .filter(id => !isNaN(id) && id > 0);
        }
        
        // CORREGIDO: Manejo mejorado de imagen para Strapi
        if (data.image !== undefined) {
            if (data.image === null) {
                // Para remover imagen
                mappedData.image = null;
            } else if (data.image) {
                console.log('🖼️ Procesando imagen:', data.image);
                
                const imageData: any = data.image;
                let imageId: number | null = null;
                
                // 1. Si es un número directamente (ID del archivo en Strapi)
                if (typeof imageData === 'number' && imageData > 0) {
                    imageId = imageData;
                }
                // 2. Si es un objeto con estructura de Strapi response
                else if (typeof imageData === 'object' && imageData !== null) {
                    // Formato: { data: { id: 123, attributes: {...} } }
                    if (imageData.data && typeof imageData.data.id === 'number') {
                        imageId = imageData.data.id;
                    }
                    // Formato: { id: 123, url: "...", ... }
                    else if (typeof imageData.id === 'number') {
                        imageId = imageData.id;
                    }
                    // Formato: { data: { id: "123" } } (ID como string)
                    else if (imageData.data && imageData.data.id) {
                        const parsedId = parseInt(imageData.data.id, 10);
                        if (!isNaN(parsedId) && parsedId > 0) {
                            imageId = parsedId;
                        }
                    }
                    // Si viene del form como File o FormData, necesitarías subirla primero
                    else if (imageData instanceof File || imageData instanceof FormData) {
                        console.warn('⚠️ Se detectó un archivo nuevo. Necesitas subirlo primero usando MediaService');
                        // Aquí deberías manejar la subida del archivo
                        // return null; // o manejar de otra forma
                    }
                }
                // 3. Si es un string que representa un ID
                else if (typeof imageData === 'string') {
                    const parsedId = parseInt(imageData, 10);
                    if (!isNaN(parsedId) && parsedId > 0) {
                        imageId = parsedId;
                    }
                }
                
                if (imageId && imageId > 0) {
                    mappedData.image = imageId;
                    console.log('✅ Imagen mapeada con ID:', imageId);
                } else {
                    console.warn('⚠️ No se pudo obtener un ID válido de imagen:', imageData);
                    // No incluir imagen en la actualización si no se puede procesar
                }
            }
        }
        
        // Mapear URL de audio
        if (data.audioUrl !== undefined) {
            if (data.audioUrl === null || data.audioUrl === '') {
                mappedData.audioUrl = null;
            } else {
                // Si audioUrl es un ID de archivo
                const audioId = Number(data.audioUrl);
                if (!isNaN(audioId) && audioId > 0) {
                    mappedData.audioUrl = audioId;
                } else {
                    // Si es una URL string
                    mappedData.audioUrl = data.audioUrl;
                }
            }
        }
        
        console.log('📦 Datos finales para Strapi:', { data: mappedData });
        return { data: mappedData };
    }

    /**
     * Prepara los datos de la canción para ser enviados a Strapi en una operación de creación
     * @param data Modelo Song a convertir
     * @returns Objeto con estructura compatible con Strapi para POST
     */
    setAdd(data: Song): any {
        const mappedData: any = {
            name: data.name,
            album: data.album || '',
            duration: data.duration || 0,
            lyrics: data.lyrics || null,
            likes_count: data.likes_count || 0,
            users_like: data.users_like?.map(id => parseInt(id, 10)) || [],
            artists_IDS: data.artists_IDS?.map(id => parseInt(id, 10)) || [],
            playlistid_IDS: data.playlistid_IDS?.map(id => parseInt(id, 10)) || []
        };

        // Manejar imagen en creación - convertir diferentes formatos a ID numérico
        if (data.image !== undefined) {
            const imageData: any = data.image;
            
            if (typeof imageData === 'number') {
                mappedData.image = imageData;
            } else if (typeof imageData === 'object' && imageData !== null) {
                if (imageData.data && imageData.data.id) {
                    mappedData.image = Number(imageData.data.id);
                } else if (imageData.id) {
                    mappedData.image = Number(imageData.id);
                } else if (imageData.url && !isNaN(Number(imageData.url))) {
                    mappedData.image = Number(imageData.url);
                }
            } else if (typeof imageData === 'string' && !isNaN(Number(imageData))) {
                mappedData.image = Number(imageData);
            }
        }

        // Mapear URL de audio
        if (data.audioUrl !== undefined) {
            mappedData.audioUrl = data.audioUrl;
        }

        return { data: mappedData };
    }

    /**
     * Mapea la respuesta de Strapi después de una operación de creación
     * @param data Respuesta de Strapi tras POST
     * @returns Modelo Song mapeado
     */
    getAdded(data: any): Song {
        return this.getOne(data);
    }

    /**
     * Mapea la respuesta de Strapi después de una operación de actualización
     * @param data Respuesta de Strapi tras PUT/PATCH
     * @returns Modelo Song mapeado
     */
    getUpdated(data: any): Song {
        return this.getOne(data);
    }

    /**
     * Mapea la respuesta de Strapi después de una operación de eliminación
     * @param data Respuesta de Strapi tras DELETE
     * @returns Modelo Song mapeado
     */
    getDeleted(data: any): Song {
        return this.getOne(data);
    }
}
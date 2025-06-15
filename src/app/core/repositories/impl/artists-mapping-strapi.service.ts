// src/app/core/repositories/impl/artists-mapping-strapi.service.ts
import { Injectable } from '@angular/core';
import { IBaseMapping } from '../intefaces/base-mapping.interface';
import { Artist } from '../../models/artist.model';
import { Paginated } from '../../models/paginated.model';

/**
 * Servicio de mapeo para artistas específico para Strapi
 * Maneja la transformación entre el modelo Artist y la estructura de datos de Strapi
 */
@Injectable({
    providedIn: 'root'
})
export class ArtistsMappingStrapi implements IBaseMapping<Artist> {
    
    /**
     * Prepara los datos del artista para ser enviados a Strapi en una operación de creación
     * @param data Modelo Artist a convertir
     * @returns Objeto con estructura compatible con Strapi para POST
     */
    setAdd(data: Artist): any {
        return {
            data: {
                Name: data.name, // Convertir name -> Name para Strapi
                listeners: data.listeners?.toString() || "0",
                followers_count: data.followers_count?.toString() || "0",
                verified: data.verified || false,
            }
        };
    }

    /**
     * Prepara los datos parciales del artista para actualización en Strapi
     * @param data Datos parciales del Artist a actualizar
     * @returns Objeto con estructura compatible con Strapi para PUT/PATCH
     */
    setUpdate(data: Partial<Artist>): any {
        const updateData: any = {};
        
        if (data.name !== undefined) {
            updateData.Name = data.name;
        }
        
        if (data.listeners !== undefined) {
            updateData.listeners = data.listeners.toString();
        }
        
        if (data.followers_count !== undefined) {
            updateData.followers_count = data.followers_count.toString();
        }
        
        if (data.verified !== undefined) {
            updateData.verified = data.verified;
        }

        return {
            data: updateData
        };
    }

    /**
     * Crea un objeto paginado con artistas mapeados
     * @param page Número de página actual
     * @param pageSize Tamaño de página
     * @param totalItems Total de elementos disponibles
     * @param items Array de datos sin procesar de Strapi
     * @returns Objeto Paginated con artistas mapeados
     */
    getPaginated(page: number, pageSize: number, totalItems: number, items: any[]): Paginated<Artist> {
        return {
            data: items.map(item => this.getOne({ data: item })),
            page,
            pageSize,
            pages: Math.ceil(totalItems / pageSize)
        };
    }

    /**
     * Convierte un objeto de respuesta de Strapi en un modelo Artist
     * @param data Datos sin procesar de Strapi
     * @returns Modelo Artist mapeado o null si los datos son inválidos
     */
    getOne(data: any): Artist {
        if (!data) return null as any;

        const item = data.data || data;
        const id = item.id?.toString();
        const attributes = item.attributes || item;

        if (!attributes) {
            return null as any;
        }

        const artist: Artist = {
            id,
            name: attributes.Name || attributes.name || '',
            listeners: this.parseNumber(attributes.listeners),
            followers_count: this.parseNumber(attributes.followers_count),
            image: this.mapImage(attributes.image),
            songs_IDS: this.mapSongsIds(attributes.songs_IDS),
            artists_follow: this.mapArtistsFollow(attributes.artists_follow),
            verified: attributes.verified || false
        };

        return artist;
    }

    /**
     * Mapea los datos de imagen de Strapi al formato del modelo
     * @param imageData Datos de imagen desde Strapi
     * @returns Objeto de imagen con diferentes tamaños o estructura vacía
     */
    private mapImage(imageData: any): any {
        if (!imageData?.data?.attributes) {
            return {
                url: undefined,
                large: undefined,
                medium: undefined,
                small: undefined,
                thumbnail: undefined
            };
        }

        const imageAttrs = imageData.data.attributes;
        const formats = imageAttrs.formats || {};

        return {
            url: imageAttrs.url,
            large: formats.large?.url,
            medium: formats.medium?.url,
            small: formats.small?.url,
            thumbnail: formats.thumbnail?.url
        };
    }

    /**
     * Extrae y mapea los IDs de canciones desde la respuesta de Strapi
     * @param songsData Datos de canciones relacionadas desde Strapi
     * @returns Array de strings con los IDs de las canciones
     */
    private mapSongsIds(songsData: any): string[] {
        if (!songsData?.data || !Array.isArray(songsData.data)) {
            return [];
        }

        return songsData.data.map((song: any) => song.id?.toString()).filter(Boolean);
    }

    /**
     * Mapea los datos de usuarios que siguen al artista
     * @param artistsFollowData Datos de usuarios que siguen desde Strapi
     * @returns Array de strings con IDs de usuarios
     */
    private mapArtistsFollow(artistsFollowData: any): string[] {
        if (!artistsFollowData?.data || !Array.isArray(artistsFollowData.data)) {
            return [];
        }

        // Convertir de array de objetos a array de IDs de usuarios
        return artistsFollowData.data.map((user: any) => user.id?.toString()).filter(Boolean);
    }

    /**
     * Convierte un valor a número, manejando strings y valores nulos
     * @param value Valor a convertir
     * @returns Número parseado o 0 si no es válido
     */
    private parseNumber(value: any): number {
        if (typeof value === 'number') {
            return value;
        }
        if (typeof value === 'string') {
            const parsed = parseInt(value, 10);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    }

    /**
     * Mapea la respuesta de Strapi después de una operación de creación
     * @param data Respuesta de Strapi tras POST
     * @returns Modelo Artist mapeado
     */
    getAdded(data: any): Artist {
        return this.getOne(data);
    }

    /**
     * Mapea la respuesta de Strapi después de una operación de actualización
     * @param data Respuesta de Strapi tras PUT/PATCH
     * @returns Modelo Artist mapeado
     */
    getUpdated(data: any): Artist {
        return this.getOne(data);
    }

    /**
     * Mapea la respuesta de Strapi después de una operación de eliminación
     * @param data Respuesta de Strapi tras DELETE
     * @returns Modelo Artist mapeado
     */
    getDeleted(data: any): Artist {
        return this.getOne(data);
    }
}
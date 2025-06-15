// src/app/core/repositories/impl/playlists-mapping-strapi.service.ts
import { Injectable } from "@angular/core";
import { IBaseMapping } from "../intefaces/base-mapping.interface";
import { Paginated } from "../../models/paginated.model";
import { Playlist } from "../../models/playlist.model";

/**
 * Servicio de mapeo para playlists específico para Strapi
 * Maneja la transformación entre el modelo Playlist y la estructura de datos de Strapi
 */
@Injectable({
    providedIn: 'root'
})
export class PlaylistsMappingStrapi implements IBaseMapping<Playlist> {
    
    /**
     * Prepara los datos de la playlist para ser enviados a Strapi en una operación de creación
     * @param data Modelo Playlist a convertir
     * @returns Objeto con estructura compatible con Strapi para POST
     */
    setAdd(data: Playlist): any {
        const mappedData: any = {
            name: data.name,
            author: data.author,
            duration: data.duration,
            song_IDS: data.song_IDS ? 
                data.song_IDS.map(id => Number(id)) : [],
            users_IDS: data.users_IDS ? 
                data.users_IDS.map(id => Number(id)) : [],
            likes_count: data.likes_count || 0
        };

        // Manejar imagen en creación - convertir diferentes formatos a ID numérico
        if (data.image !== undefined) {
            const imageData: any = data.image;
            
            if (typeof imageData === 'number') {
                mappedData.image = imageData;
            } else if (typeof imageData === 'object' && imageData !== null) {
                if (imageData.url && !isNaN(Number(imageData.url))) {
                    mappedData.image = Number(imageData.url);
                } else if (imageData.id) {
                    mappedData.image = Number(imageData.id);
                } else if (imageData.data && imageData.data.id) {
                    mappedData.image = Number(imageData.data.id);
                }
            } else if (typeof imageData === 'string' && !isNaN(Number(imageData))) {
                mappedData.image = Number(imageData);
            }
        }

        return {
            data: mappedData
        };
    }

    /**
     * Prepara los datos parciales de la playlist para actualización en Strapi
     * @param data Datos parciales del Playlist a actualizar
     * @returns Objeto con estructura compatible con Strapi para PUT/PATCH
     */
    setUpdate(data: Partial<Playlist>): any {
        const mappedData: any = {};
        
        Object.keys(data).forEach(key => {
            switch(key) {
                case 'name': 
                    mappedData.name = data[key];
                    break;
                case 'author': 
                    mappedData.author = data[key];
                    break;
                case 'duration': 
                    mappedData.duration = data[key];
                    break;
                case 'song_IDS': 
                    mappedData.song_IDS = data[key] ? 
                        data[key]?.map(id => Number(id)) : [];
                    break;
                case 'users_IDS': 
                    mappedData.users_IDS = data[key] ? 
                        data[key]?.map(id => Number(id)) : [];
                    break;
                case 'image': 
                    // Manejo de imagen en actualización
                    if (data[key] === null) {
                        mappedData.image = null; // Para remover imagen
                    } else if (data[key]) {
                        const imageData: any = data[key];
                        
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
                    break;
                case 'likes_count':
                    mappedData.likes_count = data[key] || 0;
                    break;
            }
        });

        return {
            data: mappedData
        };
    }

    /**
     * Crea un objeto paginado con playlists mapeadas
     * @param page Número de página actual
     * @param pageSize Tamaño de página
     * @param pages Número total de páginas
     * @param data Array de datos sin procesar de Strapi
     * @returns Objeto Paginated con playlists mapeadas
     */
    getPaginated(page: number, pageSize: number, pages: number, data: any[]): Paginated<Playlist> {
        return {
            page, 
            pageSize, 
            pages, 
            data: data.map(d => this.getOne(d))
        };
    }

    /**
     * Convierte un objeto de respuesta de Strapi en un modelo Playlist
     * @param data Datos sin procesar de Strapi
     * @returns Modelo Playlist mapeado con valores por defecto si faltan datos
     */
    getOne(data: any): Playlist {
        let attributes, id;
        
        // Manejar diferentes estructuras de respuesta de Strapi
        if (data.data && data.data.attributes) {
            attributes = data.data.attributes;
            id = data.data.id;
        } else if (data.attributes) {
            attributes = data.attributes;
            id = data.id;
        } else if (data.id && (data.name || data.author)) {
            attributes = data;
            id = data.id;
        } else {
            // Fallback para datos inválidos
            return {
                id: data.id?.toString() || 'unknown',
                name: 'Unknown Playlist',
                author: 'Unknown Author',
                duration: '0:00',
                song_IDS: [],
                users_IDS: [],
                likes_count: 0,
                image: undefined
            };
        }

        // Mapear IDs de canciones
        let songIds: string[] = [];
        if (attributes.song_IDS) {
            if (attributes.song_IDS.data && Array.isArray(attributes.song_IDS.data)) {
                songIds = attributes.song_IDS.data
                    .filter((s: any) => s && s.id)
                    .map((s: any) => s.id.toString());
            } else if (Array.isArray(attributes.song_IDS)) {
                songIds = attributes.song_IDS
                    .filter((s: any) => s && (s.id || s))
                    .map((s: any) => s.id ? s.id.toString() : s.toString());
            }
        }

        // Mapear IDs de usuarios
        let userIds: string[] = [];
        if (attributes.users_IDS) {
            if (attributes.users_IDS.data && Array.isArray(attributes.users_IDS.data)) {
                userIds = attributes.users_IDS.data
                    .filter((u: any) => u && u.id)
                    .map((u: any) => u.id.toString());
            } else if (Array.isArray(attributes.users_IDS)) {
                userIds = attributes.users_IDS
                    .filter((u: any) => u && (u.id || u))
                    .map((u: any) => u.id ? u.id.toString() : u.toString());
            }
        }

        const mappedPlaylist: Playlist = {
            id: id.toString(),
            name: attributes.name || 'Unknown Playlist',
            author: attributes.author || 'Unknown Author',
            duration: attributes.duration || '0:00',
            song_IDS: songIds,
            users_IDS: userIds,
            likes_count: attributes.likes_count || 0,
            // Mapear imagen con todos los formatos disponibles
            image: attributes.image?.data ? {
                url: attributes.image.data.attributes.url,
                large: attributes.image.data.attributes.formats?.large?.url || attributes.image.data.attributes.url,
                medium: attributes.image.data.attributes.formats?.medium?.url || attributes.image.data.attributes.url,
                small: attributes.image.data.attributes.formats?.small?.url || attributes.image.data.attributes.url,
                thumbnail: attributes.image.data.attributes.formats?.thumbnail?.url || attributes.image.data.attributes.url,
            } : undefined
        };

        return mappedPlaylist;
    }

    /**
     * Mapea la respuesta de Strapi después de una operación de creación
     * @param data Respuesta de Strapi tras POST
     * @returns Modelo Playlist mapeado
     */
    getAdded(data: any): Playlist {
        return this.getOne(data);
    }

    /**
     * Mapea la respuesta de Strapi después de una operación de actualización
     * @param data Respuesta de Strapi tras PUT/PATCH
     * @returns Modelo Playlist mapeado
     */
    getUpdated(data: any): Playlist {
        return this.getOne(data);
    }

    /**
     * Mapea la respuesta de Strapi después de una operación de eliminación
     * @param data Respuesta de Strapi tras DELETE
     * @returns Modelo Playlist mapeado
     */
    getDeleted(data: any): Playlist {
        return this.getOne(data);
    }
}
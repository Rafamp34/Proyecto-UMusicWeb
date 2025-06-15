// src/app/core/repositories/impl/users-mapping-strapi.service.ts
import { Injectable } from "@angular/core";
import { IUserMapping } from "../intefaces/user-mapping.interface";
import { User } from "../../models/user.model";
import { Paginated } from "../../models/paginated.model";

/**
 * Servicio de mapeo para usuarios específico para Strapi
 * Maneja la transformación entre el modelo User y la estructura de datos de Strapi
 * Incluye soporte para estructura plana y anidada de respuestas
 */
@Injectable({
    providedIn: 'root'
})
export class UserMappingStrapiService implements IUserMapping {
    
    /**
     * Crea un objeto paginado con usuarios mapeados
     * @param page Número de página actual
     * @param pageSize Tamaño de página
     * @param pages Número total de páginas
     * @param data Array de datos sin procesar de Strapi
     * @returns Objeto Paginated con usuarios mapeados
     */
    getPaginated(page: number, pageSize: number, pages: number, data: any[]): Paginated<User> {
        return {
            page,
            pageSize,
            pages,
            data: data.map(item => this.getOne(item))
        };
    }

    /**
     * Convierte un objeto de respuesta de Strapi en un modelo User
     * Maneja múltiples estructuras de respuesta de Strapi (v4, plana, anidada)
     * @param data Datos sin procesar de Strapi
     * @returns Modelo User mapeado con valores por defecto si faltan datos
     */
    getOne(data: any): User {        
        let userData: any;
        
        // Manejar diferentes estructuras de respuesta de Strapi
        if (data?.data?.attributes) {
            // Estructura Strapi v4: {data: {id: X, attributes: {...}}}
            userData = {
                id: data.data.id,
                ...data.data.attributes
            };
        } else if (data?.data && typeof data.data === 'object' && data.data.id) {
            // Estructura: {data: {id: X, field1: Y, ...}}
            userData = data.data;
        } else if (data?.id && (data?.username || data?.email)) {
            // Estructura plana: {id: X, username: Y, image: {...}, ...}
            userData = data;
        } else {
            return this.createFallbackUser(data);
        }

        if (!userData || !userData.id || (!userData.username && !userData.email)) {
            return this.createFallbackUser(data);
        }

        const mappedUser: User = {
            id: userData.id?.toString() || 'unknown',
            username: userData.username || userData.email?.split('@')[0] || 'unknown',
            email: userData.email || 'unknown@example.com',
            provider: userData.provider || 'local',
            confirmed: userData.confirmed ?? false,
            blocked: userData.blocked ?? false,
            
            followers: this.extractFollowersCount(userData.followers, userData.followers_FK),
            following: this.extractFollowingCount(userData.following, userData.following_fks),
            following_ids: this.mapFollowing(userData.following, userData.following_fks),
            followers_FK: this.mapFollowers(userData.followers, userData.followers_FK),
            liked_songs: this.mapLikedSongs(userData.liked_songs),
            following_artists: this.mapFollowingArtists(userData.following_artists),
            playlists_IDS: this.mapPlaylists(userData.playlists_IDS),
            
            image: this.mapImage(userData.image)
        };

        return mappedUser;
    }

    /**
     * Extrae el número de seguidores, manejando tanto contadores como arrays
     * @param followers Datos de seguidores
     * @param followers_FK Campo alternativo de seguidores
     * @returns Número de seguidores
     */
    private extractFollowersCount(followers: any, followers_FK: any): number {
        if (typeof followers === 'number') {
            return followers;
        }
        
        const followersArray = this.mapFollowers(followers, followers_FK);
        return followersArray.length;
    }

    /**
     * Extrae el número de usuarios seguidos, manejando tanto contadores como arrays
     * @param following Datos de usuarios seguidos
     * @param following_fks Campo alternativo de usuarios seguidos
     * @returns Número de usuarios seguidos
     */
    private extractFollowingCount(following: any, following_fks: any): number {
        if (typeof following === 'number') {
            return following;
        }
        
        const followingArray = this.mapFollowing(following, following_fks);
        return followingArray.length;
    }

    /**
     * Crea un usuario de respaldo cuando los datos son inválidos
     * @param data Datos originales para extraer ID si es posible
     * @returns Usuario con valores por defecto
     */
    private createFallbackUser(data: any): User {
        const fallbackId = data?.data?.id?.toString() || data?.id?.toString() || 'unknown';
        return {
            id: fallbackId,
            username: 'unknown',
            email: 'unknown@example.com',
            provider: 'unknown',
            confirmed: false,
            blocked: false,
            followers: 0,
            following: 0,
            following_ids: [],
            followers_FK: [],
            liked_songs: [],
            following_artists: [],
            playlists_IDS: [],
            image: undefined
        };
    }

    /**
     * Mapea datos de seguidores desde diferentes estructuras de Strapi
     * @param followers Datos de seguidores
     * @param followers_FK Campo alternativo de seguidores
     * @returns Array de IDs de seguidores como strings
     */
    private mapFollowers(followers: any, followers_FK: any): string[] {
        if (followers_FK && Array.isArray(followers_FK)) {
            return followers_FK.map(item => item?.id?.toString() || item?.toString()).filter(Boolean);
        }
        
        if (Array.isArray(followers)) {
            return followers.map(item => item?.id?.toString() || item?.toString()).filter(Boolean);
        }
        
        if (followers?.data && Array.isArray(followers.data)) {
            return followers.data.map((item: any) => item?.id?.toString()).filter(Boolean);
        }
        
        return [];
    }

    /**
     * Mapea datos de usuarios seguidos desde diferentes estructuras de Strapi
     * @param following Datos de usuarios seguidos
     * @param following_fks Campo alternativo de usuarios seguidos
     * @returns Array de IDs de usuarios seguidos como strings
     */
    private mapFollowing(following: any, following_fks: any): string[] {
        if (following_fks && Array.isArray(following_fks)) {
            return following_fks.map(item => item?.id?.toString() || item?.toString()).filter(Boolean);
        }
        
        if (Array.isArray(following)) {
            return following.map(item => item?.id?.toString() || item?.toString()).filter(Boolean);
        }
        
        if (following?.data && Array.isArray(following.data)) {
            return following.data.map((item: any) => item?.id?.toString()).filter(Boolean);
        }
        
        return [];
    }

    /**
     * Mapea IDs de canciones que le gustan al usuario
     * @param likedSongs Datos de canciones que le gustan
     * @returns Array de IDs de canciones como strings
     */
    private mapLikedSongs(likedSongs: any): string[] {
        if (!likedSongs) return [];
        
        if (Array.isArray(likedSongs)) {
            return likedSongs.map(item => item?.id?.toString() || item?.toString()).filter(Boolean);
        }
        
        if (likedSongs.data && Array.isArray(likedSongs.data)) {
            return likedSongs.data.map((item: any) => item?.id?.toString()).filter(Boolean);
        }
        
        return [];
    }

    /**
     * Mapea IDs de artistas que sigue el usuario
     * @param followingArtists Datos de artistas seguidos
     * @returns Array de IDs de artistas como strings
     */
    private mapFollowingArtists(followingArtists: any): string[] {
        if (!followingArtists) return [];
        
        if (Array.isArray(followingArtists)) {
            return followingArtists.map(item => item?.id?.toString() || item?.toString()).filter(Boolean);
        }
        
        if (followingArtists.data && Array.isArray(followingArtists.data)) {
            return followingArtists.data.map((item: any) => item?.id?.toString()).filter(Boolean);
        }
        
        return [];
    }

    /**
     * Mapea IDs de playlists del usuario
     * @param playlists Datos de playlists
     * @returns Array de IDs de playlists como strings
     */
    private mapPlaylists(playlists: any): string[] {
        if (!playlists) return [];
        
        if (Array.isArray(playlists)) {
            return playlists.map(item => item?.id?.toString() || item?.toString()).filter(Boolean);
        }
        
        if (playlists.data && Array.isArray(playlists.data)) {
            return playlists.data.map((item: any) => item?.id?.toString()).filter(Boolean);
        }
        
        return [];
    }

    /**
     * Mapea datos de imagen desde diferentes estructuras de Strapi
     * Maneja estructura plana y estructura Strapi v4
     * @param imageData Datos de imagen desde Strapi
     * @returns Objeto de imagen con diferentes tamaños o undefined
     */
    private mapImage(imageData: any): User['image'] | undefined {
        if (!imageData) {
            return undefined;
        }

        // Estructura plana: imagen directa con url, formats, etc.
        if (imageData.url && typeof imageData.url === 'string') {
            return {
                url: imageData.url,
                large: imageData.formats?.large?.url || imageData.url,
                medium: imageData.formats?.medium?.url || imageData.url,
                small: imageData.formats?.small?.url || imageData.url,
                thumbnail: imageData.formats?.thumbnail?.url || imageData.url
            };
        }

        // Si es solo un string (URL directa)
        if (typeof imageData === 'string') {
            return {
                url: imageData,
                large: imageData,
                medium: imageData,
                small: imageData,
                thumbnail: imageData
            };
        }

        // Estructura Strapi v4: {data: {attributes: {...}}}
        if (imageData.data?.attributes) {
            const attrs = imageData.data.attributes;
            return {
                url: attrs.url,
                large: attrs.formats?.large?.url || attrs.url,
                medium: attrs.formats?.medium?.url || attrs.url,
                small: attrs.formats?.small?.url || attrs.url,
                thumbnail: attrs.formats?.thumbnail?.url || attrs.url
            };
        }

        // Si tiene estructura con .url pero no formats
        if (imageData.url) {
            return {
                url: imageData.url,
                large: imageData.formats?.large?.url || imageData.url,
                medium: imageData.formats?.medium?.url || imageData.url,
                small: imageData.formats?.small?.url || imageData.url,
                thumbnail: imageData.formats?.thumbnail?.url || imageData.url
            };
        }

        return undefined;
    }

    /**
     * Prepara los datos del usuario para ser enviados a Strapi en una operación de creación
     * @param data Modelo User a convertir
     * @returns Objeto con estructura compatible con Strapi para POST
     */
    setAdd(data: User): any {
        const mappedData: any = {
            username: data.username,
            email: data.email,
            followers: data.followers || 0,
            following: data.following || 0,
            liked_songs: data.liked_songs || [],
            following_artists: data.following_artists || []
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

        return { data: mappedData };
    }

    /**
     * Prepara los datos parciales del usuario para actualización en Strapi
     * @param data Datos parciales del User a actualizar
     * @returns Objeto con estructura compatible con Strapi para PUT/PATCH
     */
    setUpdate(data: Partial<User>): any {
        const mappedData: any = {};
        
        if (data.username !== undefined) mappedData.username = data.username;
        if (data.email !== undefined) mappedData.email = data.email;
        if (data.followers !== undefined) mappedData.followers = data.followers;
        if (data.following !== undefined) mappedData.following = data.following;
        if (data.following_ids !== undefined) mappedData.following_ids = data.following_ids;
        if (data.followers_FK !== undefined) mappedData.followers_FK = data.followers_FK;
        if (data.liked_songs !== undefined) mappedData.liked_songs = data.liked_songs;
        if (data.following_artists !== undefined) mappedData.following_artists = data.following_artists;
        
        // Manejar imagen - convertir diferentes formatos a ID numérico
        if (data.image !== undefined) {
            if (data.image === null) {
                mappedData.image = null; // Para remover imagen
            } else if (data.image) {
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
        }
        
        return { data: mappedData };
    }

    /**
     * Mapea la respuesta de Strapi después de una operación de creación
     * @param data Respuesta de Strapi tras POST
     * @returns Modelo User mapeado
     */
    getAdded(data: any): User {
        return this.getOne(data);
    }

    /**
     * Mapea la respuesta de Strapi después de una operación de actualización
     * @param data Respuesta de Strapi tras PUT/PATCH
     * @returns Modelo User mapeado
     */
    getUpdated(data: any): User {
        return this.getOne(data);
    }

    /**
     * Mapea la respuesta de Strapi después de una operación de eliminación
     * @param data Respuesta de Strapi tras DELETE
     * @returns Modelo User mapeado
     */
    getDeleted(data: any): User {
        return this.getOne(data);
    }
}
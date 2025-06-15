// src/app/repositories/impl/strapi-repository.service.ts
import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, Observable, catchError, tap, switchMap } from 'rxjs';
import { IBaseRepository, SearchParams } from '../intefaces/base-repository.interface';
import { API_URL_TOKEN, REPOSITORY_MAPPING_TOKEN, RESOURCE_NAME_TOKEN, STRAPI_AUTH_TOKEN } from '../repository.tokens';
import { Model } from '../../models/base.model';
import { IBaseMapping } from '../intefaces/base-mapping.interface';
import { Paginated } from '../../models/paginated.model';
import { IStrapiAuthentication } from '../../services/interfaces/strapi-authentication.interface';

/**
 * Interfaces para respuestas de Strapi v4
 */
export interface PaginatedRaw<T> {
  data: Data<T>[];
  meta: Meta;
}

export interface Data<T> {
  id: number;
  attributes: T;
}

export interface Meta {
  pagination: Pagination;
}

export interface Pagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

/**
 * Servicio de repositorio específico para Strapi v4
 * Implementa operaciones CRUD con autenticación Bearer token y populate para relaciones
 */
@Injectable({
  providedIn: 'root'
})
export class StrapiRepositoryService<T extends Model> implements IBaseRepository<T> {
  
  constructor(
    protected http: HttpClient,
    @Inject(STRAPI_AUTH_TOKEN) protected auth: IStrapiAuthentication,
    @Inject(API_URL_TOKEN) protected apiUrl: string,
    @Inject(RESOURCE_NAME_TOKEN) protected resource: string,
    @Inject(REPOSITORY_MAPPING_TOKEN) protected mapping: IBaseMapping<T>
  ) {}

  /**
   * Obtiene headers de autenticación con Bearer token
   * @returns Objeto con headers de autorización o vacío si no hay token
   */
  private getHeaders() {
    const token = this.auth.getToken();
    if (!token) {
      return {};
    }

    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  }

  /**
   * Obtiene todos los elementos con paginación y filtros específicos de Strapi
   * @param page Número de página (empezando en 1)
   * @param pageSize Tamaño de página
   * @param filters Filtros de búsqueda usando sintaxis Strapi
   * @returns Observable con elementos paginados
   */
  getAll(page: number, pageSize: number, filters: SearchParams = {}): Observable<T[] | Paginated<T>> {
    let url = `${this.apiUrl}/${this.resource}?populate=*`;

    // Agregar parámetros de paginación
    url += `&pagination[page]=${page}&pagination[pageSize]=${pageSize}`;

    // Procesar filtros con sintaxis específica de Strapi
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        switch(key) {
          case 'user':
            url += `&filters[users_IDS][id][$eq]=${value}`;
            break;
          case 'sort':
            url += `&sort[0]=${value}`;
            break;
          default:
            url += `&filters[${key}][$eq]=${value}`;
        }
      }
    });

    const headers = this.getHeaders();

    return this.http.get<PaginatedRaw<T>>(url, headers).pipe(
      map(res => {
        if (!res.meta?.pagination) {
          return this.mapping.getPaginated(page, pageSize, res.data.length, res.data);
        }
        return this.mapping.getPaginated(
          page,
          pageSize,
          res.meta.pagination.total,
          res.data
        );
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Obtiene un elemento específico por su ID con todas las relaciones pobladas
   * @param id ID del elemento a obtener
   * @returns Observable con el elemento encontrado o null si no existe
   */
  getById(id: string): Observable<T | null> {
    const url = `${this.apiUrl}/${this.resource}/${id}?populate=*`;
    
    return this.http.get<any>(url, this.getHeaders())
      .pipe(
        map(res => {
          if (res.data) {
            return this.mapping.getOne(res);
          } else if (res.id) {
            return this.mapping.getOne({ data: res });
          } else {
            return null;
          }
        }),
        catchError(error => {
          throw error;
        })
      );
  }

  /**
   * Crea un nuevo elemento con populate para obtener relaciones en la respuesta
   * @param entity Entidad a crear
   * @returns Observable con la entidad creada incluyendo relaciones
   */
  add(entity: T): Observable<T> {
    // Incluir populate para obtener relaciones en la respuesta
    const url = `${this.apiUrl}/${this.resource}?populate=*`;
    
    return this.http.post<T>(
      url,
      this.mapping.setAdd(entity),
      this.getHeaders()
    ).pipe(
      map(res => {
        const mappedResult = this.mapping.getAdded(res);
        return mappedResult;
      })
    );
  }

  /**
   * Actualiza un elemento existente sin wrapper "data" y hace GET para obtener datos completos
   * @param id ID del elemento a actualizar
   * @param entity Datos a actualizar
   * @returns Observable con la entidad actualizada incluyendo todas las relaciones
   */
  update(id: string, entity: T): Observable<T> {
    const updateUrl = `${this.apiUrl}/${this.resource}/${id}`;
    const mappedData = this.mapping.setUpdate(entity);
    
    // Usar contenido directo sin wrapper "data" para Strapi
    const bodyToSend = mappedData.data || mappedData;
    
    return this.http.put<any>(
      updateUrl,
      bodyToSend,
      this.getHeaders()
    ).pipe(
      // Después del PUT, hacer GET para obtener datos completos con relaciones
      switchMap(updateResponse => {
        const getUrl = `${this.apiUrl}/${this.resource}/${id}?populate=*`;
        return this.http.get<any>(getUrl, this.getHeaders());
      }),
      map(getResponse => {
        const mappedResult = this.mapping.getUpdated(getResponse);
        return mappedResult;
      }),
      catchError(error => {
        throw error;
      })
    );
  }
  
  /**
   * Elimina un elemento del recurso
   * @param id ID del elemento a eliminar
   * @returns Observable con la entidad eliminada
   */
  delete(id: string): Observable<T> {
    return this.http.delete<T>(
      `${this.apiUrl}/${this.resource}/${id}`,
      this.getHeaders()
    ).pipe(
      map(res => this.mapping.getDeleted(res))
    );
  }
}
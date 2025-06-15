// src/app/repositories/impl/json-server-repository.service.ts
import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { IBaseRepository, SearchParams } from '../intefaces/base-repository.interface';
import { API_URL_TOKEN, AUTH_TOKEN, REPOSITORY_MAPPING_TOKEN, RESOURCE_NAME_TOKEN } from '../repository.tokens';
import { Model } from '../../models/base.model';
import { IBaseMapping } from '../intefaces/base-mapping.interface';
import { Paginated } from '../../models/paginated.model';
import { BaseRepositoryHttpService } from './base-repository-http.service';
import { IAuthentication } from '../../services/interfaces/authentication.interface';

/**
 * Interfaz para respuestas paginadas de JSON Server
 */
export interface PaginatedRaw<T> {
  first: number;
  prev: number | null;
  next: number | null;
  last: number;
  pages: number;
  items: number;
  data: T[];
}

/**
 * Servicio de repositorio específico para JSON Server
 * Extiende BaseRepositoryHttpService para personalizar comportamientos específicos de JSON Server
 */
@Injectable({
  providedIn: 'root'
})
export class JsonServerRepositoryService<T extends Model> extends BaseRepositoryHttpService<T> {

  constructor(
    http: HttpClient,
    @Inject(AUTH_TOKEN) auth: IAuthentication,
    @Inject(API_URL_TOKEN) apiUrl: string, // URL base de la API JSON Server
    @Inject(RESOURCE_NAME_TOKEN) resource: string, // nombre del recurso del repositorio
    @Inject(REPOSITORY_MAPPING_TOKEN) mapping: IBaseMapping<T>
  ) {
    super(http, auth, apiUrl, resource, mapping);
  }

  /**
   * Obtiene todos los elementos con paginación y filtros específicos de JSON Server
   * @param page Número de página (empezando en 1)
   * @param pageSize Tamaño de página
   * @param filters Filtros de búsqueda usando sintaxis JSON Server (_like)
   * @returns Observable con array de elementos o elementos paginados
   */
  override getAll(page: number, pageSize: number, filters: SearchParams = {}): Observable<T[] | Paginated<T>> {
    // Construir cadena de filtros usando sintaxis _like de JSON Server
    let search: string = Object.entries(filters)
      .map(([k, v]) => `${k}_like=${v}`)
      .reduce((p, v) => `${p}${v}`, "");

    // Si page = -1, obtener todos los elementos sin paginación
    if (page !== -1) {
      // Solicitud paginada usando parámetros _page y _per_page de JSON Server
      return this.http.get<PaginatedRaw<T>>(
        `${this.apiUrl}/${this.resource}/?_page=${page}&_per_page=${pageSize}&${search}`)
        .pipe(map(res => {
          return this.mapping.getPaginated(page, pageSize, res.pages, res.data);
        }));
    } else {
      // Solicitud sin paginación - obtener todos los elementos
      return this.http.get<T[]>(
        `${this.apiUrl}/${this.resource}?&${search}`)
        .pipe(map(res => {
          return res.map((elem: any) => {
            return this.mapping.getOne(elem);
          });
        }));
    }
  }

  /**
   * Crea un nuevo elemento usando el endpoint POST de JSON Server
   * @param entity Entidad a crear
   * @returns Observable con la entidad creada y mapeada
   */
  override add(entity: T): Observable<T> {
    return this.http.post<T>(
      `${this.apiUrl}/${this.resource}`, 
      this.mapping.setAdd(entity)
    ).pipe(map(res => {
      return this.mapping.getAdded(res);
    }));
  }

  /**
   * Actualiza un elemento existente usando PATCH (actualización parcial)
   * @param id ID del elemento a actualizar
   * @param entity Datos parciales a actualizar
   * @returns Observable con la entidad actualizada y mapeada
   */
  override update(id: string, entity: T): Observable<T> {
    return this.http.patch<T>(
      `${this.apiUrl}/${this.resource}/${id}`, 
      this.mapping.setUpdate(entity)
    ).pipe(map(res => {
      return this.mapping.getUpdated(res);
    }));
  }
}
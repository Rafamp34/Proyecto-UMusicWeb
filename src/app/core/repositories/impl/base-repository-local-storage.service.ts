// src/app/repositories/impl/base-repository-localstorage.service.ts
import { Inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { IBaseRepository, SearchParams } from '../intefaces/base-repository.interface';
import { Model } from '../../models/base.model';
import { REPOSITORY_MAPPING_TOKEN, RESOURCE_NAME_TOKEN } from '../repository.tokens';
import { IBaseMapping } from '../intefaces/base-mapping.interface';
import { Paginated } from '../../models/paginated.model';

/**
 * Servicio de repositorio que utiliza LocalStorage como almacenamiento
 * Incluye datos de prueba (mockup) generados automáticamente
 */
@Injectable({
  providedIn: 'root'
})
export class BaseRepositoryLocalStorageService<T extends Model> implements IBaseRepository<T> {

  _items: T[] = [];

  /**
   * Genera un ID único aleatorio de 10 caracteres
   * @returns String con ID único
   */
  private newID(): string {
    const validChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let code = "";
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * validChars.length);
      code += validChars[randomIndex];
    }
    return code;
  }

  constructor(
    @Inject(RESOURCE_NAME_TOKEN) protected resource: string, // nombre del recurso del repositorio
    @Inject(REPOSITORY_MAPPING_TOKEN) protected mapping: IBaseMapping<T>
  ) {
    // Generar datos de prueba (mockup) si no existen en localStorage
    let mockupList: any[] = [];
    for (let i = 0; i < 100; i++) {
      let mockup = {
        name: {
          title: 'Mr',
          first: "Juan Antonio",
          last: "García Gómez"
        },
        age: 47,
        picture: {
          large: "https://picsum.photos/id/0/200/300",
          thumbnail: "https://picsum.photos/id/0/200/300"
        }
      };
      mockup.picture.large = `https://picsum.photos/id/${i}/200/300`;
      mockup.picture.thumbnail = `https://picsum.photos/id/${i}/200/300`;
      mockupList = [...mockupList, mockup];
    }

    // Cargar datos desde localStorage o usar datos de prueba
    this._items = JSON.parse(localStorage.getItem(resource) ?? JSON.stringify(mockupList));
    localStorage.setItem(this.resource, JSON.stringify(this._items));
  }

  /**
   * Obtiene todos los elementos con paginación
   * @param page Número de página (empezando en 0)
   * @param pageSize Tamaño de página
   * @param filters Filtros de búsqueda (no implementados en esta versión)
   * @returns Observable con elementos paginados
   */
  getAll(page: number, pageSize: number, filters: SearchParams = {}): Observable<Paginated<T>> {
    return of(
      this.mapping.getPaginated(
        page,
        pageSize,
        Math.ceil(this._items.length / pageSize),
        this._items.slice(
          page * pageSize,
          Math.min(
            (page + 1) * pageSize,
            this._items.length
          )
        )
      )
    );
  }

  /**
   * Obtiene un elemento por su ID
   * @param id ID del elemento a buscar
   * @returns Observable con el elemento encontrado o null si no existe
   */
  getById(id: string): Observable<T | null> {
    return of(this.mapping.getOne(this._items.find(item => item.id == id) ?? null));
  }

  /**
   * Añade un nuevo elemento al almacenamiento
   * @param entity Entidad a añadir
   * @returns Observable con la entidad añadida
   */
  add(entity: T): Observable<T> {
    entity.id = this.newID();
    entity.createdAt = (new Date()).toISOString();
    this._items.push(entity);
    localStorage.setItem(this.resource, JSON.stringify(this._items));
    return of(this.mapping.getAdded(entity));
  }

  /**
   * Actualiza un elemento existente
   * @param id ID del elemento a actualizar
   * @param entity Datos actualizados del elemento
   * @returns Observable con el elemento actualizado
   * @throws Error si el ID no se encuentra
   */
  update(id: string, entity: T): Observable<T> {
    let index = this._items.findIndex(item => item.id == id);
    if (index >= 0) {
      this._items[index] = entity;
      localStorage.setItem(this.resource, JSON.stringify(this._items));
      return of(this.mapping.getUpdated(this._items[index]));
    }
    throw new Error("id not found");
  }

  /**
   * Elimina un elemento del almacenamiento
   * @param id ID del elemento a eliminar
   * @returns Observable con el elemento eliminado
   * @throws Error si el ID no se encuentra
   */
  delete(id: string): Observable<T> {
    let index = this._items.findIndex(item => item.id == id);
    if (index >= 0) {
      let entity = this._items.splice(index, 1);
      localStorage.setItem(this.resource, JSON.stringify(this._items));
      return of(this.mapping.getDeleted(entity));
    }
    throw new Error("id not found");
  }
}
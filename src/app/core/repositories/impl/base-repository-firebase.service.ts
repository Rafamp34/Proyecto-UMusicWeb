// src/app/repositories/impl/base-repository-firebase.service.ts
import { Inject, Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  limit,
  startAfter,
  QueryConstraint
} from 'firebase/firestore';
import { from, map, Observable, mergeMap } from 'rxjs';
import { IBaseRepository, SearchParams } from '../intefaces/base-repository.interface';
import { FIREBASE_CONFIG_TOKEN, FIREBASE_COLLECTION_TOKEN, REPOSITORY_MAPPING_TOKEN } from '../repository.tokens';
import { Model } from '../../models/base.model';
import { IBaseMapping } from '../intefaces/base-mapping.interface';
import { Paginated } from '../../models/paginated.model';

/**
 * Servicio base para repositorios que utilizan Firebase Firestore
 * Implementa operaciones CRUD utilizando la API de Firestore
 */
@Injectable({
  providedIn: 'root'
})
export class BaseRepositoryFirebaseService<T extends Model> implements IBaseRepository<T> {
  private db;
  private collectionRef;

  constructor(
    @Inject(FIREBASE_CONFIG_TOKEN) protected firebaseConfig: any,
    @Inject(FIREBASE_COLLECTION_TOKEN) protected collectionName: string,
    @Inject(REPOSITORY_MAPPING_TOKEN) protected mapping: IBaseMapping<T>
  ) {
    // Inicializar Firebase y obtener referencia a Firestore
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
    this.collectionRef = collection(this.db, this.collectionName);
  }

  /**
   * Obtiene el último documento de la página anterior para implementar paginación cursor
   * @param page Número de página actual
   * @param pageSize Tamaño de página
   * @returns Promise con el último documento de la página anterior o null si es la primera página
   */
  private async getLastDocumentOfPreviousPage(page: number, pageSize: number) {
    if (page <= 1) return null;
    
    // Obtener todos los documentos hasta la página anterior
    const previousPageQuery = query(
      this.collectionRef,
      limit((page - 1) * pageSize)
    );
    
    const snapshot = await getDocs(previousPageQuery);
    const docs = snapshot.docs;
    return docs[docs.length - 1];
  }

  /**
   * Obtiene todos los elementos con paginación cursor de Firestore
   * @param page Número de página
   * @param pageSize Tamaño de página
   * @param filters Filtros de búsqueda (no implementados en esta versión básica)
   * @returns Observable con elementos paginados
   */
  getAll(page: number, pageSize: number, filters: SearchParams): Observable<T[] | Paginated<T>> {
    return from(this.getLastDocumentOfPreviousPage(page, pageSize)).pipe(
      map(lastDoc => {
        const constraints: QueryConstraint[] = [
          limit(pageSize)
        ];
        
        // Si hay un documento anterior, iniciar después de él (paginación cursor)
        if (lastDoc) {
          constraints.push(startAfter(lastDoc));
        }
        
        return query(this.collectionRef, ...constraints);
      }),
      mergeMap(q => getDocs(q)),
      map(snapshot => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        return this.mapping.getPaginated(page, pageSize, snapshot.size, items as T[]);
      })
    );
  }

  /**
   * Obtiene un documento específico por su ID
   * @param id ID del documento a obtener
   * @returns Observable con el elemento encontrado o null si no existe
   */
  getById(id: string): Observable<T | null> {
    const docRef = doc(this.db, this.collectionName, id);
    return from(getDoc(docRef)).pipe(
      map(doc => {
        if (doc.exists()) {
          return this.mapping.getOne({ id: doc.id, ...doc.data() } as T);
        }
        return null;
      })
    );
  }

  /**
   * Añade un nuevo documento a la colección
   * @param entity Entidad a añadir
   * @returns Observable con la entidad creada incluyendo el ID generado por Firestore
   */
  add(entity: T): Observable<T> {
    return from(addDoc(this.collectionRef, this.mapping.setAdd(entity))).pipe(
      map(docRef => this.mapping.getAdded({ ...entity, id: docRef.id } as T))
    );
  }

  /**
   * Actualiza un documento existente
   * @param id ID del documento a actualizar
   * @param entity Datos a actualizar
   * @returns Observable con la entidad actualizada
   */
  update(id: string, entity: T): Observable<T> {
    const docRef = doc(this.db, this.collectionName, id);
    
    return from(updateDoc(docRef, this.mapping.setUpdate(entity))).pipe(
      map(() => this.mapping.getUpdated({ ...entity, id } as T))
    );
  }

  /**
   * Elimina un documento de la colección
   * @param id ID del documento a eliminar
   * @returns Observable con la entidad eliminada
   */
  delete(id: string): Observable<T> {
    const docRef = doc(this.db, this.collectionName, id);
    return from(getDoc(docRef)).pipe(
      map(doc => ({ id: doc.id, ...doc.data() } as T)),
      map(entity => {
        deleteDoc(docRef);
        return this.mapping.getDeleted(entity);
      })
    );
  }
}
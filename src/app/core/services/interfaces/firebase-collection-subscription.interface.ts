import { Inject, Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  onSnapshot,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { Observable, Subject } from 'rxjs';
import { ICollectionSubscription } from '../interfaces/collection-subscription.interface';
import { 
  FIREBASE_CONFIG_TOKEN, 
  SONGS_REPOSITORY_MAPPING_TOKEN,
  PLAYLISTS_REPOSITORY_MAPPING_TOKEN,
  USERS_REPOSITORY_MAPPING_TOKEN,
  ARTISTS_REPOSITORY_MAPPING_TOKEN
} from '../../repositories/repository.tokens';
import { Model } from '../../models/base.model';
import { IBaseMapping } from '../../repositories/intefaces/base-mapping.interface';
import { CollectionChange } from '../interfaces/collection-subscription.interface';
import { Song } from '../../models/song.model';
import { Playlist } from '../../models/playlist.model';
import { User } from '../../models/user.model';
import { Artist } from '../../models/artist.model';

@Injectable({
  providedIn: 'root'
})
export class FirebaseCollectionSubscriptionService<T extends Model> implements ICollectionSubscription<T> {
  private db;
  private subscriptions: Map<string, Subject<CollectionChange<T>>> = new Map();
  private unsubscribeFunctions: Map<string, () => void> = new Map();

  constructor(
    @Inject(FIREBASE_CONFIG_TOKEN) protected firebaseConfig: any,
    @Inject(SONGS_REPOSITORY_MAPPING_TOKEN) private songMapping: IBaseMapping<Song>,
    @Inject(PLAYLISTS_REPOSITORY_MAPPING_TOKEN) private playlistMapping: IBaseMapping<Playlist>,
    @Inject(USERS_REPOSITORY_MAPPING_TOKEN) private userMapping: IBaseMapping<User>,
    @Inject(ARTISTS_REPOSITORY_MAPPING_TOKEN) private artistMapping: IBaseMapping<Artist>
  ) {
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
  }

  private getMappingForCollection(collectionName: string): IBaseMapping<any> {
    switch(collectionName) {
      case 'songs': return this.songMapping;
      case 'playlists': return this.playlistMapping;
      case 'users': return this.userMapping;
      case 'artists': return this.artistMapping;
      default: 
        throw new Error(`No mapping found for collection: ${collectionName}`);
    }
  }

  subscribe(collectionName: string): Observable<CollectionChange<T>> {
    if (this.subscriptions.has(collectionName)) {
      return this.subscriptions.get(collectionName)!.asObservable();
    }

    const subject = new Subject<CollectionChange<T>>();
    this.subscriptions.set(collectionName, subject);

    const mapping = this.getMappingForCollection(collectionName);

    const unsubscribe = onSnapshot(
      collection(this.db, collectionName),
      (snapshot: QuerySnapshot<DocumentData>) => {
        snapshot.docChanges().forEach(change => {
          const changeData: CollectionChange<T> = {
            type: change.type as 'added' | 'modified' | 'removed',
            id: change.doc.id
          };

          if (change.type !== 'removed') {
            changeData.data = mapping.getOne({
              id: change.doc.id,
              ...change.doc.data()
            } as T);
          }

          subject.next(changeData);
        });
      },
      error => {
        console.error(`Error en suscripción a ${collectionName}:`, error);
        subject.error(error);
      }
    );

    this.unsubscribeFunctions.set(collectionName, unsubscribe);
    return subject.asObservable();
  }

  unsubscribe(collectionName: string): void {
    const unsubscribe = this.unsubscribeFunctions.get(collectionName);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribeFunctions.delete(collectionName);
    }

    const subject = this.subscriptions.get(collectionName);
    if (subject) {
      subject.complete();
      this.subscriptions.delete(collectionName);
    }
  }

  ngOnDestroy() {
    // Limpiar todas las suscripciones al destruir el servicio
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.forEach(subject => subject.complete());
    this.unsubscribeFunctions.clear();
    this.subscriptions.clear();
  }
}
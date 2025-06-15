import { Observable } from "rxjs";
import { Model } from "../../models/base.model";
export interface CollectionChange<T> {
    type: 'added' | 'modified' | 'removed';
    data?: T;
    id: string;
}
export interface ICollectionSubscription<T extends Model> {
    subscribe(collectionName: string): Observable<CollectionChange<T>>;
    unsubscribe(collectionName: string): void;
}
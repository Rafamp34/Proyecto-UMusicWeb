import { Inject, Injectable } from "@angular/core";
import { IAuthentication } from "../interfaces/authentication.interface";
import { BehaviorSubject, Observable } from "rxjs";
import { IAuthMapping } from "../interfaces/auth-mapping.interface";
import { User } from "../../models/user.model";

@Injectable({
    providedIn: 'root'
})
export abstract class BaseAuthenticationService implements IAuthentication {
    protected _authenticated: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public authenticated$: Observable<boolean> = this._authenticated.asObservable();

    protected _user: BehaviorSubject<User | undefined> = new BehaviorSubject<User | undefined>(undefined);
    public user$: Observable<User | undefined> = this._user.asObservable();
    
    // CAMBIO IMPORTANTE: Inicializar ready$ como false hasta que se complete la inicialización
    protected _ready: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    public ready$: Observable<boolean> = this._ready.asObservable();

    constructor(
        protected authMapping: IAuthMapping
    ) {
    }

    // Método para actualizar el usuario actual
    protected updateCurrentUser(user: User) {
        this._user.next(user);
    }

    abstract getCurrentUser(): Promise<any>;
    abstract signIn(authPayload: any): Observable<any>;
    abstract signUp(registerPayload: any): Observable<any>;
    abstract signOut(): Observable<any>;
    abstract me(): Observable<any>;
}

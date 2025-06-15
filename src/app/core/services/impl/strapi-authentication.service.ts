import { Inject, Injectable } from '@angular/core';
import { filter, map, Observable, of, throwError, tap, firstValueFrom, lastValueFrom } from 'rxjs';
import { BaseAuthenticationService } from './base-authentication.service';
import { AUTH_MAPPING_TOKEN, AUTH_ME_API_URL_TOKEN, AUTH_SIGN_IN_API_URL_TOKEN, AUTH_SIGN_UP_API_URL_TOKEN } from '../../repositories/repository.tokens';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IAuthMapping } from '../interfaces/auth-mapping.interface';
import { StrapiMeResponse, StrapiSignInResponse, StrapiSignUpResponse } from './strapi-auth-mapping.service';
import { IStrapiAuthentication } from '../interfaces/strapi-authentication.interface';
import { User } from '../../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class StrapiAuthenticationService extends BaseAuthenticationService implements IStrapiAuthentication {
  private readonly TOKEN_KEY = 'people-jwt-token';
  private jwt_token: string | null = null;
  private initializationPromise: Promise<void> | null = null;

  constructor(
    @Inject(AUTH_SIGN_IN_API_URL_TOKEN) protected signInUrl: string,
    @Inject(AUTH_SIGN_UP_API_URL_TOKEN) protected signUpUrl: string,
    @Inject(AUTH_ME_API_URL_TOKEN) protected meUrl: string,
    @Inject(AUTH_MAPPING_TOKEN) authMapping: IAuthMapping,
    private httpClient: HttpClient
  ) {
    super(authMapping);
    // NO llamar initializeAuthentication() aquí directamente
    this.initializeAuthenticationSafely();
  }

  private initializeAuthenticationSafely() {
    // Crear una promesa de inicialización para evitar múltiples ejecuciones
    this.initializationPromise = this.initializeAuthentication();
  }

  private getHeaders(): { headers: HttpHeaders } {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.jwt_token}`);
    return { headers };
  }

  private async initializeAuthentication(): Promise<void> {    
    try {
      this.jwt_token = localStorage.getItem(this.TOKEN_KEY);
      
      if (this.jwt_token) {
        
        try {
          const headers = new HttpHeaders().set('Authorization', `Bearer ${this.jwt_token}`);
          const meUrlWithPopulate = `${this.meUrl}?populate=*`;
          
          
          const response = await lastValueFrom(
            this.httpClient.get<any>(meUrlWithPopulate, { headers })
          );
          
          
          const mappedUser = this.authMapping.me(response);
          
          // Validar que el usuario mapeado es válido
          if (!mappedUser || mappedUser.id === 'unknown' || mappedUser.email === 'unknown@example.com') {
            console.error('StrapiAuth: Invalid mapped user, clearing authentication');
            this.clearAuthentication();
          } else {
            this._authenticated.next(true);
            this._user.next(mappedUser);
          }
          
        } catch (error) {
          console.error('StrapiAuth: Error verifying token with server:', error);
          // Token inválido o expirado
          this.clearAuthentication();
        }
        
      } else {
        this._authenticated.next(false);
        this._user.next(undefined);
      }
      
    } catch (error) {
      console.error('StrapiAuth: Critical error during initialization:', error);
      this.clearAuthentication();
    } finally {
      // SIEMPRE marcar como ready al final, independientemente del resultado
      this._ready.next(true);
    }
  }

  async getCurrentUser(): Promise<User | undefined> {    
    // Esperar a que la inicialización se complete
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
    
    // Esperar a que ready$ sea true
    await firstValueFrom(this._ready.pipe(filter(ready => ready === true)));
    
    const currentUser = await firstValueFrom(this._user);
    
    return currentUser;
  }

  private clearAuthentication() {
    this.jwt_token = null;
    localStorage.removeItem(this.TOKEN_KEY);
    this._authenticated.next(false);
    this._user.next(undefined);
  }
  
  async changePassword(data: {oldPassword: string, newPassword: string}): Promise<any> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('No user logged in');
  
    try {
      const response = await lastValueFrom(this.httpClient.post(
        `${this.meUrl.replace('/api/users/me', '/api/auth/change-password')}`,
        {
          currentPassword: data.oldPassword,
          password: data.newPassword,
          passwordConfirmation: data.newPassword
        },
        this.getHeaders()
      ));
      return response;
    } catch (error: any) {
      if (error.error?.error?.message) {
        throw new Error(error.error.error.message);
      }
      throw error;
    }
  }

  getToken(): string | null {
    return this.jwt_token;
  }

  signIn(authPayload: any): Observable<User> {
    const mappedPayload = this.authMapping.signInPayload(authPayload);
    
    return this.httpClient.post<StrapiSignInResponse>(
      this.signInUrl, 
      mappedPayload
    ).pipe(
      tap(response => {
        if (response?.jwt) {
          this.jwt_token = response.jwt;
          localStorage.setItem(this.TOKEN_KEY, response.jwt);
          this._authenticated.next(true);
          this._user.next(this.authMapping.signIn(response));
        }
      }),
      map(response => this.authMapping.signIn(response))
    );
  }

  me(): Observable<any> {
    if (!this.jwt_token) {
      return throwError(() => new Error('No authentication token available'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.jwt_token}`);
    const meUrlWithPopulate = `${this.meUrl}?populate=*`;
    
    return this.httpClient.get<any>(meUrlWithPopulate, { headers }).pipe(
      map(response => {
        return { data: response };
      })
    );
  }

  signUp(signUpPayload: any): Observable<User> {
    return this.httpClient.post<StrapiSignUpResponse>(
      this.signUpUrl, 
      this.authMapping.signUpPayload(signUpPayload)
    ).pipe(
      tap(response => {
        if (response?.jwt) {
          this.jwt_token = response.jwt;
          localStorage.setItem(this.TOKEN_KEY, response.jwt);
          this._authenticated.next(true);
          this._user.next(this.authMapping.signUp(response));
        }
      }),
      map(response => this.authMapping.signUp(response))
    );
  }

  signOut(): Observable<boolean> {
    return of(true).pipe(
      tap(() => {
        this.clearAuthentication();
      })
    );
  }
}
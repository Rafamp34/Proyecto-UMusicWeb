import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { BaseAuthenticationService } from '../services/impl/base-authentication.service';
import { filter, map, switchMap, take, timeout, catchError } from 'rxjs';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(BaseAuthenticationService);
    const router = inject(Router);

    return authService.ready$.pipe(
        filter(isReady => {
            return isReady === true;
        }),
        take(1), // Solo tomar el primer valor true
        
        switchMap(() => {
            return authService.authenticated$.pipe(
                take(1), // Tomar el estado actual
                timeout(5000), // Timeout de 5 segundos para evitar bloqueos
                catchError(error => {
                    return of(false);
                })
            );
        }),
        
        map(isLoggedIn => {
            
            if (isLoggedIn) {
                return true;
            } else {
                router.navigate(['/login'], { 
                    queryParams: { returnUrl: state.url } 
                });
                return false;
            }
        }),
        
        catchError(error => {
            // En caso de error crítico, redirigir al login
            router.navigate(['/login'], { 
                queryParams: { returnUrl: state.url } 
            });
            return of(false);
        })
    );
};
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BaseAuthenticationService } from '../services/impl/base-authentication.service';
import { filter, map, switchMap, take } from 'rxjs';

/**
 * Guardia que impide el acceso a las rutas de login y registro si el usuario ya está autenticado
 * Redirige a la página de inicio si el usuario ya ha iniciado sesión
 */
export const noAuthGuard: CanActivateFn = (route, state) => {
    const authService = inject(BaseAuthenticationService);
    const router = inject(Router);

    return authService.ready$.pipe(
        filter(isReady => {
            return isReady === true;
        }),
        take(1),
        switchMap(() => {
            return authService.authenticated$;
        }),
        take(1),
        map(isAuthenticated => {
            if (isAuthenticated) {
                router.navigate(['/home']);
                return false;
            }
            return true;
        })
    );
};
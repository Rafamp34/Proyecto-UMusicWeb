import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { timer, Subscription } from 'rxjs';
import { BaseAuthenticationService } from 'src/app/core/services/impl/base-authentication.service';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { LottieComponent, AnimationOptions } from 'ngx-lottie';
import type { AnimationItem } from 'lottie-web';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, LottieComponent]
})
export class SplashPage implements OnInit, OnDestroy {
  
  // Configuración de Lottie
  lottieOptions: AnimationOptions = {
    path: '/assets/lotties/splash.json',
    autoplay: true,
    loop: true,
    renderer: 'svg' as const, // Mejor rendimiento para móviles
    rendererSettings: {
      progressiveLoad: true,
      preserveAspectRatio: 'xMidYMid meet', // Mantener proporción
      hideOnTransparent: true,
      className: 'lottie-animation'
    }
  };

  private animationItem?: AnimationItem;
  private navigationSubscription?: Subscription;
  private isNavigating = false;

  constructor(
    private router: Router,
    private authSvc: BaseAuthenticationService
  ) {}

  ngOnInit() {
    this.initSplashTimer();
  }

  ngOnDestroy() {
    // Limpiar subscripciones
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
    
    // Limpiar animación Lottie
    if (this.animationItem) {
      this.animationItem.destroy();
    }
  }

  /**
   * Callback cuando se crea la animación Lottie
   */
  animationCreated(animationItem: AnimationItem): void {
    this.animationItem = animationItem;
    console.log('UMusic splash animation created');
    
    // Opcional: Ajustar velocidad de la animación
    this.animationItem.setSpeed(1.2);
    
    // Opcional: Configurar eventos de la animación
    this.animationItem.addEventListener('complete', () => {
      console.log('Splash animation completed');
    });

    this.animationItem.addEventListener('loopComplete', () => {
      console.log('Splash animation loop completed');
    });
  }

  /**
   * Inicializa el timer del splash screen
   */
  private initSplashTimer(): void {
    // Duración del splash (3 segundos)
    const splashDuration = 3000;
    
    this.navigationSubscription = timer(splashDuration).subscribe(() => {
      this.navigateToHome();
    });
  }

  /**
   * Navega a la página principal
   */
  private navigateToHome(): void {
    if (this.isNavigating) {
      return;
    }
    
    this.isNavigating = true;
    
    // Opcional: Añadir efecto de fade out antes de navegar
    const splashContainer = document.querySelector('.splash-container') as HTMLElement;
    if (splashContainer) {
      splashContainer.style.transition = 'opacity 0.5s ease-out';
      splashContainer.style.opacity = '0';
      
      // Navegar después del fade out
      setTimeout(() => {
        this.performNavigation();
      }, 500);
    } else {
      this.performNavigation();
    }
  }

  /**
   * Realiza la navegación basada en el estado de autenticación
   */
  private performNavigation(): void {
    // Verificar si el usuario está autenticado usando authenticated$
    this.authSvc.authenticated$.subscribe({
      next: (isAuthenticated: boolean) => {
        if (isAuthenticated) {
          // Usuario autenticado, ir al home
          this.router.navigate(['/home'], { 
            replaceUrl: true
          });
        } else {
          // Usuario no autenticado, ir al login
          this.router.navigate(['/login'], { 
            replaceUrl: true
          });
        }
      },
      error: (error: any) => {
        console.error('Error checking authentication status:', error);
        // En caso de error, ir al home por defecto
        this.router.navigate(['/home'], { 
          replaceUrl: true
        });
      }
    });
  }

  /**
   * Método para saltar el splash (opcional)
   * Se puede llamar desde el template si se quiere permitir skip
   */
  skipSplash(): void {
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
    
    this.navigateToHome();
  }

  /**
   * Pausa/resume la animación Lottie
   */
  toggleAnimation(): void {
    if (this.animationItem) {
      if (this.animationItem.isPaused) {
        this.animationItem.play();
      } else {
        this.animationItem.pause();
      }
    }
  }
}
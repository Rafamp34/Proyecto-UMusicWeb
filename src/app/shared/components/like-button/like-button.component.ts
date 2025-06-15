// src/app/shared/components/like-button/like-button.component.ts
import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { lastValueFrom, Subject } from 'rxjs';
import { takeUntil, finalize, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { SocialService } from '../../../core/services/impl/social.service';
import { ToastController } from '@ionic/angular';

@Component({
    selector: 'app-like-button',
    templateUrl: './like-button.component.html',
    styleUrls: ['./like-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LikeButtonComponent implements OnInit, OnDestroy {
    @Input() songId!: string;
    @Input() showCount: boolean = false;
    @Input() size: 'small' | 'default' | 'large' = 'default';
    
    isLiked = false;
    loading = false;
    private destroy$ = new Subject<void>();
    private operationInProgress = false;
    
    // ID único para debugging
    private componentId = Math.random().toString(36).substr(2, 9);

    constructor(
        private socialService: SocialService,
        private toastController: ToastController,
        private cdr: ChangeDetectorRef
    ) {
    }

    ngOnInit() {
        
        if (this.songId) {
            this.subscribeToLikeStatus();
        } else {
            console.warn(`LikeButton[${this.componentId}]: No songId provided`);
        }
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Suscribirse a cambios de estado de like
     */
    private subscribeToLikeStatus() {        
        this.socialService.isSongLiked(this.songId)
            .pipe(
                takeUntil(this.destroy$),
                distinctUntilChanged(), // Solo si el valor cambió
                debounceTime(10) // Pequeño delay para evitar múltiples actualizaciones
            )
            .subscribe({
                next: (isLiked: boolean) => {
                    
                    // Solo actualizar si realmente cambió
                    if (this.isLiked !== isLiked) {
                        this.isLiked = isLiked;
                        this.cdr.markForCheck();
                    }
                },
                error: (error: any) => {
                    console.error(`LikeButton[${this.componentId}]: Error in like status subscription:`, error);
                }
            });
    }

    /**
     * Toggle like/unlike
     */
    async toggleLike() {
        if (this.operationInProgress || this.loading || !this.songId) return;

        this.operationInProgress = true;
        this.loading = true;
        this.cdr.markForCheck();
        
        const wasLiked = this.isLiked;
        
        try {
            // Cambiar el estado inmediatamente para feedback visual
            this.isLiked = !wasLiked;
            this.cdr.markForCheck();
            
            const serviceCall = wasLiked 
                ? this.socialService.unlikeSong(this.songId)
                : this.socialService.likeSong(this.songId);
            
            const success = await lastValueFrom(serviceCall);
            
            if (!success) {
                // Revertir si falla
                this.isLiked = wasLiked;
                await this.showToast('Error al actualizar favoritos');
            }
        } catch (error) {
            this.isLiked = wasLiked;
            await this.showToast('Error de conexión');
            console.error('Error in toggleLike:', error);
        } finally {
            this.loading = false;
            this.operationInProgress = false;
            this.cdr.markForCheck();
        }
    }

    /**
     * Mostrar toast
     */
    private async showToast(message: string) {
        try {
            const toast = await this.toastController.create({
                message,
                duration: 2000,
                position: 'bottom'
            });
            await toast.present();
        } catch (error) {
            console.error(`LikeButton[${this.componentId}]: Error showing toast:`, error);
        }
    }
}
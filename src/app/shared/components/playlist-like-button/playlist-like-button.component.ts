// src/app/shared/components/playlist-like-button/playlist-like-button.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ToastController } from '@ionic/angular';

@Component({
    selector: 'app-playlist-like-button',
    templateUrl: './playlist-like-button.component.html',
    styleUrls: ['./playlist-like-button.component.scss']
})
export class PlaylistLikeButtonComponent implements OnInit, OnDestroy {
    @Input() playlistId!: string;
    
    isLiked = false;
    loading = false;
    private destroy$ = new Subject<void>();

    constructor(
        private toastController: ToastController
    ) {}

    ngOnInit() {
        this.checkIfLiked();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private checkIfLiked() {
        this.isLiked = false;
    }

    async toggleLike() {
        if (this.loading) return;
        
        this.loading = true;
        
        try {
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        
        if (this.isLiked) {
            await this.showToast('Eliminado de favoritos');
            this.isLiked = false;
        } else {
            await this.showToast('Añadido a favoritos');
            this.isLiked = true;
        }
        } catch (error) {
        console.error('Error toggling playlist like:', error);
        await this.showToast('Error al actualizar favoritos');
        } finally {
        this.loading = false;
        }
    }

    private async showToast(message: string) {
        const toast = await this.toastController.create({
        message,
        duration: 2000,
        position: 'bottom'
        });
        await toast.present();
    }
}
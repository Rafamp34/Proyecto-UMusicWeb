// src/app/shared/components/follow-artist-button/follow-artist-button.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SocialService } from '../../../core/services/impl/social.service';
import { ToastController } from '@ionic/angular';

@Component({
    selector: 'app-follow-artist-button',
    templateUrl: './follow-artist-button.component.html',
    styleUrls: ['./follow-artist-button.component.scss']
})
export class FollowArtistButtonComponent implements OnInit, OnDestroy {
    @Input() artistId!: string;
    @Input() artistName?: string;
    @Input() size: 'small' | 'default' = 'default';
    
    isFollowing = false;
    loading = false;
    private destroy$ = new Subject<void>();

    constructor(
        private socialService: SocialService,
        private toastController: ToastController
    ) {}

    ngOnInit() {
        this.checkIfFollowing();
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private checkIfFollowing() {
        this.socialService.isArtistFollowed(this.artistId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(isFollowing => {
            this.isFollowing = isFollowing;
        });
    }

    async toggleFollow() {
        if (this.loading) return;
        
        this.loading = true;
        
        try {
        if (this.isFollowing) {
            const success = await this.socialService.unfollowArtist(this.artistId).toPromise();
            if (success) {
            this.isFollowing = false;
            await this.showToast(`Dejaste de seguir a ${this.artistName || 'este artista'}`);
            }
        } else {
            const success = await this.socialService.followArtist(this.artistId).toPromise();
            if (success) {
            this.isFollowing = true;
            await this.showToast(`Ahora sigues a ${this.artistName || 'este artista'}`);
            }
        }
        } catch (error) {
        console.error('Error toggling follow:', error);
        await this.showToast('Error al actualizar seguimiento');
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
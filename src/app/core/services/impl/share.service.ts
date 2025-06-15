import { Injectable } from '@angular/core';
import { Share } from '@capacitor/share';
import { Platform } from '@ionic/angular';

@Injectable({
    providedIn: 'root'
    })
export class ShareService {

    constructor(private platform: Platform) {}

    async shareItem(options: {
        title?: string;
        text?: string;
        url?: string;
        dialogTitle?: string;
    }): Promise<void> {
        if (this.platform.is('capacitor')) {
        const shareRet = await Share.share({
            title: options.title,
            text: options.text,
            url: options.url,
            dialogTitle: options.dialogTitle
        });
        console.log('Share result:', shareRet);
        } else {
        if (navigator.share) {
            try {
            await navigator.share({
                title: options.title,
                text: options.text,
                url: options.url
            });
            console.log('Web share successful');
            } catch (error) {
            console.error('Error sharing via Web API:', error);
            this.fallbackShare(options);
            }
        } else {
            console.log('Web Share API not supported');
            this.fallbackShare(options);
        }
        }
    }

    private fallbackShare(options: {
        title?: string;
        text?: string;
        url?: string;
    }): void {
        console.log('Using fallback share method');
    }
}
import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, Platform } from '@ionic/angular';
import { lastValueFrom } from 'rxjs';
import { Playlist } from 'src/app/core/models/playlist.model';
import { BaseAuthenticationService } from 'src/app/core/services/impl/base-authentication.service';
import { BaseMediaService } from 'src/app/core/services/impl/base-media.service';

@Component({
  selector: 'app-playlist-modal',
  templateUrl: './playlist-modal.component.html',
  styleUrls: ['./playlist-modal.component.scss'],
})
export class PlaylistModalComponent {
  formGroup: FormGroup;
  mode: 'new' | 'edit' = 'new';
  isMobile: boolean = false;

  @Input() set playlist(_playlist: Playlist) {
    if (_playlist && _playlist.id) {
      this.mode = 'edit';
      this.formGroup.patchValue({
        name: _playlist.name,
        author: _playlist.author,
        duration: _playlist.duration,
        image: _playlist.image?.url,
        song_IDS: _playlist.song_IDS,
        users_IDS: _playlist.users_IDS
      });
    }
  }

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private platform: Platform,
    private authSvc: BaseAuthenticationService,
    private mediaService: BaseMediaService,
  ) {
    this.isMobile = this.platform.is('ios') || this.platform.is('android');
    this.formGroup = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      image: [null],
      song_IDS: [[]],
      users_IDS: [[]]
    });

    // ✅ DEBUG: Escuchar cambios en la imagen
    this.formGroup.get('image')?.valueChanges.subscribe(value => {
      console.log('🖼️ Image control value changed:', value);
      console.log('🖼️ Image type:', typeof value);
      if (typeof value === 'string') {
        console.log('🖼️ Image starts with data:', value?.startsWith?.('data:'));
        console.log('🖼️ Image starts with blob:', value?.startsWith?.('blob:'));
        console.log('🖼️ Image first 50 chars:', value?.substring(0, 50));
      }
    });

    this.authSvc.user$.subscribe(user => {
      if (user) {
        this.formGroup.patchValue({
          users_IDS: [user.id]
        });
      }
    });
  }

  getDirtyValues(formGroup: FormGroup): any {
    const dirtyValues: any = {};
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control?.dirty) {
        dirtyValues[key] = control.value;
      }
    });
    return dirtyValues;
  }

  async onSubmit() {
    if (this.formGroup.valid) {
      try {
        const formData = { ...this.formGroup.value };
        
        console.log('📋 Form data before processing:', formData);
        console.log('📋 Image in form data:', formData.image);
        
        // ✅ MANEJO CORREGIDO DE LA IMAGEN BASE64
        if (formData.image && typeof formData.image === 'string' && formData.image.trim() !== '') {
          try {
            let imageToUpload: Blob;
            
            // Si es una data URL (base64)
            if (formData.image.startsWith('data:')) {
              console.log('🔄 Converting base64 to blob...');
              imageToUpload = this.dataURLtoBlob(formData.image);
              console.log('✅ Blob created:', imageToUpload);
            } 
            // Si es una blob URL
            else if (formData.image.startsWith('blob:')) {
              console.log('🔄 Fetching blob from URL...');
              const response = await fetch(formData.image);
              imageToUpload = await response.blob();
              console.log('✅ Blob fetched:', imageToUpload);
            }
            else {
              console.log('❌ Unknown image format, skipping upload. Format:', formData.image.substring(0, 20));
              delete formData.image;
              throw new Error('Unknown image format');
            }
            
            console.log('📤 Uploading image blob. Size:', imageToUpload.size, 'Type:', imageToUpload.type);
            const uploadResult = await lastValueFrom(this.mediaService.upload(imageToUpload));
            console.log('✅ Upload result COMPLETO:', uploadResult);
            console.log('✅ Upload result tipo:', typeof uploadResult);
            console.log('✅ Upload result[0]:', uploadResult[0]);
            
            if (uploadResult && uploadResult[0]) {
              // 🔧 FORMATO CORREGIDO PARA STRAPI V4 - Necesita ser enviado como relación
              formData.image = uploadResult[0]; // Solo el ID para crear la relación en Strapi
              
              console.log('✅ Image processed successfully. ID:', formData.image);
              console.log('✅ Image type:', typeof formData.image);
            } else {
              console.log('❌ Upload failed - no result');
              delete formData.image;
            }
            
          } catch (error) {
            console.error('❌ Error uploading image:', error);
            delete formData.image;
          }
        } else {
          console.log('⚠️ No image to process. Image value:', formData.image);
          // Si no hay imagen nueva, eliminar el campo en modo edición para no sobrescribir
          if (this.mode === 'edit') {
            delete formData.image;
          }
        }

        if (this.mode === 'new') {
          const user = await this.authSvc.getCurrentUser();
          formData.author = user?.username || 'Unknown';
          formData.duration = '0:00';
          formData.song_IDS = [];
          formData.users_IDS = [user?.id];
        }

        const role = this.mode === 'new' ? 'create' : 'update';
        const data = this.mode === 'new' ? 
          formData : 
          this.getDirtyValues(this.formGroup);
        
        console.log('📤 Final data to submit:', data);
        console.log('📤 Image specifically:', data.image);
        console.log('📤 Image type:', typeof data.image);
        console.log('📤 Image JSON:', JSON.stringify(data.image));
        
        this.modalCtrl.dismiss(data, role);
      } catch (error) {
        console.error('❌ Error in submit:', error);
      }
    } else {
      console.log('❌ Form is invalid:', this.formGroup.errors);
      console.log('❌ Form controls status:', {
        name: this.formGroup.get('name')?.status,
        image: this.formGroup.get('image')?.status
      });
    }
  }

  // ✅ MÉTODO AUXILIAR PARA CONVERTIR BASE64 A BLOB
  private dataURLtoBlob(dataURL: string): Blob {
    try {
      const arr = dataURL.split(',');
      const mime = arr[0].match(/:(.*?);/)![1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      
      const blob = new Blob([u8arr], { type: mime });
      console.log('🔧 dataURLtoBlob created blob:', {
        size: blob.size,
        type: blob.type,
        originalMime: mime
      });
      return blob;
    } catch (error) {
      console.error('❌ Error in dataURLtoBlob:', error);
      throw error;
    }
  }

  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
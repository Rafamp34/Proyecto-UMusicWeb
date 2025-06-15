import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoadingController, ModalController, ToastController, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';
import { User } from 'src/app/core/models/user.model';
import { UserService } from 'src/app/core/services/impl/user.service';
import { BaseMediaService } from 'src/app/core/services/impl/base-media.service';
import { ChangePasswordModalComponent } from '../change-password-modal/change-password-modal.component';

// ✅ FUNCIÓN AUXILIAR PARA CONVERTIR DATA URL A BLOB
function dataURLtoBlob(dataurl: string): Blob {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

@Component({
  selector: 'app-edit-profile-modal',
  templateUrl: './edit-profile-modal.component.html',
  styleUrls: ['./edit-profile-modal.component.scss'],
})
export class EditProfileModalComponent implements OnInit {
  @Input() user?: User;
  formGroup: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private userSvc: UserService,
    private mediaService: BaseMediaService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private alertController: AlertController,
    private translateService: TranslateService,
    private modalCtrl: ModalController
  ) {
    // ✅ CORREGIDO: Usar 'username' consistentemente
    this.formGroup = this.formBuilder.group({
      username: ['', [Validators.required]], 
      email: ['', [Validators.required, Validators.email]],
      image: ['']
    });
  }

  ngOnInit() {    
    if (this.user) {
      // ✅ CARGAR DATOS CORRECTAMENTE
      this.formGroup.patchValue({
        username: this.user.username || '',
        email: this.user.email || '',
        image: this.user.image?.url || ''
      });
    }
  }

  async onSubmit() {
    
    if (!this.formGroup.valid || !this.user) {
      console.error('❌ Form not valid or no user');
      return;
    }
  
    const loading = await this.loadingController.create({
      message: await lastValueFrom(this.translateService.get('COMMON.LOADING'))
    });
    await loading.present();
  
    try {
      const formValues = this.formGroup.value;
      const changes: Partial<User> = {};
  
      // ✅ VERIFICAR CAMBIOS EN USERNAME
      if (formValues.username !== this.user.username) {
        changes.username = formValues.username;
      }
      
      // ✅ VERIFICAR CAMBIOS EN EMAIL
      if (formValues.email !== this.user.email) {
        changes.email = formValues.email;
      }
  
      // ✅ VERIFICAR CAMBIOS EN IMAGEN - CORREGIDO
      if (formValues.image && formValues.image !== this.user.image?.url) {
        try {
          let blob: Blob;
          
          // Verificar si es data URL o URL normal
          if (formValues.image.startsWith('data:')) {
            blob = dataURLtoBlob(formValues.image);
          } else if (formValues.image.startsWith('blob:')) {
            // Es una blob URL
            const response = await fetch(formValues.image);
            blob = await response.blob();
          } else if (formValues.image.startsWith('http')) {
            // Es una URL HTTP
            const response = await fetch(formValues.image);
            blob = await response.blob();
          } else {
            throw new Error('Unknown image format');
          }
          
          const uploadResult = await lastValueFrom(this.mediaService.upload(blob));
          
          if (uploadResult && uploadResult[0]) {
            // ✅ CORREGIDO: Manejar como ID numérico, no como URL
            const imageId = Number(uploadResult[0]);
            
            // ✅ Para el mapping de Strapi, enviar el ID como número
            changes.image = imageId as any; // El mapping lo convertirá correctamente
          } else {
            throw new Error('Upload failed - no result');
          }
        } catch (imageError) {
          console.error('❌ Error uploading image:', imageError);
          await loading.dismiss();
          await this.showErrorToast('COMMON.ERROR.UPLOAD');
          return;
        }
      }

      // ✅ SOLO ACTUALIZAR SI HAY CAMBIOS
      if (Object.keys(changes).length === 0) {
        await loading.dismiss();
        this.modalCtrl.dismiss(null, 'cancel');
        return;
      }

      const result = await lastValueFrom(this.userSvc.updateProfile(this.user.id, changes));
      
      await loading.dismiss();
      
      await this.showSuccessToast('COMMON.SUCCESS.SAVE');
      
      // ✅ DEVOLVER EL USUARIO COMPLETO ACTUALIZADO DIRECTAMENTE
      this.modalCtrl.dismiss(result, 'updated');
      
    } catch (error) {
      console.error('❌ Update error:', error);
      await loading.dismiss();
      await this.showErrorToast('COMMON.ERROR.SAVE');
    }
  }

  // ✅ NUEVA FUNCIÓN PARA EXPORTAR DATOS A CSV (IGUAL QUE PYTHON SCRIPT)
  async exportUserDataToCSV() {
    
    const alert = await this.alertController.create({
      header: await lastValueFrom(this.translateService.get('PROFILE.EXPORT.TITLE')),
      message: await lastValueFrom(this.translateService.get('PROFILE.EXPORT.MESSAGE')),
      buttons: [
        {
          text: await lastValueFrom(this.translateService.get('COMMON.CANCEL')),
          role: 'cancel'
        },
        {
          text: await lastValueFrom(this.translateService.get('PROFILE.EXPORT.ALL_DATA')),
          handler: () => this.exportAllAPIData()
        }
      ]
    });

    await alert.present();
  }

  // ✅ EXPORTAR TODOS LOS DATOS DE LA API - VERSIÓN SIMPLIFICADA SIN CARGA INFINITA
  private async exportAllAPIData() {
    const loading = await this.loadingController.create({
      message: await lastValueFrom(this.translateService.get('PROFILE.EXPORT.LOADING_ALL'))
    });
    await loading.present();

    try {
      
      // ✅ URLs EXACTAS DEL SCRIPT PYTHON
      const ENDPOINTS = {
        "playlists": "https://umusic-rtfn.onrender.com/api/playlists?populate=*",
        "songs": "https://umusic-rtfn.onrender.com/api/songs?populate=*",
        "artists": "https://umusic-rtfn.onrender.com/api/artists?populate=*"
      };

      let successCount = 0;
      const results: { filename: string, content: string }[] = [];

      // ✅ PROCESAR CADA ENDPOINT
      for (const [endpoint_name, url] of Object.entries(ENDPOINTS)) {
        try {
          
          const response = await fetch(url);
          
          if (response.status !== 200) {
            continue;
          }

          const responseData = await response.json();
          const raw_data = responseData.data || [];
          

          if (raw_data.length === 0) {
            continue;
          }

          // ✅ NORMALIZAR Y LIMPIAR DATOS
          const df = this.jsonNormalize(raw_data);
          const cleanedDf = df.map(row => {
            const cleaned = { ...row };
            delete cleaned['attributes.createdAt'];
            delete cleaned['attributes.updatedAt'];
            delete cleaned['attributes.publishedAt'];
            return cleaned;
          });

          const finalDf = cleanedDf.map(row => {
            const trimmed: any = {};
            for (const [key, value] of Object.entries(row)) {
              trimmed[key] = typeof value === 'string' ? value.trim() : value;
            }
            return trimmed;
          });

          // ✅ GENERAR CSV
          if (finalDf.length > 0) {
            const headers = Object.keys(finalDf[0]);
            const csvContent = this.convertToCSV(finalDf, headers);
            const filename = `${endpoint_name}.csv`;
            
            results.push({ filename, content: csvContent });
            successCount++;
            
          }
          
        } catch (error) {
          console.error(`❌ Error procesando ${endpoint_name}:`, error);
        }
      }

      // ✅ CERRAR LOADING ANTES DE DESCARGAR
      await loading.dismiss();

      // ✅ DESCARGAR ARCHIVOS O MOSTRAR ALTERNATIVAS
      if (successCount > 0) {
        
        // Intentar descargas simples una por una
        for (let i = 0; i < results.length; i++) {
          const { filename, content } = results[i];
                    
          // Descarga simple
          this.simpleDownload(content, filename);
          
          // Esperar un poco entre descargas
          if (i < results.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        }
        
        // Mostrar mensaje de éxito después de intentar todas las descargas
        setTimeout(async () => {
          await this.showSuccessToast('PROFILE.EXPORT.SUCCESS_ALL');
        }, 1000);
        
      } else {
        await this.showErrorToast('PROFILE.EXPORT.NO_DATA');
      }
      
    } catch (error) {
      console.error('❌ Error general en exportación:', error);
      await loading.dismiss();
      await this.showErrorToast('PROFILE.EXPORT.ERROR');
    }
  }

  // ✅ DESCARGA SIMPLE SIN COMPLICACIONES
  private simpleDownload(csvContent: string, filename: string): void {
    try {
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      
    } catch (error) {
      console.error(`❌ Error descargando ${filename}:`, error);
      
      // Fallback: abrir en nueva ventana
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>${filename}</title></head>
            <body>
              <h2>📄 ${filename}</h2>
              <p>Haz clic derecho y "Guardar como..." para descargar el archivo:</p>
              <a href="data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}" 
                 download="${filename}" 
                 style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                💾 Descargar ${filename}
              </a>
              <hr>
              <pre style="background: #f8f9fa; padding: 15px; border-radius: 5px; overflow: auto;">${csvContent}</pre>
            </body>
          </html>
        `);
      }
    }
  }

  // ✅ EQUIVALENTE A pd.json_normalize() de Python
  private jsonNormalize(data: any[]): any[] {
    if (!data || data.length === 0) return [];

    return data.map(item => {
      const normalized: any = {};
      
      // Función recursiva para aplanar objetos anidados (como pandas.json_normalize)
      const flatten = (obj: any, prefix = '') => {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;
            
            if (value === null || value === undefined) {
              normalized[newKey] = '';
            } else if (Array.isArray(value)) {
              // Para arrays, pandas los convierte a string diferente según el contenido
              if (value.length === 0) {
                normalized[newKey] = '';
              } else if (value.every(v => typeof v === 'object' && v !== null)) {
                // Array de objetos - pandas lo maneja diferente
                normalized[newKey] = JSON.stringify(value);
              } else {
                // Array simple
                normalized[newKey] = value.join(';');
              }
            } else if (typeof value === 'object' && value !== null) {
              // Objeto anidado - aplanarlo recursivamente
              flatten(value, newKey);
            } else {
              normalized[newKey] = value;
            }
          }
        }
      };

      flatten(item);
      return normalized;
    });
  }

  // ✅ EQUIVALENTE A df.to_csv() de Python
  private convertToCSV(data: any[], headers: string[]): string {
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Manejar valores que contienen comas, comillas o saltos de línea
        if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    );
    
    return [csvHeaders, ...csvRows].join('\n');
  }

  async openChangePasswordModal() {
    const modal = await this.modalCtrl.create({
      component: ChangePasswordModalComponent,
      cssClass: 'custom-modal' 
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data) {
      await this.showSuccessToast('CHANGE_PASSWORD.SUCCESS');
    }
  }

  // ✅ GETTERS CORREGIDOS
  get username() {
    return this.formGroup.controls['username'];
  }

  get email() {
    return this.formGroup.controls['email'];
  }

  get image() {
    return this.formGroup.controls['image'];
  }

  private async showSuccessToast(messageKey: string) {
    const toast = await this.toastController.create({
      message: await lastValueFrom(this.translateService.get(messageKey)),
      duration: 3000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  private async showErrorToast(messageKey: string) {
    const toast = await this.toastController.create({
      message: await lastValueFrom(this.translateService.get(messageKey)),
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  dismiss() {
    this.modalCtrl.dismiss(null, 'cancel');
  }
}
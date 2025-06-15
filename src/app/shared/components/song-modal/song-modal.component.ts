import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { ModalController, LoadingController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Subject, of, lastValueFrom } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { Song } from 'src/app/core/models/song.model';
import { Artist } from 'src/app/core/models/artist.model';
import { SongsService } from 'src/app/core/services/impl/songs.service';
import { ArtistsService } from 'src/app/core/services/impl/artists.service';
import { BaseMediaService } from 'src/app/core/services/impl/base-media.service';

// Auxiliar para convertir dataURL a Blob
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
  selector: 'app-song-modal',
  templateUrl: './song-modal.component.html',
  styleUrls: ['./song-modal.component.scss']
})
export class SongModalComponent implements OnInit, OnDestroy {
  formGroup: FormGroup;
  mode: 'new' | 'edit' = 'new';

  private _availableArtists = new BehaviorSubject<Artist[]>([]);
  availableArtists$ = this._availableArtists.asObservable();
  private destroy$ = new Subject<void>();

  @Input() set song(_song: Song) {
    if (_song && _song.id) {
      this.mode = 'edit';
      this.formGroup.patchValue({
        name: _song.name || '',
        artists_IDS: _song.artists_IDS || [],
        album: _song.album || '',
        duration: this.formatDurationForEdit(_song.duration) || '',
        image: _song.image?.url || ''
      });
    }
  }

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private translateService: TranslateService,
    private songsService: SongsService,
    private artistsService: ArtistsService,
    private mediaService: BaseMediaService
  ) {
    this.formGroup = this.fb.group({
      name: ['', [Validators.required]],
      artists_IDS: [[], [Validators.required]],
      album: [''],
      duration: ['', [Validators.required, Validators.pattern(/^\d{1,2}:\d{2}$/)]],
      image: ['']
    });

    this.formGroup.get('duration')?.valueChanges.subscribe(value => {
      if (value && typeof value === 'string') {
        const formatted = this.formatDurationInput(value);
        if (formatted !== value) {
          this.formGroup.get('duration')?.setValue(formatted, { emitEvent: false });
        }
      }
    });
  }

  ngOnInit() {
    this.loadAvailableArtists();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAvailableArtists() {
    this.artistsService.getAll(1, 100)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading artists:', error);
          return of([]);
        })
      )
      .subscribe(response => {
        const artists = Array.isArray(response) ? response : response.data;
        this._availableArtists.next(artists);
      });
  }

  compareWith = (a: any, b: any) => a === b;

  private formatDurationForEdit(duration: string | number | undefined): string {
    if (duration === undefined || duration === null) return '';
    const durationStr = typeof duration === 'number' ? duration.toString() : duration;
    if (/^\d{1,2}:\d{2}$/.test(durationStr)) return durationStr;
    const totalSeconds = parseInt(durationStr);
    if (!isNaN(totalSeconds)) {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return durationStr;
  }

  private formatDurationInput(value: string): string {
    let cleaned = value.replace(/[^\d:]/g, '');
    if (!/:/i.test(cleaned) && cleaned.length >= 3) {
      const minutes = cleaned.slice(0, -2);
      const seconds = cleaned.slice(-2);
      cleaned = `${minutes}:${seconds}`;
    }
    const parts = cleaned.split(':');
    if (parts.length === 2) {
      let [minutes, seconds] = parts;
      if (parseInt(seconds) > 59) seconds = '59';
      if (seconds.length === 1) seconds = '0' + seconds;
      return `${minutes}:${seconds}`;
    }
    return cleaned;
  }

  private convertDurationToSeconds(duration: string): number {
    if (!duration || typeof duration !== 'string') return 0;
    const parts = duration.split(':');
    if (parts.length !== 2) return 0;
    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;
    return (minutes * 60) + seconds;
  }

  private getDirtyValuesWithConversion(formGroup: FormGroup): any {
    const dirtyValues: any = {};
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control?.dirty) {
        let value = control.value;
        if (key === 'duration' && typeof value === 'string') {
          value = this.convertDurationToSeconds(value);
        }
        dirtyValues[key] = value;
      }
    });
    return dirtyValues;
  }

  async onSubmit() {
    if (!this.formGroup.valid) {
      this.markFormGroupTouched();
      return;
    }

    const loading = await this.loadingController.create({
      message: await lastValueFrom(this.translateService.get('COMMON.LOADING'))
    });

    try {
      await loading.present();

      let songData = { ...this.formGroup.value };

      if (songData.duration && typeof songData.duration === 'string') {
        songData.duration = this.convertDurationToSeconds(songData.duration);
      }

      if (songData.image && songData.image.startsWith('data:')) {
        const blob = dataURLtoBlob(songData.image);
        const uploadResult = await lastValueFrom(this.mediaService.upload(blob));
        if (uploadResult && uploadResult[0]) {
          songData.image = Number(uploadResult[0]);
        }
      } else if (!songData.image) {
        delete songData.image;
      }

      Object.keys(songData).forEach(key => {
        if (songData[key] === '' || songData[key] === null) {
          delete songData[key];
        }
      });

      const data = this.mode === 'new' 
        ? songData 
        : this.getDirtyValuesWithConversion(this.formGroup);

      await this.modalCtrl.dismiss(data, this.mode === 'edit' ? 'update' : 'create');
      
      await this.showSuccessToast(this.mode === 'edit' ? 'SONG.SUCCESS.UPDATE' : 'SONG.SUCCESS.CREATE');

    } catch (error) {
      console.error('Error submitting form:', error);
      await this.showErrorToast('SONG.ERRORS.SAVE');
    } finally {
      await loading.dismiss();
    }
  }

  async dismiss() {
    await this.modalCtrl.dismiss();
  }

  private markFormGroupTouched() {
    Object.keys(this.formGroup.controls).forEach(key => {
      this.formGroup.get(key)?.markAsTouched();
    });
  }

  private async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message: await lastValueFrom(this.translateService.get(message)),
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  private async showSuccessToast(message: string) {
    const toast = await this.toastController.create({
      message: await lastValueFrom(this.translateService.get(message)),
      duration: 3000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }
  
  get name() { return this.formGroup.get('name') as FormControl; }
  get artists_IDS() { return this.formGroup.get('artists_IDS') as FormControl; }
  get album() { return this.formGroup.get('album') as FormControl; }
  get duration() { return this.formGroup.get('duration') as FormControl; }
  get image() { return this.formGroup.get('image') as FormControl; }

  // Método para mostrar la duración formateada
  getDurationDisplay(duration: string): string {
    if (!duration) return '';
    return `${duration} min`;
  }
}

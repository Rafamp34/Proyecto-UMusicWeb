import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { LoadingController, ModalController, ToastController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Subject, lastValueFrom, of, take, Observable } from 'rxjs';
import { takeUntil, switchMap, catchError, filter, map } from 'rxjs/operators';
import { BaseAuthenticationService } from 'src/app/core/services/impl/base-authentication.service';
import { PlaylistsService } from 'src/app/core/services/impl/playlists.service';
import { SocialService } from 'src/app/core/services/impl/social.service'; //IMPORTAR SOCIAL SERVICE
import { User } from 'src/app/core/models/user.model';
import { Playlist } from 'src/app/core/models/playlist.model';
import { BaseMediaService } from 'src/app/core/services/impl/base-media.service';
import { EditProfileModalComponent } from '../../shared/components/edit-profile-modal/edit-profile-modal.component';
import { UserService } from 'src/app/core/services/impl/user.service';
import { PlaylistModalComponent } from '../../shared/components/playlist-modal/playlist-modal.component';

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
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
})
export class ProfilePage implements OnInit, OnDestroy {
  page: number = 1;
  pageSize: number = 25;
  pages: number = 0;

  user?: User | null;
  
  //CAMBIAR A OBSERVABLE REACTIVO
  followingCount$: Observable<number>;
  
  private _playlists = new BehaviorSubject<Playlist[]>([]);
  playlists$ = this._playlists.asObservable();

  private _currentUser = new BehaviorSubject<User | null>(null);
  currentUser$ = this._currentUser.asObservable();
  
  private destroy$ = new Subject<void>();

  formGroup: FormGroup;
  changePasswordForm: FormGroup;
  profilePictureControl = new FormControl('');

  constructor(
    private authService: BaseAuthenticationService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private translateService: TranslateService,
    private playlistsService: PlaylistsService,
    private router: Router,
    private modalCtrl: ModalController,
    private fb: FormBuilder,
    private mediaService: BaseMediaService,
    private userService: UserService,
    private authSvc: BaseAuthenticationService,
    private alertCtrl: AlertController,
    private socialService: SocialService //INYECTAR SOCIAL SERVICE
  ) {
    
    this.formGroup = this.fb.group({
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      image: ['']
    });

    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]]
    });

    this.profilePictureControl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
      });

    //INICIALIZAR FOLLOWING COUNT OBSERVABLE
    this.followingCount$ = this.socialService.followedArtists$.pipe(
      map(followedArtists => followedArtists.size),
      takeUntil(this.destroy$)
    );
  }

  ngOnInit() {
    this.loadUserData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserData() {
    
    this.authService.getCurrentUser()
      .then(currentUser => {
        
        if (!currentUser) {
          console.error('ProfilePage: No authenticated user found');
          this.showErrorToast('COMMON.ERROR.LOAD');
          return;
        }

        if (!currentUser.id || currentUser.id === 'unknown') {
          console.error('ProfilePage: User has invalid ID:', currentUser);
          this.showErrorToast('COMMON.ERROR.LOAD');
          return;
        }
        
        this.userService.getById(currentUser.id)
          .pipe(
            take(1),
            takeUntil(this.destroy$)
          )
          .subscribe({
            next: (fullUser) => {
              
              if (!fullUser) {
                console.error('ProfilePage: Full user data is null');
                this.showErrorToast('COMMON.ERROR.LOAD');
                return;
              }

              if (fullUser.id === 'unknown' || fullUser.email === 'unknown') {
                console.error('ProfilePage: User data is incomplete:', fullUser);
                this.showErrorToast('COMMON.ERROR.LOAD');
                return;
              }

              this.user = fullUser;
              this._currentUser.next(fullUser);

              //RECARGAR DATOS SOCIALES PARA TENER EL FOLLOWING ACTUALIZADO
              this.socialService.reloadUserSocialData();

              if (fullUser.username && fullUser.username.trim() !== '') {
                this.loadPlaylistsByAuthor(fullUser.username);
              } else {
                console.warn('ProfilePage: No valid username for playlist loading');
                this._playlists.next([]);
              }
            },
            error: (error) => {
              console.error('ProfilePage: Error loading user details:', error);
              this.showErrorToast('COMMON.ERROR.LOAD');
            }
          });
      })
      .catch(error => {
        console.error('ProfilePage: Error getting current user:', error);
        this.showErrorToast('COMMON.ERROR.LOAD');
      });
  }

  private loadPlaylistsByAuthor(username: string) {    
    if (!username || username.trim() === '') {
      console.warn('ProfilePage: Invalid username for playlist loading:', username);
      this._playlists.next([]);
      return;
    }
    
    this.loadPlaylistsByAuthorName(username.trim());
  }

  private loadPlaylistsByAuthorName(authorName: string) {
    
    this.playlistsService.getAll(1, 100)
      .pipe(
        take(1),
        takeUntil(this.destroy$),
        map(response => {
          const allPlaylists = Array.isArray(response) ? response : response.data;
          
          const userPlaylists = allPlaylists.filter(playlist => {
            if (!playlist.author || !authorName) return false;
            
            const authorMatch = playlist.author.includes(authorName);
            if (authorMatch) {
            }
            return authorMatch;
          });
          
          return userPlaylists;
        }),
        catchError(error => {
          console.error('Error loading playlists by author:', error);
          return of([]);
        })
      )
      .subscribe(playlists => {
        this._playlists.next(playlists);
      });
  }

  async deletePlaylist(playlist: Playlist, event: Event) {
    event.stopPropagation();
    
    if (!playlist || !playlist.id) {
      console.error('Invalid playlist data', playlist);
      return;
    }
  
    const [headerText, messageBase, cancelText, deleteText] = await Promise.all([
      this.translateService.get('PLAYLIST.MESSAGESS.DELETE_CONFIRM').toPromise(),
      this.translateService.get('PLAYLIST.MESSAGESS.DELETE_CONFIRM_MESSAGE').toPromise(),
      this.translateService.get('COMMON.CANCEL').toPromise(),
      this.translateService.get('COMMON.DELETE').toPromise()
    ]);
  
    const message = `${messageBase.replace('{name}', `"${playlist.name}"`)}`;
  
    const alert = await this.alertCtrl.create({
      header: headerText,
      message: message,
      buttons: [
        {
          text: cancelText,
          role: 'cancel'
        },
        {
          text: deleteText,
          role: 'destructive',
          handler: () => {
            this.performPlaylistDeletion(playlist);
          }
        }
      ]
    });
  
    await alert.present();
  }
  
  private async performPlaylistDeletion(playlist: Playlist) {
    const loading = await this.loadingController.create({
      message: await this.translateService.get('COMMON.LOADING').toPromise()
    });
    await loading.present();
  
    this.playlistsService.delete(playlist.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          const currentPlaylists = this._playlists.getValue();
          const updatedPlaylists = currentPlaylists.filter(p => p.id !== playlist.id);
          this._playlists.next(updatedPlaylists);
          
          loading.dismiss();
          this.showSuccessToast('PLAYLIST.SUCCESS.DELETE');
        },
        error: (error) => {
          console.error('Error deleting playlist:', error);
          loading.dismiss();
          this.showErrorToast('PLAYLIST.ERRORS.DELETE');
        }
      });
  }

  async openPlaylistModal() {
    const user = await this.authSvc.getCurrentUser();
    if (!user) {
      console.error('No user found');
      return;
    }

    const modal = await this.modalCtrl.create({
      component: PlaylistModalComponent,
      componentProps: {},
      cssClass: 'custom-modal'
    });

    modal.onDidDismiss().then((result) => {
      if (result.role === 'create') {
        let author = user.username || '';
        if (this.user) {
          author = this.user.username;
        }
        
        if (!author || author.trim() === '') {
          console.error('Cannot create playlist with empty author name');
          this.showErrorToast('PLAYLIST.ERRORS.CREATE');
          return;
        }
        
        const newPlaylist: Playlist = {
          name: result.data.name,
          author: author.trim(), 
          duration: '0:00',
          song_IDS: [],
          users_IDS: user.id ? [user.id] : [],
          likes_count: 0,
          ...(result.data.image && {
            image: result.data.image   
          })
        };

        this.playlistsService.add(newPlaylist)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (createdPlaylist) => {
              if (this.user) {
                this.loadPlaylistsByAuthor(this.user.username);
              }
            },
            error: (err) => {
              console.error('Error creating playlist:', err);
              this.showErrorToast('PLAYLIST.ERRORS.LOAD');
            }
          });
      }
    });

    await modal.present();
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

  async onPhotoClick() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.onchange = async (e: any) => {
      if (e.target?.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        
        try {
          const loadingElement = await this.loadingController.create();
          await loadingElement.present();
          
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              if (typeof reader.result === 'string') {
                await this.onProfilePictureChange(reader.result);
              }
            } catch (error) {
              console.error('Error processing image:', error);
              this.showErrorToast('COMMON.ERROR.UPLOAD');
            } finally {
              loadingElement.dismiss();
            }
          };
          reader.readAsDataURL(file);
          
        } catch (error) {
          console.error(error);
          this.showErrorToast('COMMON.ERROR.UPLOAD');
        }
      }
    };
    
    fileInput.click();
  }
  
//MÉTODO: onProfilePictureChange
  private async onProfilePictureChange(newPicture: string) {
    if (!this.user?.id) return;
  
    const loadingElement = await this.loadingController.create({
      message: await lastValueFrom(this.translateService.get('COMMON.LOADING'))
    });
  
    try {
      await loadingElement.present();
  
      if (newPicture) {
        const blob = dataURLtoBlob(newPicture);
        
        const uploadResult = await lastValueFrom(this.mediaService.upload(blob));
        
        if (uploadResult && uploadResult[0]) {
          const imageId = Number(uploadResult[0]);
  
          const updateData: Partial<User> = {
            image: imageId as any  // El mapping lo convertirá correctamente
          };
            
          const updatedUser = await lastValueFrom(this.userService.updateProfile(this.user.id, updateData));
          
          if (updatedUser) {
            //El updatedUser ya viene con la imagen correcta desde Strapi
            this.user = updatedUser;
            this._currentUser.next(updatedUser);
            
            //Actualizar el control con la URL real de la imagen
            if (updatedUser.image?.url) {
              this.profilePictureControl.setValue(updatedUser.image.url);
            }
          }
  
          await this.showSuccessToast('PROFILE.PHOTO_UPDATED');
        } else {
          throw new Error('Upload failed - no result');
        }
      }
    } catch (error) {
      console.error('❌ ProfilePage: Error updating profile picture:', error);
      await this.showErrorToast('COMMON.ERROR.UPLOAD');
    } finally {
      await loadingElement.dismiss();
    }
  }

  //MÉTODO: openEditProfileModal
  async openEditProfileModal() {
    
    if (!this.user) {
      console.error('❌ Cannot open edit profile modal: No user data available');
      await this.showErrorToast('COMMON.ERROR.LOAD');
      return;
    }
    
    const modal = await this.modalCtrl.create({
      component: EditProfileModalComponent,
      componentProps: {
        user: this.user
      },
      cssClass: 'custom-modal'
    });
    
    modal.onDidDismiss().then(result => {
      
      if (result.role === 'updated' && result.data) {
        
        //ACTUALIZAR USUARIO CORRECTAMENTE
        const updatedUser = result.data; 
        
        //ACTUALIZAR TODAS LAS REFERENCIAS
        this.user = updatedUser;
        this._currentUser.next(updatedUser);
        
        //ACTUALIZAR FORMULARIO SI EXISTE
        if (this.formGroup) {
          this.formGroup.patchValue({
            username: updatedUser.username || '',
            email: updatedUser.email || '',
            image: updatedUser.image?.url || ''
          });
        }
        
        //ACTUALIZAR CONTROL DE IMAGEN DE PERFIL
        if (updatedUser.image?.url) {
          this.profilePictureControl.setValue(updatedUser.image.url);
        }
        
        //RECARGAR PLAYLISTS SI CAMBIÓ EL USERNAME
        if (updatedUser.username && updatedUser.username !== this.user?.username) {
          this.loadPlaylistsByAuthor(updatedUser.username);
        }
        
        //MOSTRAR MENSAJE DE ÉXITO
        this.showSuccessToast('PROFILE.UPDATED_SUCCESS');
      } else {
      }
    });
    
    return await modal.present();
  }
  
  logout() {
    this.authService.signOut()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.router.navigate(['/login']);
      });
  }
}
import { Inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { BaseService } from './base-service.service';
import { User } from '../../models/user.model';
import { IUserService } from '../interfaces/user-service.interface';
import { IUserRepository } from '../../repositories/intefaces/user-repository.interface';
import { USERS_REPOSITORY_TOKEN } from '../../repositories/repository.tokens';
import { BaseAuthenticationService } from './base-authentication.service';

@Injectable({
    providedIn: 'root'
})
export class UserService extends BaseService<User> implements IUserService {
    private isUpdatingUser = false;

    constructor(
        @Inject(USERS_REPOSITORY_TOKEN) private userRepository: IUserRepository,
        private authService: BaseAuthenticationService
    ) {
        super(userRepository);
    }

    getByEmail(email: string): Observable<User | null> {
        return this.userRepository.getByEmail(email);
    }

    // ✅ MÉTODO CORREGIDO: updateProfile
    updateProfile(id: string, changes: Partial<User>): Observable<User> {
        console.log('🔄 UserService.updateProfile called with:', { id, changes });
        
        this.isUpdatingUser = true;
        
        // ✅ PROCESAR LA IMAGEN ANTES DE ENVIAR AL REPOSITORY
        const processedChanges = { ...changes };
        
        if (changes.image !== undefined) {
            console.log('🖼️ Processing image in updateProfile:', changes.image, 'type:', typeof changes.image);
            
            const imageData: any = changes.image;
            
            // Si la imagen es un número (ID de imagen ya subida)
            if (typeof imageData === 'number') {
                processedChanges.image = imageData as any;
                console.log('🖼️ Image processed as ID:', imageData);
            }
            // Si la imagen es un objeto con structure compleja
            else if (typeof imageData === 'object' && imageData !== null) {
                if (imageData.data && imageData.data.id) {
                    processedChanges.image = Number(imageData.data.id) as any;
                    console.log('🖼️ Image processed from object.data.id:', Number(imageData.data.id));
                } else if (imageData.id) {
                    processedChanges.image = Number(imageData.id) as any;
                    console.log('🖼️ Image processed from object.id:', Number(imageData.id));
                } else if (imageData.url && !isNaN(Number(imageData.url))) {
                    processedChanges.image = Number(imageData.url) as any;
                    console.log('🖼️ Image processed from object.url as number:', Number(imageData.url));
                }
                // Si es un objeto de imagen con URLs (mantener como está para retorno)
                else if (imageData.url && typeof imageData.url === 'string') {
                    console.log('🖼️ Image object with URLs, keeping as is:', imageData);
                    // No modificar - es el formato de respuesta correcto
                }
            }
            // Si la imagen es string y parece ser un ID numérico
            else if (typeof imageData === 'string' && !isNaN(Number(imageData))) {
                processedChanges.image = Number(imageData) as any;
                console.log('🖼️ Image processed from string as number:', Number(imageData));
            }
            else if (imageData === null) {
                processedChanges.image = null as any;
                console.log('🖼️ Image set to null for removal');
            }
            else {
                console.warn('⚠️ Unrecognized image format in updateProfile:', imageData);
            }
        }
        
        console.log('🔄 UserService.updateProfile processed changes:', processedChanges);
        
        return this.update(id, processedChanges as User).pipe(
            tap(updatedUser => {
                console.log('✅ UserService.updateProfile result:', updatedUser);
                
                try {
                    if (updatedUser && updatedUser.id) {
                        (this.authService as any).updateCurrentUser(updatedUser);
                        console.log('✅ Updated current user in auth service');
                    }
                } catch (authError) {
                    console.error('❌ Error updating auth service:', authError);
                } finally {
                    setTimeout(() => {
                        this.isUpdatingUser = false;
                    }, 100);
                }
            })
        );
    }

    follow(userId: string, followId: string): Observable<User> {
        this.isUpdatingUser = true;
        
        return this.userRepository.follow(userId, followId).pipe(
            tap(updatedUser => {
                try {
                    (this.authService as any).updateCurrentUser(updatedUser);
                } finally {
                    setTimeout(() => {
                        this.isUpdatingUser = false;
                    }, 100);
                }
            })
        );
    }

    unfollow(userId: string, followId: string): Observable<User> {
        this.isUpdatingUser = true;
        
        return this.userRepository.unfollow(userId, followId).pipe(
            tap(updatedUser => {
                try {
                    (this.authService as any).updateCurrentUser(updatedUser);
                } finally {
                    setTimeout(() => {
                        this.isUpdatingUser = false;
                    }, 100);
                }
            })
        );
    }

    getFollowers(userId: string): Observable<User[]> {
        return this.userRepository.getFollowers(userId);
    }

    getFollowing(userId: string): Observable<User[]> {
        return this.userRepository.getFollowing(userId);
    }

    addPlaylist(userId: string, playlistId: string): Observable<User> {
        this.isUpdatingUser = true;
        
        return this.userRepository.addPlaylist(userId, playlistId).pipe(
            tap(updatedUser => {
                try {
                    (this.authService as any).updateCurrentUser(updatedUser);
                } finally {
                    setTimeout(() => {
                        this.isUpdatingUser = false;
                    }, 100);
                }
            })
        );
    }

    removePlaylist(userId: string, playlistId: string): Observable<User> {
        this.isUpdatingUser = true;
        
        return this.userRepository.removePlaylist(userId, playlistId).pipe(
            tap(updatedUser => {
                try {
                    (this.authService as any).updateCurrentUser(updatedUser);
                } finally {
                    setTimeout(() => {
                        this.isUpdatingUser = false;
                    }, 100);
                }
            })
        );
    }

    // ✅ MÉTODO MEJORADO: updateSafely  
    updateSafely(id: string, changes: Partial<User>): Observable<User> {
        console.log('🔄 UserService: Safe update for user:', id, 'with changes:', changes);
        
        return this.getById(id).pipe(
            take(1),
            switchMap(currentUser => {
                if (!currentUser) {
                    throw new Error('User not found');
                }
                
                // Crear objeto completo preservando todos los campos
                const updatedUser: User = {
                    ...currentUser, // ✅ Preserva TODOS los campos existentes
                    ...changes     // ✅ Aplica solo los cambios necesarios
                };
                
                console.log('🔄 UserService: Updating user with preserved data:', {
                    userId: id,
                    preservedFields: Object.keys(currentUser).length,
                    changedFields: Object.keys(changes).length,
                    originalImage: currentUser.image?.url,
                    finalImage: updatedUser.image?.url
                });
                
                return this.updateProfile(id, updatedUser);
            })
        );
    }

    override getById(id: string): Observable<User> {
        const shouldUpdateAuth = !this.isUpdatingUser;
        
        return this.userRepository.getById(id).pipe(
            filter((userData): userData is User => userData !== null),
            tap(userData => {
                if (shouldUpdateAuth && 
                    userData && 
                    userData.id === (this.authService as any)._user.value?.id) {
                    this.isUpdatingUser = true;
                    
                    try {
                        (this.authService as any).updateCurrentUser(userData);
                    } finally {
                        setTimeout(() => {
                            this.isUpdatingUser = false;
                        }, 100);
                    }
                }
            })
        );
    }
}
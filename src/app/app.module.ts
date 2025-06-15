import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import player from 'lottie-web';
import { ɵLOTTIE_OPTIONS as LOTTIE_OPTIONS } from 'ngx-lottie';


import { 
  AuthenticationServiceFactory, 
  AuthMappingFactory, 
  MediaServiceFactory, 
  SongsMappingFactory,
  PlaylistsMappingFactory,
  UsersMappingFactory,
  SongsRepositoryFactory,
  PlaylistsRepositoryFactory,
  UsersRepositoryFactory,
  ArtistsMappingFactory,
  ArtistsRepositoryFactory
} from './core/repositories/repository.factory';
import { 
  COLLECTION_SUBSCRIPTION_TOKEN 
} from './core/repositories/repository.tokens';
import { ArtistsService } from './core/services/impl/artists.service';
import { SongsService } from './core/services/impl/songs.service';
import { PlaylistsService } from './core/services/impl/playlists.service';
import { UserService } from './core/services/impl/user.service';
import { 
  AUTH_MAPPING_TOKEN, 
  AUTH_ME_API_URL_TOKEN, 
  AUTH_SIGN_IN_API_URL_TOKEN, 
  AUTH_SIGN_UP_API_URL_TOKEN, 
  BACKEND_TOKEN, 
  SONGS_API_URL_TOKEN,
  PLAYLISTS_API_URL_TOKEN,
  USERS_API_URL_TOKEN,
  SONGS_RESOURCE_NAME_TOKEN,
  PLAYLISTS_RESOURCE_NAME_TOKEN,
  USERS_RESOURCE_NAME_TOKEN,
  USERS_REPOSITORY_TOKEN,
  UPLOAD_API_URL_TOKEN, 
  FIREBASE_CONFIG_TOKEN,
  STRAPI_AUTH_TOKEN,
  AUTH_TOKEN,
  ARTISTS_API_URL_TOKEN,
  ARTISTS_RESOURCE_NAME_TOKEN
} from './core/repositories/repository.tokens';
import { provideHttpClient } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { BaseAuthenticationService } from './core/services/impl/base-authentication.service';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { SharedModule } from './shared/shared.module';
import { environment } from 'src/environments/environment';
import { FirebaseCollectionSubscriptionService } from './core/services/interfaces/firebase-collection-subscription.interface';
import { SongEnrichmentService } from './core/services/impl/song-enrichment.service';
import { AudioPlayerService } from './core/services/impl/audio-player.service';
import { EnhancedAudioPlayerService } from './core/services/impl/enhanced-audio-player.service';

export function playerFactory() {
  return player;
}

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    ReactiveFormsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    }),
    SharedModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [

    {
      provide: COLLECTION_SUBSCRIPTION_TOKEN,
      useClass: FirebaseCollectionSubscriptionService
    },

    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideHttpClient(),
    { provide: BACKEND_TOKEN, useValue: 'strapi' },
    
    // Resource Names
    { provide: SONGS_RESOURCE_NAME_TOKEN, useValue: 'songs' },
    { provide: PLAYLISTS_RESOURCE_NAME_TOKEN, useValue: 'playlists' },
    { provide: USERS_RESOURCE_NAME_TOKEN, useValue: 'users' },
    { provide: ARTISTS_RESOURCE_NAME_TOKEN, useValue: 'artists' },
    
    // API URLs
    { provide: SONGS_API_URL_TOKEN, useValue: `${environment.apiUrl}/api` },
    { provide: PLAYLISTS_API_URL_TOKEN, useValue: `${environment.apiUrl}/api` },
    { provide: USERS_API_URL_TOKEN, useValue: `${environment.apiUrl}/api` },
    { provide: AUTH_SIGN_IN_API_URL_TOKEN, useValue: `${environment.apiUrl}/api/auth/local` },
    { provide: AUTH_SIGN_UP_API_URL_TOKEN, useValue: `${environment.apiUrl}/api/auth/local/register` },
    { provide: AUTH_ME_API_URL_TOKEN, useValue: `${environment.apiUrl}/api/users/me` },
    { provide: UPLOAD_API_URL_TOKEN, useValue: `${environment.apiUrl}/api/upload` },
    { provide: ARTISTS_API_URL_TOKEN, useValue: `${environment.apiUrl}/api` },
    
    // Firebase Config
    { provide: FIREBASE_CONFIG_TOKEN, useValue: {
      apiKey: "AIzaSyC5YO2riR55SL7k3nzN6ubRQ8dPoflkLHA",
      authDomain: "umusic-9af08.firebaseapp.com",
      projectId: "umusic-9af08",
      storageBucket: "umusic-9af08.firebasestorage.app",
      messagingSenderId: "6432458357",
      appId: "1:6432458357:web:08b9d178b6d3c44550da3c",
      measurementId: "G-BN27LHZ2K9"
    }},
    
    // Factories y Servicios
    ArtistsMappingFactory, 
    SongsMappingFactory,
    PlaylistsMappingFactory,
    UsersMappingFactory,
    AuthMappingFactory,
    ArtistsRepositoryFactory,
    SongsRepositoryFactory,
    PlaylistsRepositoryFactory,
    UsersRepositoryFactory,
    SongsService,
    PlaylistsService,
    UserService,
    AudioPlayerService,
    EnhancedAudioPlayerService,
    MediaServiceFactory,
    ArtistsService,
    SongEnrichmentService,

    // Autenticación
    AuthenticationServiceFactory,
    {
      provide: AUTH_TOKEN,
      useExisting: BaseAuthenticationService
    },
    {
      provide: STRAPI_AUTH_TOKEN,
      useExisting: BaseAuthenticationService
    },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    {
      provide: LOTTIE_OPTIONS,
      useValue: {
        player: () => player
      }
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
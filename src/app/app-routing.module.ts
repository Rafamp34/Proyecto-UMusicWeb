import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full'
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadChildren: () => import('./pages/home/home.module').then(m => m.HomePageModule)
  },
  {
    path: 'splash',
    loadComponent: () => import('./pages/splash/splash.page').then(m => m.SplashPage)
  },
  {
    path: 'login',
    canActivate: [noAuthGuard],
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'register',
    canActivate: [noAuthGuard],
    loadChildren: () => import('./pages/register/register.module').then(m => m.RegisterPageModule)
  },
  {
    path: 'playlists',
    canActivate: [authGuard],
    loadChildren: () => import('./pages/playlists/playlists.module').then(m => m.PlaylistsPageModule)
  },
  {
    path: 'songs',
    canActivate: [authGuard],
    loadChildren: () => import('./pages/songs/songs.module').then(m => m.SongsPageModule)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadChildren: () => import('./pages/profile/profile.module').then(m => m.ProfilePageModule)
  },
  {
    path: 'playlist/:id',
    canActivate: [authGuard],
    loadChildren: () => import('./pages/playlist-detail/playlist-detail.module').then(m => m.PlaylistDetailPageModule)
  },
  {
    path: 'artists',
    canActivate: [authGuard],
    loadChildren: () => import('./pages/artists/artists.module').then(m => m.ArtistsPageModule)
  },
  {
    path: 'artist/:id',
    loadChildren: () => import('./pages/artist-profile/artist-profile.module').then(m => m.ArtistProfilePageModule),
    canActivate: [authGuard]
  },
  {
    path: 'artist-profile',
    loadChildren: () => import('./pages/artist-profile/artist-profile.module').then( m => m.ArtistProfilePageModule),
    canActivate: [authGuard]
  },
  {
    path: 'about',
    loadChildren: () => import('./pages/about/about.module').then( m => m.AboutPageModule),
    canActivate: [authGuard]
  },



];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
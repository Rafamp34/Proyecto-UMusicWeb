// src/app/pages/artist-profile/artist-profile.page.ts - CON DEBUG

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { BehaviorSubject, Subject, switchMap, takeUntil, of } from 'rxjs';
import { LoadingController, ToastController } from '@ionic/angular';
import { Artist } from 'src/app/core/models/artist.model';
import { Song } from 'src/app/core/models/song.model';
import { ArtistsService } from 'src/app/core/services/impl/artists.service';
import { SongsService } from 'src/app/core/services/impl/songs.service';
import { AudioPlayerService } from 'src/app/core/services/impl/audio-player.service';
import { SocialService } from 'src/app/core/services/impl/social.service';
import { TranslateService } from '@ngx-translate/core';

interface EnrichedSong extends Song {
  artistNames?: string[];
}

@Component({
  selector: 'app-artist-profile',
  templateUrl: './artist-profile.page.html',
  styleUrls: ['./artist-profile.page.scss']
})
export class ArtistProfilePage implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  artist: Artist | null = null;
  artistSongs: EnrichedSong[] = [];
  relatedArtists: Artist[] = [];
  isFollowing = false;
  isLoading = true;
  selectedTab = 'songs';
  followLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private artistsService: ArtistsService,
    private songsService: SongsService,
    private audioPlayerService: AudioPlayerService,
    private socialService: SocialService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.route.params.pipe(
      switchMap(params => {
        const artistId = params['id'];
        if (artistId) {
          this.loadFollowStatus(artistId);
          return this.loadArtistData(artistId);
        }
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadFollowStatus(artistId: string) {
    
    this.socialService.isArtistFollowed(artistId)
      .pipe(takeUntil(this.destroy$))
      .subscribe(isFollowing => {
        this.isFollowing = isFollowing;
      });
  }

  private async loadArtistData(artistId: string) {
    const loading = await this.loadingController.create({
      message: this.translate.instant('COMMON.LOADING')
    });
    await loading.present();

    try {
      const artist = await this.artistsService.getById(artistId).toPromise();
      
      if (artist) {
        this.artist = artist;
        
        if (artist.songs_IDS && artist.songs_IDS.length > 0) {
          await this.loadArtistSongs(artist.songs_IDS);
        }
        
        await this.loadRelatedArtists();
      } else {
        console.error('Artist not found for ID:', artistId);
      }
    } catch (error) {
      console.error('Error loading artist data:', error);
      this.showError('Error al cargar el perfil del artista');
    } finally {
      this.isLoading = false;
      await loading.dismiss();
    }
  }

  private async loadArtistSongs(songIds: string[]) {
    try {
      const songPromises = songIds.map(id => 
        this.songsService.getById(id).toPromise()
      );
      
      const songs = await Promise.all(songPromises);
      const validSongs = songs.filter((song): song is Song => song !== null);
      
      this.artistSongs = await this.enrichSongsWithArtists(validSongs);
      
    } catch (error) {
      console.error('Error loading artist songs:', error);
    }
  }

  private async enrichSongsWithArtists(songs: Song[]): Promise<EnrichedSong[]> {
    const enrichedSongs: EnrichedSong[] = [];
    
    for (const song of songs) {
      if (song.artists_IDS && song.artists_IDS.length > 0) {
        try {
          const artists = await this.artistsService.getByIds(song.artists_IDS).toPromise();
          if (artists) {
            const enrichedSong: EnrichedSong = {
              ...song,
              artistNames: artists.map(artist => artist.name)
            };
            enrichedSongs.push(enrichedSong);
          }
        } catch (error) {
          console.error('Error loading artists for song:', song.id, error);
          enrichedSongs.push({ ...song, artistNames: [] });
        }
      } else {
        enrichedSongs.push({ ...song, artistNames: [] });
      }
    }
    
    return enrichedSongs;
  }

  private async loadRelatedArtists() {
    try {
      const allArtists = await this.artistsService.getAll(1, 10).toPromise();
      if (allArtists) {
        this.relatedArtists = allArtists.data.filter(a => a.id !== this.artist?.id);
      }
    } catch (error) {
      console.error('Error loading related artists:', error);
    }
  }

  async toggleFollow() {
    if (!this.artist || this.followLoading) return;

    this.followLoading = true;

    try {
      if (this.isFollowing) {
        const success = await this.socialService.unfollowArtist(this.artist.id).toPromise();
        if (success) {
          this.showToast(`Ya no sigues a ${this.artist.name}`);
        } else {
          console.error('Failed to unfollow');
          this.showError('Error al dejar de seguir al artista');
        }
      } else {
        const success = await this.socialService.followArtist(this.artist.id).toPromise();
        if (success) {
          this.showToast(`Ahora sigues a ${this.artist.name}`);
        } else {
          console.error('Failed to follow');
          this.showError('Error al seguir al artista');
        }
      }
    } catch (error) {
      console.error('Error in toggleFollow:', error);
      this.showError('Error al actualizar el seguimiento');
    } finally {
      this.followLoading = false;
    }
  }

  async onPlayAll() {
    if (!this.artistSongs || this.artistSongs.length === 0) {
      this.showError('No hay canciones disponibles para reproducir');
      return;
    }

    try {
      
      if (typeof this.audioPlayerService.setQueue === 'function') {
        this.audioPlayerService.setQueue(this.artistSongs, 0);
      }

      if (typeof this.audioPlayerService.play === 'function') {
        await this.audioPlayerService.play(this.artistSongs[0]);
      }

      this.showToast(`Reproduciendo ${this.artistSongs.length} canciones de ${this.artist?.name}`);
      
    } catch (error) {
      console.error('Error playing songs:', error);
      this.showError('Error al reproducir las canciones');
    }
  }

  async onPlaySong(song: EnrichedSong, index: number) {
    if (!song) return;

    try {      
      if (typeof this.audioPlayerService.setQueue === 'function') {
        this.audioPlayerService.setQueue(this.artistSongs, index);
      }

      if (typeof this.audioPlayerService.play === 'function') {
        await this.audioPlayerService.play(song);
      }

      this.showToast(`Reproduciendo: ${song.name}`);
      
    } catch (error) {
      console.error('Error playing song:', error);
      this.showError('Error al reproducir la canción');
    }
  }

  onRelatedArtistClick(artist: Artist) {
    this.router.navigate(['/artist', artist.id]);
  }

  goBack() {
    this.location.back();
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  private async showError(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'danger'
    });
    toast.present();
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color: 'success'
    });
    toast.present();
  }
}
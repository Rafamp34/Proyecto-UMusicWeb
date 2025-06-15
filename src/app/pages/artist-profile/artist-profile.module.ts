// src/app/pages/artist-profile/artist-profile.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared/shared.module';

import { ArtistProfilePageRoutingModule } from './artist-profile-routing.module';
import { ArtistProfilePage } from './artist-profile.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule.forChild(),
    SharedModule,
    ArtistProfilePageRoutingModule
  ],
  declarations: [ArtistProfilePage]
})
export class ArtistProfilePageModule {}
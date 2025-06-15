import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArtistProfilePage } from './artist-profile.page';

describe('ArtistProfilePage', () => {
  let component: ArtistProfilePage;
  let fixture: ComponentFixture<ArtistProfilePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ArtistProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

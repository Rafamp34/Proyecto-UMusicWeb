// src/app/core/models/enriched-song.interface.ts
import { Song } from './song.model';

export interface EnrichedSong extends Song {
    artistNames?: string[];
}


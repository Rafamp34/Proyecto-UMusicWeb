// songs-repository.interface.ts
import { Observable } from "rxjs";
import { Song } from "../../models/song.model";
import { IBaseRepository } from "./base-repository.interface";

export interface ISongsRepository extends IBaseRepository<Song> {
  // ✅ SOBRESCRIBIR el método update para aceptar Partial<Song>
  update(id: string, entity: Partial<Song>): Observable<Song>;
  
  // Métodos específicos opcionales
  getByPlaylistId?(playlistId: string): Observable<Song[] | null>;
}
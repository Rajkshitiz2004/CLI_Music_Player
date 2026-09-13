import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDemoTracks } from './audioUtils.js';
import { Playlist } from './playlist.js';

const tracksDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'songs');
ensureDemoTracks(tracksDir);

const playlist = new Playlist(tracksDir);
playlist.loadTracks();

console.log('CLI Music Player — playlist');
if (playlist.tracks.length === 0) {
  console.log('No tracks found.');
} else {
  for (const track of playlist.tracks) {
    const marker = track.id === playlist.selectedIndex + 1 ? '>' : ' ';
    console.log(`${marker} ${track.id}. ${track.title} [${track.formattedDuration}]`);
  }
}

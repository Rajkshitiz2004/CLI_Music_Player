import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDemoTracks } from './audioUtils.js';
import { Playlist } from './playlist.js';
import { AudioPlayer } from './player.js';

const tracksDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'songs');
ensureDemoTracks(tracksDir);

const playlist = new Playlist(tracksDir);
playlist.loadTracks();
const player = new AudioPlayer();

const track = playlist.setPlayingToSelected();
if (!track) {
  console.log('No tracks found in songs/.');
  process.exit(0);
}

console.log(`Playing: ${track.title} [${track.formattedDuration}]`);
console.log('Press Ctrl+C to stop.');
player.play(track);

player.on('finished', () => {
  console.log('Track finished.');
  process.exit(0);
});

process.on('SIGINT', () => {
  player.stop();
  process.exit(0);
});

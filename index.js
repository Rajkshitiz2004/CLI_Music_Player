import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDemoTracks } from './audioUtils.js';
import { Playlist } from './playlist.js';
import { AudioPlayer } from './player.js';
import { UI } from './UI.js';

const tracksDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'songs');
ensureDemoTracks(tracksDir);

const playlist = new Playlist(tracksDir);
playlist.loadTracks();
const player = new AudioPlayer();
const ui = new UI(playlist, player);

process.on('SIGINT', () => {
  player.stop();
  ui.stop();
  process.exit(0);
});

ui.start();

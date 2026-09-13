import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDemoTracks, cleanupTempFiles } from './audioUtils.js';
import { Playlist } from './playlist.js';
import { AudioPlayer } from './player.js';
import { UI } from './UI.js';

// Resolve project root & songs directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = __dirname;
const tracksDir = path.join(projectRoot, 'songs');

// 1. Cleanup any old temp files & generate multi-tone synth demo WAV tracks if directory is empty
cleanupTempFiles(tracksDir);
ensureDemoTracks(tracksDir);

// 2. Instantiate core modules
const playlist = new Playlist(tracksDir);
playlist.loadTracks();

const player = new AudioPlayer();
const ui = new UI(playlist, player);

// 3. Auto-advance track on finish
player.on('finished', () => {
  const nextIdx = playlist.nextTrackIndex();
  if (nextIdx >= 0) {
    playlist.selectedIndex = nextIdx;
    const nextTrack = playlist.setPlayingToSelected();
    if (nextTrack) {
      player.play(nextTrack, 0);
    }
  }
});

// 4. Robust process cleanup handling
function cleanupAndExit(code = 0) {
  try {
    player.stop();
    ui.stop();
    cleanupTempFiles(tracksDir);
  } catch (e) {
    // Ignore cleanup errors
  }
  process.exit(code);
}

process.on('SIGINT', () => cleanupAndExit(0));
process.on('SIGTERM', () => cleanupAndExit(0));
process.on('exit', () => {
  player.stopCurrentProcess();
  process.stdout.write('\x1b[?25h\n');
});

process.on('uncaughtException', (err) => {
  cleanupAndExit(1);
});

// 5. Launch Terminal UI
ui.start();

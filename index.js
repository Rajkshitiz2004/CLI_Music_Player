import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureDemoTracks, getAudioDuration, formatTime } from './audioUtils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tracksDir = path.join(__dirname, 'songs');

ensureDemoTracks(tracksDir);

const files = fs.readdirSync(tracksDir).filter(file => /\.(wav|mp3|m4a|flac|aac|aiff)$/i.test(file));

console.log('CLI Music Player — audio utilities');
console.log('Tracks in songs/:');
for (const file of files) {
  const duration = getAudioDuration(path.join(tracksDir, file));
  console.log(`- ${file} (${formatTime(duration)})`);
}

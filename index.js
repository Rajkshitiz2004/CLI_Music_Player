import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const songsDir = path.join(__dirname, 'songs');

console.log('CLI Music Player');
console.log('Project folder:', __dirname);
console.log('Songs folder:', songsDir);

if (!fs.existsSync(songsDir)) {
  fs.mkdirSync(songsDir, { recursive: true });
  console.log('Created empty songs/ directory.');
} else {
  const files = fs.readdirSync(songsDir).filter(name => !name.startsWith('.'));
  if (files.length === 0) {
    console.log('No audio files yet. Add tracks to songs/ in the next steps.');
  } else {
    console.log('Found files:', files.join(', '));
  }
}

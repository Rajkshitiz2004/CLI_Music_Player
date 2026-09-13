import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0));
  const minutes = Math.floor(safeSeconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

export function getAudioDuration(filePath) {
  try {
    const output = execFileSync('afinfo', [filePath], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const match = output.match(/estimated duration:\s*([\d.]+)\s*sec/i);
    if (match) return Number(match[1]);
  } catch {
    // Fall through to WAV header parsing for environments without afinfo.
  }

  try {
    const header = fs.readFileSync(filePath);
    if (header.toString('ascii', 0, 4) === 'RIFF' && header.toString('ascii', 8, 12) === 'WAVE') {
      const channels = header.readUInt16LE(22);
      const sampleRate = header.readUInt32LE(24);
      const bitsPerSample = header.readUInt16LE(34);
      const dataOffset = header.indexOf(Buffer.from('data'));
      if (dataOffset >= 0 && channels && sampleRate && bitsPerSample) {
        return (header.readUInt32LE(dataOffset + 4) / (channels * sampleRate * bitsPerSample / 8));
      }
    }
  } catch {
    // A track that cannot be inspected is treated as zero length.
  }
  return 0;
}

export function ensureDemoTracks(tracksDir) {
  fs.mkdirSync(tracksDir, { recursive: true });
  const hasAudio = fs.readdirSync(tracksDir).some(file => /\.(wav|mp3|m4a|flac|aac|aiff)$/i.test(file));
  if (hasAudio) return;

  for (const [index, frequency] of [261.63, 329.63, 392].entries()) {
    const filePath = path.join(tracksDir, `demo-${index + 1}.wav`);
    writeTone(filePath, frequency);
  }
}

function writeTone(filePath, frequency) {
  const sampleRate = 44100;
  const duration = 3;
  const sampleCount = sampleRate * duration;
  const data = Buffer.alloc(sampleCount * 2);
  for (let i = 0; i < sampleCount; i += 1) {
    const envelope = Math.min(1, i / 1000, (sampleCount - i) / 1000);
    data.writeInt16LE(Math.round(Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.25 * envelope * 32767), i * 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + data.length, 4); header.write('WAVE', 8);
  header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22); header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28); header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(data.length, 40);
  fs.writeFileSync(filePath, Buffer.concat([header, data]));
}

export function cleanupTempFiles(tracksDir) {
  if (!fs.existsSync(tracksDir)) return;
  for (const file of fs.readdirSync(tracksDir)) {
    if (file.startsWith('tmp_')) fs.rmSync(path.join(tracksDir, file), { force: true });
  }
}

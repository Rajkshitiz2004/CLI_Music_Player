import fs from 'node:fs';
import path from 'node:path';
import { getAudioDuration, formatTime } from './audioUtils.js';

export class Playlist {
  constructor(tracksDir) {
    this.tracksDir = tracksDir;
    this.tracks = [];
    this.selectedIndex = 0;
    this.playingIndex = -1;
  }

  loadTracks() {
    this.tracks = [];
    if (!fs.existsSync(this.tracksDir)) return;

    const validExts = ['.wav', '.mp3', '.m4a', '.flac', '.aac', '.aiff'];
    const audioFiles = fs.readdirSync(this.tracksDir)
      .filter(f => !f.startsWith('.') && validExts.includes(path.extname(f).toLowerCase()))
      .sort();

    audioFiles.forEach((file, idx) => {
      const fullPath = path.join(this.tracksDir, file);
      const title = path.basename(file, path.extname(file))
        .replace(/^[0-9]+[_-]?/, '')
        .replace(/[_-]/g, ' ');
      const duration = getAudioDuration(fullPath);

      this.tracks.push({
        id: idx + 1,
        filename: file,
        title,
        path: fullPath,
        duration,
        formattedDuration: formatTime(duration)
      });
    });
  }

  selectNext() {
    if (this.tracks.length === 0) return;
    this.selectedIndex = (this.selectedIndex + 1) % this.tracks.length;
  }

  selectPrev() {
    if (this.tracks.length === 0) return;
    this.selectedIndex = (this.selectedIndex - 1 + this.tracks.length) % this.tracks.length;
  }

  getSelectedTrack() {
    return this.tracks[this.selectedIndex] || null;
  }

  setPlayingToSelected() {
    this.playingIndex = this.selectedIndex;
    return this.getSelectedTrack();
  }
}

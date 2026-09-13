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

    const files = fs.readdirSync(this.tracksDir);
    const validExts = ['.wav', '.mp3', '.m4a', '.flac', '.aac', '.aiff'];

    const audioFiles = files
      .filter(f => !f.startsWith('.') && !f.startsWith('tmp_') && validExts.includes(path.extname(f).toLowerCase()))
      .sort();

    audioFiles.forEach((file, idx) => {
      const fullPath = path.join(this.tracksDir, file);
      const nameWithoutExt = path.basename(file, path.extname(file))
        .replace(/^[0-9]+[_-]?/, '') // remove leading track numbers if present
        .replace(/[_-]/g, ' ');       // replace underscores/dashes with spaces

      const duration = getAudioDuration(fullPath);

      this.tracks.push({
        id: idx + 1,
        filename: file,
        title: nameWithoutExt,
        path: fullPath,
        duration: duration,
        formattedDuration: formatTime(duration)
      });
    });

    if (this.selectedIndex >= this.tracks.length) {
      this.selectedIndex = Math.max(0, this.tracks.length - 1);
    }
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

  getPlayingTrack() {
    if (this.playingIndex < 0 || this.playingIndex >= this.tracks.length) return null;
    return this.tracks[this.playingIndex];
  }

  setPlayingToSelected() {
    this.playingIndex = this.selectedIndex;
    return this.getSelectedTrack();
  }

  nextTrackIndex() {
    if (this.tracks.length === 0) return -1;
    return (this.playingIndex + 1) % this.tracks.length;
  }
}

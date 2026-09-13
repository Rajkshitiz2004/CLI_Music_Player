import readline from 'node:readline';
import { formatTime } from './audioUtils.js';

export class UI {
  constructor(playlist, player) {
    this.playlist = playlist;
    this.player = player;
    this.renderInterval = null;
    this.isRawMode = false;
  }

  start() {
    process.stdout.write('\x1b[?25l\x1b[2J\x1b[H');

    if (process.stdin.isTTY) {
      readline.emitKeypressEvents(process.stdin);
      process.stdin.setRawMode(true);
      this.isRawMode = true;
      process.stdin.on('keypress', this.handleKeyPress.bind(this));
    }

    this.renderInterval = setInterval(() => this.render(), 100);
    this.render();
  }

  stop() {
    if (this.renderInterval) {
      clearInterval(this.renderInterval);
      this.renderInterval = null;
    }
    if (this.isRawMode && process.stdin.isTTY) {
      process.stdin.setRawMode(false);
      this.isRawMode = false;
    }
    process.stdout.write('\x1b[?25h\n');
  }

  handleKeyPress(str, key) {
    if (!key) return;

    if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
      this.player.stop();
      this.stop();
      process.exit(0);
    }

    if (key.name === 'up' || key.name === 'k') {
      this.playlist.selectPrev();
    } else if (key.name === 'down' || key.name === 'j') {
      this.playlist.selectNext();
    } else if (key.name === 'return') {
      const track = this.playlist.setPlayingToSelected();
      if (track) this.player.play(track, 0);
    } else if (key.name === 'space' || key.name === 'p' || str === ' ') {
      this.player.togglePause();
    } else if (key.name === 'left') {
      this.player.seek(-5);
    } else if (key.name === 'right') {
      this.player.seek(5);
    } else if (key.name === 'm') {
      this.player.toggleMute();
    }

    this.render();
  }

  render() {
    const lines = ['CLI Music Player', ''];

    this.playlist.tracks.forEach((track, i) => {
      const cursor = i === this.playlist.selectedIndex ? '>' : ' ';
      let icon = ' ';
      if (i === this.playlist.playingIndex) {
        icon = this.player.state === 'PAUSED' ? '⏸' : this.player.state === 'PLAYING' ? '▶' : ' ';
      }
      lines.push(`${cursor} ${icon} ${track.id}. ${track.title} [${track.formattedDuration}]`);
    });

    lines.push('');
    const playing = this.player.currentTrack;
    if (playing) {
      const elapsed = this.player.getElapsedSeconds();
      const duration = playing.duration || 1;
      const pct = Math.min(100, Math.max(0, Math.floor((elapsed / duration) * 100)));
      const filled = Math.floor(pct / 5);
      const bar = `${'█'.repeat(filled)}${'░'.repeat(20 - filled)}`;
      const mute = this.player.isMuted ? ' MUTED' : '';
      lines.push(`${this.player.state}${mute}: ${playing.title}`);
      lines.push(`${formatTime(elapsed)} / ${playing.formattedDuration}  [${bar}] ${pct}%`);
    } else {
      lines.push('Press Enter to play the highlighted track.');
    }

    lines.push('[↑/↓] Select  [Enter] Play  [Space] Pause  [←/→] Seek  [m] Mute  [q] Quit');

    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
    process.stdout.write(lines.join('\n') + '\n');
  }
}

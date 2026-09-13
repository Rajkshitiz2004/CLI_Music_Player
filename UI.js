import readline from 'node:readline';

export class UI {
  constructor(playlist, player) {
    this.playlist = playlist;
    this.player = player;
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

    this.render();
  }

  stop() {
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
      if (track) this.player.play(track);
    }

    this.render();
  }

  render() {
    const lines = ['CLI Music Player', ''];

    this.playlist.tracks.forEach((track, i) => {
      const cursor = i === this.playlist.selectedIndex ? '>' : ' ';
      const playing = i === this.playlist.playingIndex && this.player.state === 'PLAYING' ? '▶' : ' ';
      lines.push(`${cursor} ${playing} ${track.id}. ${track.title} [${track.formattedDuration}]`);
    });

    lines.push('');
    if (this.player.currentTrack) {
      lines.push(`Now playing: ${this.player.currentTrack.title} (${this.player.state})`);
    } else {
      lines.push('Press Enter to play the highlighted track.');
    }
    lines.push('[↑/↓] Select  [Enter] Play  [q] Quit');

    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);
    process.stdout.write(lines.join('\n') + '\n');
  }
}

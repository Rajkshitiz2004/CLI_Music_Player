import readline from 'node:readline';
import { formatTime } from './audioUtils.js';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  bgCyan: '\x1b[46m\x1b[30m',
  bgMagenta: '\x1b[45m\x1b[30m',
  bgBlue: '\x1b[44m\x1b[37m',
  bgHighlight: '\x1b[48;5;236m\x1b[38;5;51m'
};

const ANSI_RE = /\x1b\[[0-9;]*m/g;
const BOX_WIDTH = 64;
const INNER_WIDTH = BOX_WIDTH - 2;

function stripAnsi(text) {
  return text.replace(ANSI_RE, '');
}

function isWideCodePoint(cp) {
  return (
    (cp >= 0x1100 && cp <= 0x115F) ||
    cp === 0x2329 ||
    cp === 0x232A ||
    (cp >= 0x2E80 && cp <= 0xA4CF && cp !== 0x303F) ||
    (cp >= 0xAC00 && cp <= 0xD7A3) ||
    (cp >= 0xF900 && cp <= 0xFAFF) ||
    (cp >= 0xFE10 && cp <= 0xFE19) ||
    (cp >= 0xFE30 && cp <= 0xFE6F) ||
    (cp >= 0xFF00 && cp <= 0xFF60) ||
    (cp >= 0xFFE0 && cp <= 0xFFE6) ||
    (cp >= 0x1F300 && cp <= 0x1F64F) ||
    (cp >= 0x1F900 && cp <= 0x1F9FF) ||
    (cp >= 0x1FA00 && cp <= 0x1FAFF) ||
    (cp >= 0x2600 && cp <= 0x27BF)
  );
}

function visibleWidth(text) {
  let width = 0;
  for (const char of stripAnsi(text)) {
    const cp = char.codePointAt(0);
    width += isWideCodePoint(cp) ? 2 : 1;
  }
  return width;
}

function padInner(text, width = INNER_WIDTH) {
  const gap = Math.max(0, width - visibleWidth(text));
  return `${text}${' '.repeat(gap)}`;
}

function truncateToWidth(text, width) {
  let result = '';
  let used = 0;
  for (const char of text) {
    const next = isWideCodePoint(char.codePointAt(0)) ? 2 : 1;
    if (used + next > width) break;
    result += char;
    used += next;
  }
  return result;
}

function boxLine(inner) {
  return `${colors.cyan}│${colors.reset}${padInner(inner)}${colors.cyan}│${colors.reset}`;
}

function boxRule(kind) {
  const line = '─'.repeat(INNER_WIDTH);
  if (kind === 'top') return `${colors.cyan}┌${line}┐${colors.reset}`;
  if (kind === 'mid') return `${colors.cyan}├${line}┤${colors.reset}`;
  return `${colors.cyan}└${line}┘${colors.reset}`;
}

export class UI {
  constructor(playlist, player) {
    this.playlist = playlist;
    this.player = player;
    this.renderInterval = null;
    this.isRawMode = false;
    this.pauseKeyLocked = false;
    this.drawnLines = 0;
    this.usingAltScreen = false;
  }

  start() {
    if (process.stdout.isTTY) {
      process.stdout.write('\x1b[?1049h');
      this.usingAltScreen = true;
    }
    process.stdout.write('\x1b[?25l');
    process.stdout.write('\x1b[2J\x1b[H');
    this.drawnLines = 0;

    if (process.stdin.isTTY) {
      readline.emitKeypressEvents(process.stdin);
      process.stdin.setRawMode(true);
      this.isRawMode = true;
      process.stdin.on('keypress', this.handleKeyPress.bind(this));
    }

    this.renderInterval = setInterval(() => {
      this.render();
    }, 100);

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

    process.stdout.write('\x1b[?25h');
    if (this.usingAltScreen) {
      process.stdout.write('\x1b[?1049l');
      this.usingAltScreen = false;
    } else {
      process.stdout.write('\n');
    }
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
      this.render();
    } else if (key.name === 'down' || key.name === 'j') {
      this.playlist.selectNext();
      this.render();
    } else if (key.name === 'return') {
      const track = this.playlist.setPlayingToSelected();
      if (track) {
        this.player.play(track, 0);
      }
      this.render();
    } else if (key.name === 'space' || key.name === 'p' || str === ' ') {
      if (this.pauseKeyLocked) return;
      this.pauseKeyLocked = true;
      this.player.togglePause();
      this.render();
      setTimeout(() => {
        this.pauseKeyLocked = false;
      }, 1000);
    } else if (key.name === 'left') {
      this.player.seek(-5);
      this.render();
    } else if (key.name === 'right') {
      this.player.seek(5);
      this.render();
    } else if (key.name === 'm') {
      this.player.toggleMute();
      this.render();
    }
  }

  buildFrame() {
    const lines = [];

    lines.push(boxRule('top'));
    lines.push(boxLine(`  ${colors.bold}${colors.yellow}🎵 INTERACTIVE TERMINAL MUSIC PLAYER 🎵${colors.reset}`));
    lines.push(boxRule('mid'));

    lines.push(boxLine(` ${colors.bold}${colors.magenta}PLAYLIST TRACKS:${colors.reset}`));

    const tracks = this.playlist.tracks;
    if (tracks.length === 0) {
      lines.push(boxLine(`   ${colors.dim}No tracks found in songs/ directory.${colors.reset}`));
    } else {
      tracks.forEach((track, i) => {
        const isSelected = i === this.playlist.selectedIndex;
        const isPlayingTrack = i === this.playlist.playingIndex;

        let marker = '  ';
        if (isSelected) marker = '❯ ';

        let playIcon = '  ';
        if (isPlayingTrack) {
          if (this.player.state === 'PLAYING') playIcon = '▶ ';
          else if (this.player.state === 'PAUSED') playIcon = '⏸ ';
          else playIcon = '⏹ ';
        }

        const durStr = `[${track.formattedDuration}]`;
        const titleBudget = INNER_WIDTH - visibleWidth(` ${marker}${playIcon}`) - durStr.length - 1;
        const titleStr = truncateToWidth(`${track.id}. ${track.title}`, Math.max(1, titleBudget));
        const gap = Math.max(1, titleBudget - visibleWidth(titleStr));
        const rowBody = ` ${marker}${playIcon}${titleStr}${' '.repeat(gap)}${durStr}`;

        if (isSelected) {
          lines.push(boxLine(`${colors.bgHighlight}${colors.bold}${padInner(rowBody)}${colors.reset}`));
        } else if (isPlayingTrack && this.player.state === 'PLAYING') {
          lines.push(boxLine(`${colors.green}${rowBody}${colors.reset}`));
        } else {
          lines.push(boxLine(`${colors.dim}${rowBody}${colors.reset}`));
        }
      });
    }

    lines.push(boxRule('mid'));
    lines.push(boxLine(` ${colors.bold}${colors.magenta}NOW PLAYING:${colors.reset}`));

    const playingTrack = this.player.currentTrack;
    if (playingTrack) {
      let stateBadge = `${colors.dim}[ STOPPED ⏹ ]${colors.reset}`;
      if (this.player.state === 'PLAYING') {
        stateBadge = `${colors.bold}${colors.green}[ PLAYING ▶ ]${colors.reset}`;
      } else if (this.player.state === 'PAUSED') {
        stateBadge = `${colors.bold}${colors.yellow}[ PAUSED ⏸ ]${colors.reset}`;
      }
      if (this.player.isMuted) {
        stateBadge += ` ${colors.red}[MUTED 🔇]${colors.reset}`;
      }
      lines.push(boxLine(`   Status: ${stateBadge}`));

      const title = truncateToWidth(playingTrack.title, INNER_WIDTH - 12);
      lines.push(boxLine(`   Track : ${colors.bold}${colors.yellow}${title}${colors.reset}`));

      const elapsed = this.player.getElapsedSeconds();
      const duration = playingTrack.duration || 1;
      const pct = Math.min(100, Math.max(0, Math.floor((elapsed / duration) * 100)));
      const timeStr = `${formatTime(elapsed)} / ${playingTrack.formattedDuration}`;
      lines.push(boxLine(`   Time  : ${colors.cyan}${timeStr}${colors.reset}`));

      const barWidth = 32;
      const filledLen = Math.floor((pct / 100) * barWidth);
      const emptyLen = barWidth - filledLen;
      const progressBar = `${colors.cyan}${'█'.repeat(filledLen)}${colors.gray}${'░'.repeat(emptyLen)}${colors.reset}`;
      const pctStr = `${pct.toString().padStart(3, ' ')}%`;
      lines.push(boxLine(`   Progress: [${progressBar}] ${colors.bold}${colors.yellow}${pctStr}${colors.reset}`));
    } else {
      lines.push(boxLine(`   ${colors.dim}Press [ENTER] on any track to start playback.${colors.reset}`));
      lines.push(boxLine(''));
      lines.push(boxLine(''));
      lines.push(boxLine(''));
    }

    lines.push(boxRule('mid'));
    lines.push(boxLine(` ${colors.bold}${colors.gray}[↑/↓] Select  [Enter] Play  [Space] Pause/Resume${colors.reset}`));
    lines.push(boxLine(` ${colors.bold}${colors.gray}[←/→] Seek ±5s  [m] Mute  [q] Quit${colors.reset}`));
    lines.push(boxRule('bottom'));

    return lines;
  }

  render() {
    const lines = this.buildFrame();

    if (this.usingAltScreen || process.stdout.isTTY) {
      readline.cursorTo(process.stdout, 0, 0);
      readline.clearScreenDown(process.stdout);
      process.stdout.write(lines.join('\n') + '\n');
    } else if (this.drawnLines > 0) {
      process.stdout.write(`\x1b[${this.drawnLines}A`);
      process.stdout.write(lines.map(line => `\x1b[2K${line}`).join('\n') + '\n');
    } else {
      process.stdout.write(lines.map(line => `\x1b[2K${line}`).join('\n') + '\n');
    }

    this.drawnLines = lines.length;
  }
}

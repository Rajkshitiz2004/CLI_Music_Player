import { EventEmitter } from 'node:events';
import { spawn } from 'node:child_process';

export class AudioPlayer extends EventEmitter {
  constructor() {
    super();
    this.currentTrack = null;
    this.process = null;
    this.state = 'STOPPED';
    this.isMuted = false;
    this.startedAt = 0;
    this.elapsedBeforePause = 0;
    this.playbackId = 0;
  }

  play(track, offset = 0) {
    this.stopCurrentProcess();
    const playbackId = ++this.playbackId;
    this.currentTrack = track;
    this.elapsedBeforePause = Math.max(0, offset);
    this.startedAt = Date.now();
    const args = [];
    if (this.isMuted) args.push('-v', '0');
    args.push(track.path);
    const child = spawn('afplay', args, { stdio: 'ignore' });
    this.process = child;
    child.once('error', error => {
      if (child === this.process) this.emit('error', error);
    });
    child.once('close', code => {
      // Ignore termination from an older track after a new track has started.
      if (playbackId !== this.playbackId || child !== this.process) return;
      this.process = null;
      if (this.state !== 'PLAYING') return;
      this.state = 'STOPPED';
      this.elapsedBeforePause = 0;
      if (code === 0) this.emit('finished');
    });
    this.state = 'PLAYING';
  }

  stop() {
    this.playbackId += 1;
    this.stopCurrentProcess();
    this.state = 'STOPPED';
    this.currentTrack = null;
    this.elapsedBeforePause = 0;
  }

  stopCurrentProcess() {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
      this.playbackId += 1;
    }
  }

  togglePause() {
    if (!this.currentTrack) return;
    if (this.state === 'PLAYING') {
      this.elapsedBeforePause = this.getElapsedSeconds();
      if (this.process) this.process.kill('SIGSTOP');
      this.state = 'PAUSED';
    } else if (this.state === 'PAUSED') {
      if (!this.process) {
        this.play(this.currentTrack, this.elapsedBeforePause);
        return;
      }
      this.startedAt = Date.now();
      this.process.kill('SIGCONT');
      this.state = 'PLAYING';
    }
  }

  seek(delta) {
    if (!this.currentTrack) return;
    const next = Math.max(0, Math.min(this.currentTrack.duration, this.getElapsedSeconds() + delta));
    this.play(this.currentTrack, next);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.state === 'PLAYING') this.play(this.currentTrack, this.getElapsedSeconds());
  }

  getElapsedSeconds() {
    if (this.state === 'PLAYING') return this.elapsedBeforePause + (Date.now() - this.startedAt) / 1000;
    return this.elapsedBeforePause;
  }
}

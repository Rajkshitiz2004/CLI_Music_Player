import { EventEmitter } from 'node:events';
import { spawn } from 'node:child_process';

export class AudioPlayer extends EventEmitter {
  constructor() {
    super();
    this.currentTrack = null;
    this.process = null;
    this.state = 'STOPPED';
    this.playbackId = 0;
  }

  play(track) {
    this.stopCurrentProcess();
    const playbackId = ++this.playbackId;
    this.currentTrack = track;
    const child = spawn('afplay', [track.path], { stdio: 'ignore' });
    this.process = child;
    child.once('error', error => {
      if (child === this.process) this.emit('error', error);
    });
    child.once('close', code => {
      if (playbackId !== this.playbackId || child !== this.process) return;
      this.process = null;
      this.state = 'STOPPED';
      if (code === 0) this.emit('finished');
    });
    this.state = 'PLAYING';
  }

  stop() {
    this.playbackId += 1;
    this.stopCurrentProcess();
    this.state = 'STOPPED';
    this.currentTrack = null;
  }

  stopCurrentProcess() {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
  }
}

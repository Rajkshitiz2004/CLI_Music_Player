# Interactive Terminal Music Player

A clean, interactive terminal audio player built in Node.js with zero external npm dependencies.

## Features

- Arrow-key playlist navigation
- In-place terminal redraw
- Instant track switching
- Pause / resume, seek, mute
- Live progress bar
- Auto-advance to the next track
- Clean shutdown (`q` or Ctrl+C)

## Controls

| Key | Action |
| --- | --- |
| `↑` / `↓` (or `k` / `j`) | Move track cursor |
| `Enter` | Play highlighted track |
| `Space` / `p` | Pause / resume |
| `←` / `→` | Seek backward / forward 5s |
| `m` | Toggle mute |
| `q` / `Ctrl+C` | Stop and quit |

## Run

Requires Node.js v18+ and macOS (`afplay`).

```bash
npm start
```

Add audio files (`.wav`, `.mp3`, `.m4a`, `.flac`) to the `songs/` folder. If the folder is empty, demo WAV tones are generated automatically.

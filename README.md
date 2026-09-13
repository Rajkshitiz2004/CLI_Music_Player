# Interactive Terminal Music Player 🎵

A clean, responsive, interactive terminal TUI audio player built in Node.js with zero external npm dependencies.

## Key Features

1. **Arrow Key Navigation**: Easily move up and down through track list using `↑` / `↓` (or `k` / `j`).
2. **In-Place Redraw**: Smooth single-tick screen updates (`\x1b[H\x1b[J`) without cluttering terminal output or spamming new lines.
3. **Instant Track Switching**: Press `Enter` on any track to start playing immediately. Old processes and seek buffers are killed and cleaned up cleanly.
4. **Pause & Resume**: Press `Space` (or `p`) to pause playback and resume from the exact same timestamp without loss of position.
5. **Exact Duration Tracking**: Displays exact duration formatted as `MM:SS` for all tracks in the playlist.
6. **Live Dynamic Progress Bar**: Real-time progress bar with percentage indicator (`[████████████░░░░░░░░░░░░] 45%`) updated at 10 FPS.
7. **Clean Exit & Timer Management**: `q` or `Ctrl+C` cleanly terminates all sub-processes, stops render timers, cleans up temp files, and restores terminal cursor/settings.

## Controls

| Key | Action |
| --- | --- |
| `↑` / `↓` (or `k` / `j`) | Move track cursor UP / DOWN |
| `Enter` | Play highlighted track |
| `Space` / `p` | Toggle Pause / Resume |
| `←` / `→` | Seek backward / forward 5s |
| `m` | Toggle Mute |
| `q` / `Ctrl+C` | Stop playback & Quit player |

## Requirements & Running

- **Node.js**: v18+
- **OS**: macOS (`afplay` built-in native audio engine)

To launch the music player:

```bash
cd "/Users/kshitizraj/Documents/NST_ADYPU_Academics/YEAR_2/SEM-3/AD/CLI music player project"
npm start
```

Audio files (`.wav`, `.mp3`, `.m4a`, `.flac`) can be added directly into the `songs/` folder.

# MP4 Renderer — WebCodecs Video Engine

🎬 **Browser-based video renderer** that transforms HTML canvas animations into YouTube-ready MP4 files with hardware-accelerated H.264 encoding, automatic subtitles, and support for vertical/landscape resolutions.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org/)
[![WebCodecs](https://img.shields.io/badge/WebCodecs-GPU%20Accelerated-blue)](https://www.w3.org/TR/webcodecs/)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)]()

---

## ✨ Features

### Core Rendering
- ✅ **Hardware-Accelerated H.264** — GPU encoding (NVENC, VideoToolbox, Intel VCE)
- ✅ **Multiple Resolutions** — 1080p, 1440p, 4K (landscape & vertical/Shorts)
- ✅ **Direct-to-Disk Streaming** — Render unlimited-length videos without RAM crashes
- ✅ **Flexible FPS & Bitrate** — 24-120 FPS, 1-100 Mbps

### Subtitles & Audio
- ✅ **Auto-Subtitles (Offline AI)** — Groq Whisper API or local Transformers.js
- ✅ **Auto-Save SRT** — Automatic subtitle file generation to `/subtitles` folder
- ✅ **Audio Speed Control** — 0.5x to 2.0x playback speed with subtitle sync
- ✅ **Multiple Subtitle Styles** — Pop, Fade, Slide, Karaoke, Neon, Typewriter, etc.

### Scene Management
- ✅ **Advanced Scene Format** — SCENES metadata + RENDERERS drawing functions
- ✅ **Per-Scene Duration Control** — Individual timing for each scene
- ✅ **Audio-Based Distribution** — Auto-distribute scene durations based on audio length
- ✅ **7 Pre-Built Scenes** — Stoicism lessons (10, 15, 30, 65 minutes)

### Developer-Friendly
- ✅ **100% Browser-Based** — No server required (except optional Groq API)
- ✅ **Offline Capable** — Works without internet (except Groq transcription)
- ✅ **Well-Documented** — Complete guides in `/docs` folder
- ✅ **Production-Ready** — All features tested and stable

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Modern browser (Chrome, Edge, Firefox, Safari)
- Optional: Groq API key for auto-subtitles

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/mp4-renderer.git
cd mp4-renderer

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open `http://localhost:3000` in your browser.

### Basic Workflow

1. **Upload Scene** — Select HTML file from `/scenes` folder
2. **Add Audio** — Upload MP3/WAV (optional)
3. **Configure** — Set resolution, FPS, bitrate
4. **Transcribe** — Auto-generate subtitles (optional)
5. **Render** — Click "🚀 Start Render" and choose save location
6. **Download** — Video saves directly to your chosen folder

---

## 📁 Project Structure

```
mp4-renderer/
├── docs/                          # Documentation
│   ├── IMPLEMENTATION_COMPLETE.md # Feature guide
│   ├── FEATURE_STATUS.md          # Current status
│   ├── INCIDENT_HISTORY.md        # Issues & resolutions
│   └── AUDIO_DURATION_FIX.md      # Audio duration fix
│
├── scenes/                        # Scene animation files
│   ├── stoicism_30scenes.html     # 30 stoic lessons
│   ├── stoicism_10visuals.html    # 10 visual lessons
│   ├── finalgrok.html             # 21 scenes (65 min)
│   └── ...                        # More scene files
│
├── public/                        # Static assets
│   ├── models/                    # ML models (Whisper)
│   └── worker.js                  # Web Worker
│
├── src/                           # Source code
│   ├── index.css                  # Styles
│   └── whisper-app.js             # Whisper integration
│
├── subtitles/                     # Generated SRT files
├── app.js                         # Main application (1296 lines)
├── index.html                     # Main interface
├── styles.css                     # Global styles
└── package.json                   # Dependencies
```

---

## 🎯 Key Features Explained

### 1. YouTube Shorts Support
Select "1080×1920 — 1080p Vertical (Shorts)" from resolution dropdown. Subtitles automatically clamp to visible bounds.

```javascript
// Supported resolutions
- 1920×1080 (1080p Landscape)
- 1080×1920 (1080p Vertical/Shorts)
- 2560×1440 (1440p Landscape)
- 1440×2560 (1440p Vertical)
- 3840×2160 (4K Landscape)
- 2160×3840 (4K Vertical)
```

### 2. Direct-to-Disk Streaming
Render unlimited-length videos without RAM crashes. Data streams frame-by-frame directly to disk.

```
Before: 65-min video → 5GB RAM buffer → "Array buffer allocation failed" ❌
After:  65-min video → Direct to disk → Completes successfully ✅
```

### 3. Auto-Subtitles
Two options:
- **Groq Whisper API** — Fast, accurate, requires API key
- **Local Transformers.js** — Offline, slower, no API needed

```bash
# Groq API (recommended)
Get free key at: https://console.groq.com

# Local (offline)
First run downloads ~40MB Whisper model (cached after)
```

### 4. Flexible Scene Format
Define scenes with metadata and rendering functions:

```javascript
const SCENES = [
  { name: "Scene 1", sub: "Description", dur: 120, color: "#e8b86d" },
  { name: "Scene 2", sub: "Another scene", dur: 150 }
];

const RENDERERS = [
  (gt, st, tot) => { /* render frame 1 */ },
  (gt, st, tot) => { /* render frame 2 */ }
];
```

---

## 📊 Performance

| Resolution | FPS | Bitrate | Encoding Time | File Size |
|-----------|-----|---------|---------------|-----------|
| 1080p | 30 | 12 Mbps | ~1x realtime | ~5.4 GB/hour |
| 1440p | 30 | 16 Mbps | ~1.2x realtime | ~7.2 GB/hour |
| 4K | 30 | 25 Mbps | ~2x realtime | ~11.25 GB/hour |

*Times vary based on hardware (GPU acceleration available)*

---

## 🔧 Configuration

### Video Settings
- **Resolution** — 1080p to 4K (landscape & vertical)
- **FPS** — 24-120 frames per second
- **Bitrate** — 1-100 Mbps (default 12 Mbps)

### Subtitle Settings
- **Size** — 20-200px (default 72px)
- **Style** — 10 animation styles (Pop, Fade, Karaoke, etc.)
- **Speed** — 0.5x to 2.0x audio speed

### Audio Settings
- **Format** — MP3, WAV, M4A (max 25 MB for Groq)
- **Speed** — 0.5x to 2.0x playback speed
- **Compression** — Auto-compress for Groq API

---

## 📚 Documentation

- **[IMPLEMENTATION_COMPLETE.md](docs/IMPLEMENTATION_COMPLETE.md)** — Complete feature guide
- **[FEATURE_STATUS.md](docs/FEATURE_STATUS.md)** — Current feature status
- **[INCIDENT_HISTORY.md](docs/INCIDENT_HISTORY.md)** — Issues & resolutions
- **[AUDIO_DURATION_FIX.md](docs/AUDIO_DURATION_FIX.md)** — Audio duration fix
- **[scenes/README.md](scenes/README.md)** — Scene files guide

---

## 🎬 Example: Create Custom Scene

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    canvas { width: 1920px; height: 1080px; }
  </style>
</head>
<body>
  <script>
    const SCENES = [
      { name: "My Scene", sub: "Custom animation", dur: 120 }
    ];
    
    const RENDERERS = [
      (gt, st, tot) => {
        const canvas = document.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        
        // Clear background
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 1920, 1080);
        
        // Draw animation
        const progress = st / tot;
        ctx.fillStyle = '#fff';
        ctx.fillRect(100 + progress * 1700, 500, 100, 100);
      }
    ];
  </script>
</body>
</html>
```

Save to `/scenes` folder and upload via app.

---

## 🐛 Troubleshooting

### "Worker failed to load"
- Ensure you're using `npm run dev` (not opening `index.html` directly)
- Check browser console for errors
- Verify internet connection for CDN scripts

### "Unsupported video codec"
- Update browser to latest version
- Check GPU drivers are up-to-date
- Try different resolution or bitrate

### "Array buffer allocation failed"
- Use Direct-to-Disk Streaming (automatic for large videos)
- Reduce resolution or bitrate
- Close other applications to free RAM

### Subtitles missing or off-screen
- Check subtitle Y-position is within bounds
- Try different subtitle style
- Verify audio duration matches scene durations

---

## 🌐 Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | Recommended |
| Edge | ✅ Full | Recommended |
| Firefox | ⚠️ Limited | File System API fallback |
| Safari | ⚠️ Limited | File System API fallback |

---

## 📦 Dependencies

### Core
- **mp4-muxer** — MP4 file creation
- **WebCodecs API** — Hardware video encoding
- **Web Audio API** — Audio processing

### Optional
- **Groq API** — Fast transcription (requires API key)
- **Transformers.js** — Offline transcription (40MB model)

---

## 🔐 Privacy & Security

- ✅ **100% Browser-Based** — No data sent to servers (except optional Groq API)
- ✅ **Offline Capable** — Works without internet
- ✅ **No Tracking** — No analytics or telemetry
- ✅ **Open Source** — Full source code available

---

## 📝 License

MIT License — See [LICENSE](LICENSE) file for details

---

---

## 🎯 Roadmap

- [ ] WebM/VP9 codec support
- [ ] Real-time preview
- [ ] Batch rendering
- [ ] Cloud storage integration
- [ ] Advanced color grading
- [ ] Multi-track audio mixing

---

## 🙏 Acknowledgments

- **WebCodecs API** — W3C standard for hardware video encoding
- **Groq** — Fast AI transcription API
- **Transformers.js** — Offline ML in the browser
- **mp4-muxer** — MP4 file creation library

---

## 📊 Stats

- **Lines of Code** — 1,296 (app.js)
- **Features** — 4 major + 10+ subtitle styles
- **Scene Files** — 7 pre-built scenes
- **Documentation** — 5 comprehensive guides
- **Browser Support** — 4 major browsers

---

**Made with ❤️ for content creators**

Last updated: March 16, 2026

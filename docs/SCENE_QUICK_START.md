# 🚀 Quick Start Guide - Uploading allscenes/ to MP4 Renderer

## ⚡ 3 Simple Steps

### 1️⃣ Build the HTML File

Open terminal in the `mp4-renderer` directory and run:

```bash
cd allscenes
node build.cjs
```

**Output**: Creates `allscenes_built.html` (122 KB) in parent directory

---

### 2️⃣ Upload to MP4 Renderer

1. Open `index.html` (MP4 Renderer)
2. Drag `allscenes_built.html` into **Step 1: Scene File**
3. You'll see: `✓ 46 scenes loaded`

---

### 3️⃣ Configure & Render

1. **Step 4: Scene Durations**: Set how long each scene plays (default: 30s each)
2. **Optional: Step 2**: Upload background audio (MP3/WAV)
3. **Optional: Step 3**: Adjust video settings (resolution, FPS, bitrate)
4. **Optional: Step 5**: Add subtitles (AI transcription or SRT/VTT)
5. Click **🚀 Start Render**

---

## 📊 What You Get

- **46 Unique Scenes**: From "Crumbling Stone" to "Frozen Time"
- **Total Duration**: 46 scenes × 30s = **23 minutes** (default)
- **Resolution**: 1920×1080 (1080p)
- **Format**: H.264 MP4 (YouTube-ready)

---

## 🔄 Rebuilding After Changes

Made changes to scene files? Rebuild:

```bash
cd allscenes
node build.cjs
```

Then upload the new `allscenes_built.html` to MP4 Renderer.

---

## 📁 File Structure (What Gets Built)

```
allscenes/
├── config.js        → Scene metadata (names, durations, colors)
├── engine.js        → Core animation engine
├── renderers.js     → Scene renderers 0-5
├── renderers2.js    → Scene renderers 6-29
├── renderers3.js    → Scene renderers 30-39
├── renderers4.js    → Scene renderers 40-46
├── renderers5.js    → Additional scenes
├── app.js           → App initialization
├── styles.css       → Styling
└── build.cjs       → Build script

↓ (run build.cjs)

allscenes_built.html  ← Upload this to MP4 Renderer
```

---

## 🎬 Scene List (All 46)

| # | Scene | # | Scene | # | Scene |
|---|-------|---|-------|---|-------|
| 0 | Crumbling Stone | 16 | Phoenix Embers | 32 | Meteor Shower |
| 1 | Dual Orbs | 17 | Sacred Geometry | 33 | Fractal Waves |
| 2 | Ripple Pond | 18 | Nebula Bloom | 34 | Plasma Field |
| 3 | Solar System | 19 | Mountain Silhouette | 35 | Vortex Spiral |
| 4 | Fire to Gold | 20 | DNA Helix | 36 | Bio-Luminescence |
| 5 | Sand Mandala | 21 | Tidal Breath | 37 | Time Distortion |
| 6 | Storm Horizon | 22 | Gold Dust Fall | 38 | Neural Network |
| 7 | Fortress Walls | 23 | Eye of Calm | 39 | Cosmic Web |
| 8 | Thread of Light | 24 | Stone Circles | 40 | Geyser Eruption |
| 9 | Constellation | 25 | Aurora Flow | 41 | Kaleidoscope Dance |
| 10 | Smoke Spiral | 26 | Void Lotus | 42 | Liquid Metal |
| 11 | Infinity Knot | 27 | Solar Flare | 43 | Stardust Collision |
| 12 | Deep Ocean Drift | 28 | Fractal Tree | 44 | Ancient Runes |
| 13 | Hourglass Sand | 29 | Final Peace | 45 | Seismic Waves |
| 14 | Mirror Lake | 30 | Crystal Cave | 46 | Aurora Crown |
| 15 | Atom Orbits | 31 | Quantum Entanglement | 47 | Frozen Time |

---

## 🎨 Customization Examples

### Change All Durations to 10 Seconds:

In MP4 Renderer, **Step 4**:
1. Enter `10` in "Set all" field
2. Click "Apply All"
3. Total: 46 scenes × 10s = **7 minutes 40 seconds**

### Create 30-Minute Video:

In MP4 Renderer, **Step 4**:
1. Enter `39` in "Set all" field
2. Click "Apply All"
3. Total: 46 scenes × 39s = **29 minutes 54 seconds**
4. Or click "⟺ 30 min" to auto-distribute

### Use Specific Scenes Only:

1. Edit `config.js` in `allscenes/`
2. Remove unwanted scenes from `SCENES` array
3. Rebuild: `node build.cjs`
4. Upload new `allscenes_built.html`

---

## 🐛 Common Issues

### Issue: Build script fails

```
Error: File not found
```

**Fix**: Make sure you're in the `allscenes/` directory:
```bash
cd allscenes
node build.cjs
```

---

### Issue: MP4 Renderer shows error

```
Error: Could not find SCENES array
```

**Fix**: Rebuild the HTML file:
```bash
cd allscenes
node build.cjs
```

---

### Issue: Scenes not rendering

**Fix**: Check browser console (F12) for JavaScript errors

---

## 📚 More Information

- **Full Documentation**: See `README.md`
- **Upload Solutions**: See `UPLOAD_SOLUTIONS.md`
- **Main Project**: See `docs/` folder

---

## ✅ Ready?

```bash
cd allscenes
node build.cjs
```

Then upload `allscenes_built.html` to MP4 Renderer and start creating! 🎬

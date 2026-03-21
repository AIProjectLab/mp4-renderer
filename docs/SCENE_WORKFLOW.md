# 🔄 allscenes/ Upload Workflow

## Visual Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT PHASE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                  │
│  allscenes/ (Modular Files)                                     │
│  ├── config.js          ← Scene metadata (46 scenes)            │
│  ├── engine.js          ← Core animation engine                  │
│  ├── renderers.js       ← Scenes 0-5                             │
│  ├── renderers2.js      ← Scenes 6-29                            │
│  ├── renderers3.js      ← Scenes 30-39                           │
│  ├── renderers4.js      ← Scenes 40-46                           │
│  ├── renderers5.js      ← Scenes 47+                              │
│  ├── app.js             ← App initialization                      │
│  ├── styles.css         ← Styling                                │
│  └── template.html      ← HTML template                          │
│                                                                  │
│                          ↓                                       │
│                  [build.cjs]                                    │
│                  (Build Script)                                   │
│                          ↓                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    BUILD PHASE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                  │
│  allscenes_built.html (Single Combined File)                       │
│  ├── DOCTYPE + HTML Structure                                     │
│  ├── Embedded CSS (styles.css)                                    │
│  ├── Combined JavaScript:                                           │
│  │   ├── SCENES array (46 objects)                              │
│  │   ├── RENDERERS array (46+ functions)                           │
│  │   ├── Engine functions (canvas init, playback)                    │
│  │   └── App initialization (master loop)                           │
│  └── </script>                                                  │
│                                                                  │
│  Size: ~122 KB                                                   │
│  Format: MP4 Renderer compatible                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    UPLOAD PHASE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MP4 Renderer (index.html)                                        │
│  ┌────────────────────────────────────────────────────────────┐       │
│  │ Step 1: Scene File                               │       │
│  │ ┌────────────────────────────────────────────────────┐ │       │
│  │ │ Drag & Drop allscenes_built.html here     │ │       │
│  │ └────────────────────────────────────────────────────┘ │       │
│  │                                                       │       │
│  │ ✓ 46 scenes loaded                                 │       │
│  └────────────────────────────────────────────────────────────┘       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐       │
│  │ Step 4: Scene Durations                        │       │
│  │ Set all: [30] sec  Apply All  ⟺ 30 min        │       │
│  │                                                       │       │
│  │ Scene 1: Crumbling Stone    30s                    │       │
│  │ Scene 2: Dual Orbs         30s                    │       │
│  │ Scene 3: Ripple Pond        30s                    │       │
│  │ ... (46 scenes total)                               │       │
│  │                                                       │       │
│  │ Total: 23:00 (46 × 30s)                         │       │
│  └────────────────────────────────────────────────────────────┘       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐       │
│  │ Step 2: Audio (Optional)                      │       │
│  │ Upload MP3/WAV background music                         │       │
│  └────────────────────────────────────────────────────────────┘       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐       │
│  │ Step 5: Subtitles (Optional)                   │       │
│  │ AI Transcription or SRT/VTT upload                     │       │
│  └────────────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    RENDER PHASE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                  │
│  WebCodecs + mp4-muxer                                        │
│  ┌────────────────────────────────────────────────────────────┐       │
│  │ Rendering Progress:                                │       │
│  │ Scene 1/46: Crumbling Stone  ████████████ 100%     │       │
│  │ Scene 2/46: Dual Orbs       ████████████ 100%     │       │
│  │ Scene 3/46: Ripple Pond      ████████████ 100%     │       │
│  │ ...                                                   │       │
│  │ Scene 46/46: Frozen Time    ████████████ 100%    │       │
│  │                                                       │       │
│  │ Overall: ████████████████████████████████ 100%     │       │
│  │                                                       │       │
│  │ Status: Complete!                                    │       │
│  └────────────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                    OUTPUT PHASE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                  │
│  allscenes_video.mp4                                            │
│  ├── Format: H.264 MP4                                          │
│  ├── Resolution: 1920×1080 (1080p)                             │
│  ├── Duration: 23:00 (configurable)                              │
│  ├── FPS: 30 (configurable)                                       │
│  └── Bitrate: 12 Mbps (configurable)                             │
│                                                                  │
│  Ready for YouTube! ✓                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Process

### Phase 1: Development (Edit Scenes)

```
1. Open allscenes/renderers*.js
2. Modify scene renderer functions
3. Update allscenes/config.js (if needed)
4. Test locally: open allscenes/template.html in browser
```

**Tools**: Any text editor (VS Code, Sublime, etc.)

### Phase 2: Build (Combine Files)

```
cd allscenes
node build.cjs
```

**Output**: `allscenes_built.html` (122 KB)

**What happens**:
- Reads all 10 source files
- Combines in correct order
- Validates structure
- Creates single HTML file

### Phase 3: Upload (Load into MP4 Renderer)

```
1. Open index.html (MP4 Renderer)
2. Drag allscenes_built.html to Step 1
3. Verify: "✓ 46 scenes loaded"
```

**What happens**:
- MP4 Renderer loads HTML in hidden iframe
- Extracts SCENES array (46 objects)
- Extracts RENDERERS array (46+ functions)
- Displays scene list in Step 4

### Phase 4: Configure (Set Durations)

```
1. Set duration per scene (default: 30s)
2. Or use "Set all" to change all at once
3. Or use "⟺ 30 min" to auto-distribute
```

**Examples**:
- 10s each = 7:40 total
- 30s each = 23:00 total
- 60s each = 46:00 total

### Phase 5: Render (Create Video)

```
1. (Optional) Upload background audio
2. (Optional) Add subtitles
3. (Optional) Adjust video settings
4. Click "🚀 Start Render"
```

**What happens**:
- WebCodecs captures each frame
- mp4-muxer combines video + audio
- Progress updates in real-time
- Auto-downloads when complete

### Phase 6: Output (Download Video)

```
File: allscenes_video.mp4
Format: H.264 MP4
Ready for YouTube! ✓
```

---

## File Transformations

### Input (Modular)

```
allscenes/
├── config.js         (2.5 KB)  ← Scene metadata
├── engine.js         (5.4 KB)  ← Core engine
├── renderers.js      (12.3 KB) ← Scenes 0-5
├── renderers2.js     (20.1 KB) ← Scenes 6-29
├── renderers3.js     (24.3 KB) ← Scenes 30-39
├── renderers4.js     (21.1 KB) ← Scenes 40-46
├── renderers5.js     (28.1 KB) ← Scenes 47+
├── app.js            (0.8 KB)  ← Init
├── styles.css        (4.8 KB)  ← Styling
└── template.html     (1.5 KB)  ← Template

Total: ~121 KB (10 files)
```

### Output (Combined)

```
allscenes_built.html (122 KB)
├── HTML Structure (~1 KB)
├── Embedded CSS (~5 KB)
└── Combined JavaScript (~116 KB)
    ├── SCENES array
    ├── RENDERERS array
    ├── Engine functions
    └── App initialization
```

### Final Video

```
allscenes_video.mp4 (varies by settings)
├── 1080p @ 30fps @ 12Mbps ≈ 500 MB (23 min video)
├── 1080p @ 60fps @ 12Mbps ≈ 1 GB (23 min video)
└── 4K @ 30fps @ 20Mbps ≈ 3 GB (23 min video)
```

---

## Data Flow Diagram

```
config.js (SCENES array)
    ↓
    {name, dur, color} objects
    ↓
engine.js (initializeCanvases)
    ↓
    ctxs[] (canvas contexts)
    ↓
renderers*.js (RENDERERS array)
    ↓
    (gt, st, tot) => void functions
    ↓
app.js (masterLoop)
    ↓
    requestAnimationFrame
    ↓
MP4 Renderer (capture frames)
    ↓
    WebCodecs (H.264 encoding)
    ↓
    mp4-muxer (combine streams)
    ↓
    allscenes_video.mp4
```

---

## Quick Reference Commands

### Build
```bash
cd allscenes
node build.cjs
```

### Rebuild (after changes)
```bash
cd allscenes
node build.cjs
```

### Test locally
```bash
# Open in browser
start allscenes/template.html
# Or
open allscenes/template.html
```

### Upload
```bash
# Drag allscenes_built.html to MP4 Renderer
# Or use file picker
```

---

## Troubleshooting Flow

```
Build fails?
    ↓
Check: Are you in allscenes/ directory?
Check: Do all files exist?
Check: Is Node.js installed?
    ↓
Yes → Re-run: node build.cjs
    ↓
No → Fix issue, then re-run

Upload fails?
    ↓
Check: Did build complete successfully?
Check: Is allscenes_built.html created?
Check: File size (~122 KB)?
    ↓
Yes → Rebuild: node build.cjs
    ↓
No → Check build script errors

Render fails?
    ↓
Check: Browser console (F12)
Check: Scene durations set?
Check: Enough disk space?
    ↓
Yes → Fix specific error
    ↓
No → Try shorter video first
```

---

## Success Criteria

✅ **Build**: `allscenes_built.html` created without errors
✅ **Upload**: MP4 Renderer loads 46 scenes successfully
✅ **Configure**: Can set scene durations
✅ **Render**: All scenes render frame-by-frame
✅ **Output**: MP4 file downloads successfully
✅ **Quality**: Video plays correctly in media player

---

## Next Steps

1. **Test**: Upload `allscenes_built.html` to MP4 Renderer
2. **Render**: Create a test video (e.g., 10s per scene)
3. **Verify**: Check all 46 scenes render correctly
4. **Customize**: Try different durations, settings
5. **Share**: Upload video to YouTube or other platforms

---

**Need Help?** Check documentation files in `allscenes/` folder.

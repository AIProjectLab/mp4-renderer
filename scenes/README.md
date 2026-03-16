# Scene Files

This folder contains all HTML scene animation files for the MP4 Renderer.

## Available Scenes

### 1. **stoicism_30scenes.html**
- **Description:** 30 Stoic lessons with cinematic scenes
- **Scenes:** 30 unique scenes
- **Duration:** Configurable (default ~30 minutes)
- **Format:** Advanced (SCENES objects + RENDERERS array)
- **Status:** ✅ Production ready

### 2. **stoicism_10visuals.html**
- **Description:** 10 visual stoic lessons
- **Scenes:** 10 scenes
- **Duration:** Configurable
- **Format:** Advanced (SCENES objects + RENDERERS array)
- **Status:** ✅ Production ready

### 3. **stoicism_cinematic15.html**
- **Description:** 15 cinematic stoic scenes
- **Scenes:** 15 scenes
- **Duration:** Configurable
- **Format:** Advanced (SCENES objects + RENDERERS array)
- **Status:** ✅ Production ready

### 4. **finalgrok.html**
- **Description:** Final comprehensive stoicism video (65 minutes)
- **Scenes:** 21 scenes (11 lessons + 10 ambient)
- **Duration:** ~65 minutes total
- **Format:** Advanced (SCENES objects + R array)
- **Status:** ✅ Production ready
- **Note:** Large file, requires direct-to-disk streaming

### 5. **finalgrok2.html**
- **Description:** Alternative version of finalgrok
- **Scenes:** 21 scenes
- **Duration:** ~65 minutes
- **Format:** Advanced (SCENES objects + RENDERERS array)
- **Status:** ✅ Production ready

### 6. **stoicsmGrok.html**
- **Description:** Stoicism with Groq integration
- **Scenes:** Multiple scenes
- **Duration:** Configurable
- **Format:** Advanced
- **Status:** ✅ Production ready

### 7. **grok2.html**
- **Description:** Alternative Groq-integrated scene
- **Scenes:** Multiple scenes
- **Duration:** Configurable
- **Format:** Advanced
- **Status:** ✅ Production ready

---

## How to Use

### Step 1: Upload Scene File
1. Open the MP4 Renderer app
2. Go to **Step 1: Scene File**
3. Click "Drop HTML or click to browse"
4. Select any `.html` file from this folder

### Step 2: Configure Scene Durations
1. After upload, scenes appear in **Step 4: Scene Durations**
2. Adjust duration for each scene using sliders or input fields
3. Click "⟺ 30 min" to distribute evenly based on audio duration
4. Or set all scenes to same duration with "APPLY ALL"

### Step 3: Add Audio & Subtitles
1. Upload audio file (Step 2)
2. Transcribe with Groq or upload SRT (Step 5)
3. Adjust subtitle style and size

### Step 4: Render
1. Select resolution (1080p, 1440p, 4K, vertical, etc.)
2. Set FPS and bitrate
3. Click "🚀 Start Render"
4. Choose save location
5. Wait for render to complete

---

## Scene Format

All scenes use the **Advanced Format**:

```javascript
const SCENES = [
  { name: "Scene Name", sub: "Subtitle", dur: 150, color: "#e8b86d" },
  { name: "Another Scene", sub: "Description", dur: 120 },
  // ... more scenes
];

const RENDERERS = [
  (gt, st, tot) => { /* render frame */ },
  (gt, st, tot) => { /* render frame */ },
  // ... one renderer per scene
];
```

**Parameters:**
- `gt` — Global time (frame counter)
- `st` — Scene time (frames in current scene)
- `tot` — Total frames in scene
- `name` — Scene display name
- `sub` — Scene subtitle/description
- `dur` — Default duration in seconds
- `color` — Optional color for UI

---

## Rendering Tips

### For Long Videos (60+ minutes)
- Use **Direct-to-Disk Streaming** (automatic)
- Choose save location when prompted
- Render will stream to disk without RAM issues

### For Vertical/Shorts Videos
- Select "1080×1920 — 1080p Vertical (Shorts)" from resolution dropdown
- Subtitles automatically clamp to visible bounds
- Perfect for YouTube Shorts

### For Best Quality
- Use 1080p or higher resolution
- Set bitrate to 12-16 Mbps
- Use 30 FPS for smooth playback

### For Faster Rendering
- Use 720p resolution
- Set bitrate to 6-8 Mbps
- Use 24 FPS

---

## Troubleshooting

### Scene doesn't load
- Check browser console for errors
- Ensure HTML has `SCENES` array and `RENDERERS` array
- Verify scene format matches Advanced Format

### Video renders but looks wrong
- Check scene durations match audio length
- Verify resolution matches content aspect ratio
- Try different subtitle style if text overlaps

### Render crashes
- For long videos, use Direct-to-Disk Streaming (automatic)
- Reduce resolution or bitrate
- Close other applications to free RAM

### Subtitles missing
- Ensure audio is uploaded before transcribing
- Check subtitle Y-position is within bounds
- Try different subtitle style

---

## Creating Custom Scenes

To create your own scene file:

1. Create HTML with canvas elements
2. Define `SCENES` array with scene metadata
3. Define `RENDERERS` array with drawing functions
4. Export both as globals
5. Place in this folder
6. Upload to MP4 Renderer

Example:
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
      { name: "My Scene", sub: "Description", dur: 120 }
    ];
    
    const RENDERERS = [
      (gt, st, tot) => {
        const canvas = document.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 1920, 1080);
        // Draw your animation here
      }
    ];
  </script>
</body>
</html>
```

---

## File Organization

```
scenes/
├── README.md                      (This file)
├── stoicism_30scenes.html         (30 scenes)
├── stoicism_10visuals.html        (10 scenes)
├── stoicism_cinematic15.html      (15 scenes)
├── finalgrok.html                 (21 scenes, 65 min)
├── finalgrok2.html                (21 scenes, 65 min)
├── stoicsmGrok.html               (Groq integrated)
└── grok2.html                     (Groq integrated)
```

---

## Status

All scene files are **production-ready** ✅

Last updated: March 16, 2026

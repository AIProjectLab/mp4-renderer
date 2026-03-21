# 🎬 HOW TO RENDER - Quick Guide

## ⚡ 3 Simple Steps

### 1️⃣ Build the HTML File

```bash
cd allscenes
node build.cjs
```

**Result**: Creates `allscenes_built.html` (122 KB)

---

### 2️⃣ Upload to MP4 Renderer

1. Open `index.html` (MP4 Renderer)
2. Drag `allscenes_built.html` into **Step 1: Scene File**
3. You'll see: `✓ 46 scenes loaded`

---

### 3️⃣ Render Video

1. **Step 4: Scene Durations**
   - Enter duration (e.g., `30` seconds)
   - Click **"Apply All"**
   - Total time shown (e.g., `23:00` for 30s each)

2. **Optional: Add Audio** (Step 2)
   - Drag MP3/WAV file
   - Adjust speed if needed

3. **Optional: Add Subtitles** (Step 5)
   - Click **"⚡ Transcribe with Whisper"** (auto)
   - Or upload SRT/VTT file

4. **Click "🚀 Start Render"**

5. **Wait for completion**
   - Progress bar updates
   - Video auto-downloads when done

---

## 🎯 Quick Examples

### Example 1: 10-Second Video (7:40 total)

```
Step 4: Enter "10" → Click "Apply All"
Total: 7:40
Click "🚀 Start Render"
```

### Example 2: 30-Second Video (23:00 total)

```
Step 4: Enter "30" → Click "Apply All"
Total: 23:00
Click "🚀 Start Render"
```

### Example 3: 1-Hour Video

```
Step 4: Click "⟺ 30 min"
Total: 30:00
Click "🚀 Start Render"
```

---

## 📊 What You Get

| Setting | Result |
|---------|---------|
| 46 scenes × 10s | 7:40 video |
| 46 scenes × 30s | 23:00 video |
| 46 scenes × 60s | 46:00 video |
| 46 scenes × 78s | 59:48 video (~1 hour) |

**Output**: `allscenes_video.mp4` (H.264, 1080p)

---

## 🔄 Rebuild After Changes

```bash
cd allscenes
node build.cjs
```

Then upload new `allscenes_built.html` to MP4 Renderer.

---

## ✅ That's It!

**Build → Upload → Configure → Render → Download**

**Ready?** Run `node build.cjs` and start rendering! 🚀

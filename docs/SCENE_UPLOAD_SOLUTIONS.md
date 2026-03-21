# Uploading allscenes/ to MP4 Renderer - Solutions

## 📊 Current System Analysis

### How Current System Works:
1. **Single HTML Upload**: Uploads one `.html` file (e.g., `stoicism_30scenes.html`)
2. **Iframe Execution**: Loads HTML in hidden iframe
3. **RAF Hijacking**: Intercepts `requestAnimationFrame` to manually control frames
4. **Exports Extracted**: Extracts `SCENES` array and `RENDERERS` array from iframe
5. **Frame-by-Frame Rendering**: Uses WebCodecs to render each scene frame-by-frame
6. **MP4 Output**: Creates H.264 MP4 video

### Supported Formats:
- **Classic Format**: `SCENES = [fn0, fn1, fn2...]` (array of functions)
- **Advanced Format**: `SCENES = [{name, dur, color}, ...]` + `RENDERERS = [fn0, fn1, ...]`

---

## 🆕 New allscenes/ System Structure

```
allscenes/
├── config.js       # SCENES array (46 scenes with metadata)
├── engine.js       # Core engine, canvas init, playback controls
├── renderers.js    # RENDERERS[0-5]
├── renderers2.js   # RENDERERS[6-29]
├── renderers3.js   # RENDERERS[30-39]
├── renderers4.js   # RENDERERS[40-46]
├── renderers5.js   # Additional renderers
├── app.js          # App initialization
├── styles.css      # Styling
└── template.html   # HTML template (loads all scripts)
```

### Key Differences:
- **Modular Structure**: Separated into multiple JS files
- **Standalone App**: Works as a complete web application
- **Advanced Format**: Uses `SCENES` objects + `RENDERERS` functions
- **46+ Scenes**: More scenes than typical uploads

---

## 💡 Solution Ideas

### ✅ Solution 1: Build Single HTML Bundle (RECOMMENDED)

**Approach**: Create a build script that combines all allscenes/ files into one HTML file compatible with current system.

**Implementation**:
```javascript
// build.js - Node.js build script
const fs = require('fs');
const path = require('path');

function buildAllScenes() {
  const template = fs.readFileSync('allscenes/template.html', 'utf8');
  const config = fs.readFileSync('allscenes/config.js', 'utf8');
  const engine = fs.readFileSync('allscenes/engine.js', 'utf8');
  const renderers1 = fs.readFileSync('allscenes/renderers.js', 'utf8');
  const renderers2 = fs.readFileSync('allscenes/renderers2.js', 'utf8');
  const renderers3 = fs.readFileSync('allscenes/renderers3.js', 'utf8');
  const renderers4 = fs.readFileSync('allscenes/renderers4.js', 'utf8');
  const renderers5 = fs.readFileSync('allscenes/renderers5.js', 'utf8');
  const app = fs.readFileSync('allscenes/app.js', 'utf8');
  const styles = fs.readFileSync('allscenes/styles.css', 'utf8');

  // Combine into single HTML
  const combinedHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Stoicism Visual Engine — All 46 Scenes</title>
    <style>${styles}</style>
</head>
<body>
    <div id="stage">
        <div id="wrapper"></div>
    </div>

    <!-- Combined JavaScript -->
    <script>
${config}
${engine}
${renderers1}
${renderers2}
${renderers3}
${renderers4}
${renderers5}
${app}
    </script>
</body>
</html>`;

  fs.writeFileSync('allscenes_built.html', combinedHTML);
  console.log('✅ Built allscenes_built.html');
}

buildAllScenes();
```

**Usage**:
```bash
cd allscenes
node build.js
# Upload allscenes_built.html to MP4 Renderer
```

**Pros**:
- ✅ Works with current system without changes
- ✅ Simple for users (single file upload)
- ✅ No modification to MP4 Renderer needed
- ✅ Preserves all scene functionality

**Cons**:
- ❌ Large file size (~200KB+)
- ❌ Need to rebuild when scenes change

---

### ✅ Solution 2: Folder Upload with Directory API

**Approach**: Modify MP4 Renderer to accept folder uploads and combine files dynamically.

**Implementation**:
```javascript
// Add to index.html - Step 1
<div class="drop-zone" id="folderDrop">
    <input type="file" id="folderFile" webkitdirectory directory>
    <div class="dz-icon">📁</div>
    <div class="dz-label">Drop allscenes/ folder or click to browse</div>
    <div class="dz-hint">Select folder containing config.js, engine.js, renderers*.js</div>
</div>

// Add to app.js
document.getElementById('folderFile').addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    const fileMap = new Map();
    
    // Organize files
    files.forEach(file => {
        const name = file.name;
        fileMap.set(name, file);
    });
    
    // Read files in correct order
    const config = await fileMap.get('config.js')?.text();
    const engine = await fileMap.get('engine.js')?.text();
    const renderers = await Promise.all([
        fileMap.get('renderers.js')?.text(),
        fileMap.get('renderers2.js')?.text(),
        fileMap.get('renderers3.js')?.text(),
        fileMap.get('renderers4.js')?.text(),
        fileMap.get('renderers5.js')?.text(),
    ].filter(Boolean));
    
    const app = await fileMap.get('app.js')?.text();
    const styles = await fileMap.get('styles.css')?.text();
    
    // Combine and load
    const combinedJS = config + '\n' + engine + '\n' + renderers.join('\n') + '\n' + app;
    
    // Create iframe with combined content
    const iframe = document.getElementById('renderIframe');
    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>${styles}</style>
</head>
<body>
    <div id="stage"><div id="wrapper"></div></div>
    <script>${combinedJS}</script>
</body>
</html>`;
    
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
});
```

**Pros**:
- ✅ No build step needed
- ✅ Easy to update individual files
- ✅ Maintains modular structure
- ✅ Users can edit scenes directly

**Cons**:
- ❌ Requires modifying MP4 Renderer
- ❌ More complex implementation
- ❌ Browser compatibility (webkitdirectory)

---

### ✅ Solution 3: ZIP Upload with Extraction

**Approach**: Upload ZIP file containing allscenes/, extract and combine in browser.

**Implementation**:
```javascript
// Add to index.html
<div class="drop-zone" id="zipDrop">
    <input type="file" id="zipFile" accept=".zip">
    <div class="dz-icon">📦</div>
    <div class="dz-label">Drop allscenes.zip or click to browse</div>
    <div class="dz-hint">ZIP containing all allscenes/ files</div>
</div>

// Add to app.js
document.getElementById('zipFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Use JSZip library
    const JSZip = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
    const zip = await JSZip.loadAsync(file);
    
    // Read files
    const files = {};
    const fileOrder = [
        'config.js', 'engine.js', 
        'renderers.js', 'renderers2.js', 'renderers3.js', 
        'renderers4.js', 'renderers5.js',
        'app.js', 'styles.css'
    ];
    
    for (const name of fileOrder) {
        const content = await zip.file(`allscenes/${name}`)?.async('string');
        if (content) files[name] = content;
    }
    
    // Combine and load
    const combinedHTML = `
<!DOCTYPE html>
<html>
<head>
    <style>${files['styles.css']}</style>
</head>
<body>
    <div id="stage"><div id="wrapper"></div></div>
    <script>${files['config.js']}
${files['engine.js']}
${files['renderers.js']}
${files['renderers2.js']}
${files['renderers3.js']}
${files['renderers4.js']}
${files['renderers5.js']}
${files['app.js']}</script>
</body>
</html>`;
    
    // Load in iframe
    const iframe = document.getElementById('renderIframe');
    iframe.contentDocument.open();
    iframe.contentDocument.write(combinedHTML);
    iframe.contentDocument.close();
});
```

**Pros**:
- ✅ Single file upload
- ✅ Preserves folder structure
- ✅ Cross-platform compatible
- ✅ Easy to share

**Cons**:
- ❌ Requires JSZip library
- ❌ Need to modify MP4 Renderer
- ❌ Larger file size than Solution 1

---

### ✅ Solution 4: Drag-and-Drop Multiple Files

**Approach**: Allow dragging multiple JS files and auto-combine them.

**Implementation**:
```javascript
// Modify existing drop zone to accept multiple files
const htmlDrop = document.getElementById('htmlDrop');
htmlDrop.querySelector('input').setAttribute('multiple', '');

htmlDrop.addEventListener('drop', async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    
    // Check if multiple JS files (allscenes style)
    const jsFiles = files.filter(f => f.name.endsWith('.js'));
    
    if (jsFiles.length > 1) {
        // Treat as allscenes upload
        await loadAllScenesFiles(jsFiles);
    } else if (jsFiles.length === 1 && jsFiles[0].name.endsWith('.html')) {
        // Treat as single HTML upload (existing behavior)
        await loadSingleHTML(jsFiles[0]);
    }
});

async function loadAllScenesFiles(files) {
    const fileMap = new Map(files.map(f => [f.name, f]));
    
    const fileOrder = [
        'config.js', 'engine.js',
        'renderers.js', 'renderers2.js', 'renderers3.js',
        'renderers4.js', 'renderers5.js',
        'app.js', 'styles.css'
    ];
    
    let combinedJS = '';
    let styles = '';
    
    for (const name of fileOrder) {
        const file = fileMap.get(name);
        if (file) {
            const content = await file.text();
            if (name.endsWith('.css')) {
                styles = content;
            } else {
                combinedJS += content + '\n';
            }
        }
    }
    
    // Load in iframe
    const iframe = document.getElementById('renderIframe');
    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>${styles}</style>
</head>
<body>
    <div id="stage"><div id="wrapper"></div></div>
    <script>${combinedJS}</script>
</body>
</html>`;
    
    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
}
```

**Pros**:
- ✅ Intuitive drag-and-drop
- ✅ No build step
- ✅ Works with existing UI
- ✅ Minimal code changes

**Cons**:
- ❌ Users must select correct files in order
- ❌ Error-prone if files missing

---

### ✅ Solution 5: Pre-built HTML in Repository

**Approach**: Include pre-built HTML file in repository for immediate use.

**Implementation**:
```bash
# Create pre-built file
cd allscenes
node build.js
# Creates: allscenes_built.html

# Add to .gitignore
echo "allscenes_built.html" >> .gitignore

# Or commit it for easy access
git add allscenes_built.html
git commit -m "Add pre-built allscenes HTML"
```

**Usage**:
1. Run `node allscenes/build.js` to generate
2. Upload `allscenes/allscenes_built.html` to MP4 Renderer

**Pros**:
- ✅ Simplest for users
- ✅ No code changes needed
- ✅ Works immediately

**Cons**:
- ❌ Must rebuild when scenes change
- ❌ Large file in repository

---

## 🎯 Recommended Implementation

### Phase 1: Quick Win (Immediate)
**Use Solution 1** - Build script to create single HTML file.

**Steps**:
1. Create `allscenes/build.js` (see code above)
2. Run `node allscenes/build.js` to generate `allscenes_built.html`
3. Upload `allscenes_built.html` to MP4 Renderer

### Phase 2: Enhanced UX (Future)
**Use Solution 2 or 4** - Add folder/multiple file upload to MP4 Renderer.

**Steps**:
1. Modify `index.html` to add folder upload option
2. Update `app.js` to handle multiple files
3. Auto-detect and combine allscenes/ structure

### Phase 3: Advanced Features
**Use Solution 3** - ZIP upload for easy sharing.

**Steps**:
1. Add JSZip library to project
2. Implement ZIP extraction logic
3. Create "Export to ZIP" feature

---

## 📝 Summary Comparison

| Solution | Effort | User Experience | Maintenance | Compatibility |
|----------|---------|----------------|--------------|----------------|
| 1. Build Script | ⭐ Low | ⭐⭐⭐ Good | ⭐⭐ Medium | ✅ 100% |
| 2. Folder Upload | ⭐⭐⭐ High | ⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Low | ⚠️ 90% |
| 3. ZIP Upload | ⭐⭐⭐ High | ⭐⭐⭐⭐ Excellent | ⭐⭐ Medium | ✅ 100% |
| 4. Multi-File Drop | ⭐⭐ Medium | ⭐⭐⭐ Good | ⭐⭐ Medium | ✅ 100% |
| 5. Pre-built HTML | ⭐ Low | ⭐⭐⭐⭐ Excellent | ⭐ Low | ✅ 100% |

---

## 🚀 Next Steps

1. **Implement Solution 1** (Build Script) - Can be done in 5 minutes
2. **Test with MP4 Renderer** - Verify all 46 scenes render correctly
3. **Document process** - Add README with upload instructions
4. **Consider Phase 2** - Add folder upload for better UX

---

## 📞 Questions?

Which solution would you like me to implement first?

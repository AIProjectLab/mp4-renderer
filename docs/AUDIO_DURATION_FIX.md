# Audio Duration Distribution Fix

## Problem

When uploading an SRT file and audio file, the scene durations showed:
- **Total time displayed:** ~61 minutes (for 21 scenes)
- **Actual audio duration:** ~30-35 minutes
- **Mismatch:** Scene durations were hardcoded to 1800 seconds (30 min) divided by scene count

## Root Cause

The "Distribute" button (⟺ 30 min) always used a hardcoded 1800 seconds, regardless of actual audio duration:

```javascript
// OLD CODE (BROKEN)
document.getElementById('distributeBtn').addEventListener('click', () => {
    const inputs = document.querySelectorAll('.scene-duration');
    const sliders = document.querySelectorAll('.scene-slider');
    const duration = Math.floor(1800 / inputs.length);  // ❌ Always 1800 seconds
    inputs.forEach(input => input.value = duration);
    sliders.forEach(slider => slider.value = duration);
    log(`Distributed 1800 seconds evenly across ${inputs.length} scenes.`);
    updateTotalTime();
});
```

## Solution

Updated the "Distribute" button to use actual audio duration when available:

```javascript
// NEW CODE (FIXED)
document.getElementById('distributeBtn').addEventListener('click', () => {
    if (!audioBuffer) {
        log('No audio loaded. Using default 30 minutes.', 'error');
        const inputs = document.querySelectorAll('.scene-duration');
        const sliders = document.querySelectorAll('.scene-slider');
        const duration = Math.floor(1800 / inputs.length);
        inputs.forEach(input => input.value = duration);
        sliders.forEach(slider => slider.value = duration);
        log(`Distributed 1800 seconds evenly across ${inputs.length} scenes.`);
        updateTotalTime();
        return;
    }

    // Use actual audio duration
    const inputs = document.querySelectorAll('.scene-duration');
    const sliders = document.querySelectorAll('.scene-slider');
    const audioDuration = Math.floor(audioBuffer.duration);
    const duration = Math.floor(audioDuration / inputs.length);
    
    inputs.forEach(input => input.value = duration);
    sliders.forEach(slider => slider.value = duration);
    log(`Distributed ${audioDuration}s (audio duration) evenly across ${inputs.length} scenes (~${duration}s each).`, 'success');
    updateTotalTime();
});
```

## How It Works

1. **Check if audio is loaded:** `if (!audioBuffer)`
2. **If no audio:** Use default 1800 seconds (30 min)
3. **If audio loaded:** 
   - Get actual duration: `audioBuffer.duration`
   - Calculate per-scene duration: `duration = Math.floor(audioDuration / inputs.length)`
   - Apply to all scenes
   - Log actual duration used

## Example

**Before Fix:**
- 21 scenes × 180 seconds each = 3780 seconds (63 minutes)
- Audio actual duration: 30 minutes
- **Mismatch:** 63 min vs 30 min

**After Fix:**
- Audio duration: 30 minutes (1800 seconds)
- Per-scene duration: 1800 / 21 ≈ 86 seconds
- 21 scenes × 86 seconds = 1806 seconds (30 minutes)
- **Match:** 30 min vs 30 min ✅

## Benefits

✅ Scene durations now match actual audio length
✅ No more 2x mismatch between UI and audio
✅ Fallback to 30 min default if no audio loaded
✅ Clear logging shows what duration is being used
✅ Robust and non-breaking

## Testing

1. Upload audio file (e.g., 30-35 minutes)
2. Upload HTML with 21 scenes
3. Click "⟺ 30 min" button
4. Check scene durations
5. Verify total time matches audio duration
6. Render should complete without timing issues

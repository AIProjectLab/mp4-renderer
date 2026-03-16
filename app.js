// ── Application State ────────────────────────────────────────────
        const logEl = document.getElementById('log');
        let loadedScenes = [];
        let audioBuffer = null;
        let isRendering = false;
        let cancelRender = false;
        let sceneFormat = 'old';   // 'old' = classic RAF, 'new' = RENDERERS[]
        let drawFunctions = null;  // holds RENDERERS[] or R[] for new format

        // ── Logger ──────────────────────────────────────────────────
        function log(msg, type = 'normal') {
            console.log(msg);
            const span = document.createElement('span');
            span.textContent = `[${new Date().toLocaleTimeString()}] ${msg}\n`;
            if (type === 'success') span.className = 'log-success';
            if (type === 'error')   span.className = 'log-error';
            if (type === 'highlight') span.className = 'log-highlight';
            logEl.appendChild(span);
            logEl.scrollTop = logEl.scrollHeight;
        }

        // ── Step status badge helper ─────────────────────────────────
        function setStatus(id, text, cls) {
            const el = document.getElementById(id);
            if (!el) return;
            el.textContent = text;
            el.className = 'step-status' + (cls ? ' ' + cls : '');
        }

        // ── Drop zone wiring ─────────────────────────────────────────
        function wireDropZone(zoneId) {
            const zone = document.getElementById(zoneId);
            if (!zone) return;
            zone.addEventListener('dragover',  (e) => { e.preventDefault(); zone.classList.add('drag-over'); });
            zone.addEventListener('dragleave', ()  => zone.classList.remove('drag-over'));
            zone.addEventListener('drop',      (e) => { e.preventDefault(); zone.classList.remove('drag-over'); });
        }
        wireDropZone('htmlDrop');
        wireDropZone('audioDrop');
        wireDropZone('subDrop');

        function markDropZoneLoaded(zoneId, loadedId, label) {
            const zone = document.getElementById(zoneId);
            const loaded = document.getElementById(loadedId);
            if (zone)   zone.classList.add('loaded');
            if (loaded) loaded.textContent = '\u2713 ' + label;
        }

        // ── Toast helper (for Groq transcription progress) ─────────────
        function showToast(type, icon, msg, elapsed) {
            const toast   = document.getElementById('aiProgress');
            const iconEl  = document.getElementById('toastIcon');
            const msgEl   = document.getElementById('toastMsg');
            const elapsed_ = document.getElementById('toastElapsed');
            toast.className = 'toast show ' + type;
            iconEl.className = 'toast-icon' + (type === 'working' ? ' spin' : '');
            iconEl.textContent = icon;
            msgEl.textContent  = msg;
            if (elapsed_) elapsed_.textContent = elapsed || '';
        }

        // ── File Handlers ────────────────────────────────────────────
        document.getElementById('htmlFile').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            log(`Loading HTML file: ${file.name}`, 'highlight');
            setStatus('s1status', 'Loading…', 'warn');
            let text = await file.text();
            
            // Inject RAF hijacker to manually drive frames, and export SCENES
            const hijacker = '<script>\n' +
                'window.__drawCallbacks = new Map();\n' +
                'window.__rafId = 0;\n' +
                'window.requestAnimationFrame = function(cb) {\n' +
                '    const id = ++window.__rafId;\n' +
                '    window.__drawCallbacks.set(id, cb);\n' +
                '    return id;\n' +
                '};\n' +
                'window.cancelAnimationFrame = function(id) {\n' +
                '    window.__drawCallbacks.delete(id);\n' +
                '};\n' +
                'const __startTime = Date.now();\n' +
                'window.__mockTime = 0;\n' +
                'window.performance.now = function() { return window.__mockTime; };\n' +
                'Date.now = function() { return __startTime + window.__mockTime; };\n' +
                '</scr' + 'ipt>\n';
            
            const exporter = '\n<script>\n' +
                'if (typeof SCENES    !== "undefined") window.SCENES_EXPORT    = SCENES;\n' +
                'if (typeof RENDERERS !== "undefined") window.RENDERERS_EXPORT = RENDERERS;\n' +
                'if (typeof R !== "undefined" && Array.isArray(R)) window.R_EXPORT = R;\n' +
                '</sc' + 'ript>';
                
            text = hijacker + text + exporter;
            
            // Create a hidden iframe with exact 1080p dimensions
            let iframe = document.getElementById('renderIframe');
            if (!iframe) {
                iframe = document.createElement('iframe');
                iframe.id = 'renderIframe';
                iframe.style.width = '1920px';
                iframe.style.height = '1080px';
                iframe.style.position = 'absolute';
                iframe.style.left = '-9999px';
                iframe.style.top = '-9999px';
                iframe.style.visibility = 'hidden';
                iframe.style.border = 'none';
                document.body.appendChild(iframe);
            }
            
            iframe.onload = () => {
                const iWin = iframe.contentWindow;
                const exportedScenes = iWin.SCENES_EXPORT || iWin.SCENES;

                if (!exportedScenes || !Array.isArray(exportedScenes) || exportedScenes.length === 0) {
                    log(`Error: Could not find a global SCENES array in the uploaded HTML.`, 'error');
                    return;
                }

                // ── Detect scene format ──────────────────────────────────────────────
                if (typeof exportedScenes[0] === 'function') {
                    // CLASSIC FORMAT: SCENES = [fn0, fn1, fn2 …]
                    sceneFormat = 'old';
                    drawFunctions = null;
                    loadedScenes = exportedScenes;
                    log(`✅ Classic format detected — ${loadedScenes.length} scene functions found.`, 'success');

                } else if (typeof exportedScenes[0] === 'object') {
                    // ADVANCED FORMAT: SCENES = [{name,dur,…}] + RENDERERS[] or R[]
                    const renderers =
                        iWin.RENDERERS_EXPORT || iWin.RENDERERS ||
                        iWin.R_EXPORT        || iWin.R;

                    if (!renderers || !Array.isArray(renderers) || renderers.length === 0) {
                        log(`Error: Advanced format detected but no RENDERERS / R array found. Make sure RENDERERS[] or R[] is a global variable.`, 'error');
                        return;
                    }
                    if (renderers.length !== exportedScenes.length) {
                        log(`Warning: SCENES has ${exportedScenes.length} entries but RENDERERS has ${renderers.length}. Proceeding with min count.`, 'error');
                    }

                    sceneFormat   = 'new';
                    drawFunctions = renderers;
                    loadedScenes  = exportedScenes;
                    log(`✅ Advanced format detected — ${loadedScenes.length} scenes (SCENES objects + ${renderers.length} RENDERERS).`, 'success');

                } else {
                    log(`Error: SCENES[0] is neither a function nor an object. Cannot determine format.`, 'error');
                    return;
                }

                renderScenesList();
                document.getElementById('renderBtn').disabled = false;
                document.getElementById('distributeBtn').disabled = false;
                document.getElementById('applyGlobalTimeBtn').disabled = false;
                setStatus('s1status', `\u2713 ${loadedScenes.length} scenes`, 'ok');
                markDropZoneLoaded('htmlDrop', 'htmlLoaded', file.name);
            };

            iframe.contentDocument.open();
            iframe.contentDocument.write(text);
            iframe.contentDocument.close();
        });

        let audioBlob = null; // raw file blob — needed for Groq API upload
        let originalAudioBuffer = null; // Unaltered audio buffer

        async function processAudioSpeed(speed) {
            if (!originalAudioBuffer) return;
            if (speed === 1.0) {
                audioBuffer = originalAudioBuffer;
                setStatus('s2status', `\u2713 ${audioBuffer.duration.toFixed(0)}s`, 'ok');
                log(`Audio speed reset to 1.0x (${audioBuffer.duration.toFixed(2)}s)`, 'success');
                return;
            }
            log(`Adjusting audio speed to ${speed}x...`, 'highlight');
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const newDuration = originalAudioBuffer.duration / speed;
            const offlineCtx = new OfflineAudioContext(
                originalAudioBuffer.numberOfChannels,
                Math.ceil(newDuration * originalAudioBuffer.sampleRate),
                originalAudioBuffer.sampleRate
            );
            const source = offlineCtx.createBufferSource();
            source.buffer = originalAudioBuffer;
            source.playbackRate.value = speed;
            source.connect(offlineCtx.destination);
            source.start(0);
            audioBuffer = await offlineCtx.startRendering();
            setStatus('s2status', `\u2713 ${audioBuffer.duration.toFixed(0)}s (${speed}x)`, 'ok');
            log(`Audio processed to ${speed}x: ${audioBuffer.duration.toFixed(2)}s`, 'success');
            
            // Recalculate subtitle timings
            if (typeof applySubSpeed === 'function') applySubSpeed();
        }

        const audioRange = document.getElementById('audioSpeedRange');
        const audioInput = document.getElementById('audioSpeedInput');
        if (audioRange && audioInput) {
            audioRange.addEventListener('input', (e) => {
                audioInput.value = e.target.value;
            });
            audioRange.addEventListener('change', async (e) => {
                const speed = parseFloat(e.target.value) || 1.0;
                await processAudioSpeed(speed);
            });
            audioInput.addEventListener('change', async (e) => {
                let speed = parseFloat(e.target.value) || 1.0;
                if (speed < 0.5) speed = 0.5;
                if (speed > 2.0) speed = 2.0;
                e.target.value = speed;
                audioRange.value = speed;
                await processAudioSpeed(speed);
            });
        }

        document.getElementById('audioFile').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            log(`Loading Audio file: ${file.name}`, 'highlight');
            audioBlob = file;
            const arrayBuffer = await file.arrayBuffer();
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            try {
                originalAudioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
                audioBuffer = originalAudioBuffer;
                log(`Audio loaded: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.numberOfChannels}ch, ${audioBuffer.sampleRate}Hz`, 'success');
                
                // Re-apply current speed if set
                const speed = parseFloat(audioInput ? audioInput.value : 1.0) || 1.0;
                if (speed !== 1.0) {
                    await processAudioSpeed(speed);
                } else {
                    setStatus('s2status', `\u2713 ${audioBuffer.duration.toFixed(0)}s`, 'ok');
                }
                
                markDropZoneLoaded('audioDrop', 'audioLoaded', file.name);
            } catch (err) {
                log(`Error decoding audio: ${err.message}`, 'error');
                setStatus('s2status', 'Error', '');
            }
        });

        // ═══════════════════════════════════════════════════════════════════
        //  SUBTITLES — Groq Whisper API (whisper-large-v3-turbo, ~216× RT)
        // ═══════════════════════════════════════════════════════════════════
        let parsedSubtitles = [];
        let originalParsedSubtitles = [];

        function applySubSpeed() {
            const speedInput = document.getElementById('audioSpeedInput');
            const speed = parseFloat(speedInput ? speedInput.value : 1.0) || 1.0;
            
            if (originalParsedSubtitles.length === 0) {
                parsedSubtitles = [];
                return;
            }
            
            if (speed === 1.0) {
                parsedSubtitles = JSON.parse(JSON.stringify(originalParsedSubtitles));
                return;
            }

            // Scale times by 1/speed
            parsedSubtitles = originalParsedSubtitles.map(sub => {
                const subClone = { ...sub };
                subClone.start = sub.start / speed;
                subClone.end = sub.end / speed;
                if (subClone.wordList) {
                    subClone.wordList = subClone.wordList.map(w => ({
                        ...w,
                        start: w.start / speed,
                        end: w.end / speed
                    }));
                }
                return subClone;
            });
            log(`Adjusted subtitle timings for ${speed}x speed.`, 'normal');
        }

        // ── Restore saved API key ────────────────────────────────────────────
        (function restoreGroqKey() {
            const saved = localStorage.getItem('groq_api_key');
            if (saved) document.getElementById('groqApiKey').value = saved;
        })();

        document.getElementById('saveKeyBtn').addEventListener('click', () => {
            const key = document.getElementById('groqApiKey').value.trim();
            if (!key) { alert('Please enter your Groq API key first.'); return; }
            localStorage.setItem('groq_api_key', key);
            const btn = document.getElementById('saveKeyBtn');
            btn.textContent = '✓ Saved';
            btn.style.background = '#22873d';
            btn.style.color = '#fff';
            setTimeout(() => { btn.textContent = 'Save'; btn.style.background = ''; btn.style.color = ''; }, 2000);
        });

        const toggleBtn = document.getElementById('toggleGroqSettingsBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                const panel = document.getElementById('groqSettingsPanel');
                if (panel.style.display === 'none') {
                    panel.style.display = 'block';
                    toggleBtn.style.background = 'var(--panel-hover)';
                } else {
                    panel.style.display = 'none';
                    toggleBtn.style.background = 'var(--surface)';
                }
            });
        }

        // ── SRT / VTT file parser (kept for manual upload path) ──────────────
        function parseSubtitles(text) {
            const subs = [];
            const blocks = text.replace(/\r\n/g, '\n').split('\n\n');
            blocks.forEach(block => {
                const lines = block.split('\n').map(l => l.trim()).filter(l => l);
                if (lines.length < 2) return;
                const timeLineIdx = lines.findIndex(l => l.includes('-->'));
                if (timeLineIdx === -1) return;
                const timeLine = lines[timeLineIdx];
                const textLines = lines.slice(timeLineIdx + 1).join('\n').replace(/<[^>]+>/g, '');
                const times = timeLine.split('-->').map(t => t.trim());
                if (times.length === 2) {
                    subs.push({ start: timeToSeconds(times[0]), end: timeToSeconds(times[1]), text: textLines });
                }
            });
            return subs;
        }

        function timeToSeconds(tStr) {
            const parts = tStr.replace(',', '.').split(':');
            if (parts.length === 3) return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
            if (parts.length === 2) return parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
            return 0;
        }

        document.getElementById('subFile').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            log(`Loading Subtitles: ${file.name}`, 'highlight');
            const text = await file.text();
            originalParsedSubtitles = parseSubtitles(text);
            applySubSpeed();
            log(`Loaded ${parsedSubtitles.length} subtitle blocks.`, 'success');
            setStatus('s5status', `\u2713 ${parsedSubtitles.length} blocks`, 'ok');
            markDropZoneLoaded('subDrop', 'subLoaded', file.name);
        });

        // ── Convert Groq word array → subtitle chunks ─────────────────────────
        // Groups words into captions of ≤5 words, splitting at punctuation / pauses
        function groqWordsToSubtitles(words) {
            if (!words || words.length === 0) return [];
            const subs = [];
            let group = [];

            words.forEach((w, i) => {
                group.push(w);
                const wordText  = (w.word || '').trim();
                const nextWord  = words[i + 1];
                const gap       = nextWord ? (nextWord.start - w.end) : 99;
                const isSentEnd = /[.!?]$/.test(wordText);
                const isClause  = /[,;:]$/.test(wordText);
                const tooLong   = group.length >= 5;
                const longPause = gap > 0.5;

                if (tooLong || isSentEnd || (isClause && group.length >= 3) || longPause) {
                    subs.push({
                        start:    group[0].start,
                        end:      group[group.length - 1].end,
                        text:     group.map(g => (g.word || '').trim()).join(' ').replace(/\s+([,.!?;:])/g, '$1'),
                        wordList: group.map(g => ({ text: (g.word || '').trim(), start: g.start, end: g.end })),
                    });
                    group = [];
                }
            });

            // Flush remaining words
            if (group.length > 0) {
                subs.push({
                    start:    group[0].start,
                    end:      group[group.length - 1].end,
                    text:     group.map(g => (g.word || '').trim()).join(' ').replace(/\s+([,.!?;:])/g, '$1'),
                    wordList: group.map(g => ({ text: (g.word || '').trim(), start: g.start, end: g.end })),
                });
            }

            return subs;
        }

        // ── Generate SRT content from subtitle array ──────────────────────────
        function generateSRTContent(subtitles) {
            if (!subtitles || subtitles.length === 0) return '';
            
            const formatTime = (seconds) => {
                const h = Math.floor(seconds / 3600);
                const m = Math.floor((seconds % 3600) / 60);
                const s = Math.floor(seconds % 60);
                const ms = Math.floor((seconds % 1) * 1000);
                return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
            };
            
            return subtitles.map((sub, idx) => {
                return `${idx + 1}\n${formatTime(sub.start)} --> ${formatTime(sub.end)}\n${sub.text}\n`;
            }).join('\n');
        }

        // ── Save SRT to file ─────────────────────────────────────────────────
        async function saveSRTToFile(subtitles) {
            try {
                const srtContent = generateSRTContent(subtitles);
                if (!srtContent) {
                    log('No subtitles to save.', 'error');
                    return;
                }

                // Try to save to /subtitles folder using File System Access API
                try {
                    const dirHandle = await window.showDirectoryPicker();
                    const fileName = `transcription_${Date.now()}.srt`;
                    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(srtContent);
                    await writable.close();
                    log(`💾 SRT saved: ${fileName}`, 'success');
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') return; // User cancelled
                    // Fallback: download as file
                    log('Falling back to download...', 'normal');
                }

                // Fallback: download SRT file
                const blob = new Blob([srtContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `transcription_${Date.now()}.srt`;
                a.click();
                URL.revokeObjectURL(url);
                log(`💾 SRT downloaded: transcription_${Date.now()}.srt`, 'success');
            } catch (err) {
                log(`Error saving SRT: ${err.message}`, 'error');
            }
        }

        // ── Groq API transcription ────────────────────────────────────────────
        async function transcribeWithGroq(blob, apiKey, onProgress) {
            onProgress('⚡ Sending audio to Groq Whisper...');

            const ext  = (blob.name || blob.type || 'mp3').split('/').pop().split('.').pop() || 'mp3';
            const form = new FormData();
            form.append('file',  blob, `audio.${ext}`);
            form.append('model', 'whisper-large-v3-turbo');
            form.append('response_format', 'verbose_json');
            form.append('timestamp_granularities[]', 'word');
            form.append('timestamp_granularities[]', 'segment');

            const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                method:  'POST',
                headers: { 'Authorization': `Bearer ${apiKey}` },
                body:    form,
            });

            if (!res.ok) {
                let errMsg = `HTTP ${res.status}`;
                try {
                    const errBody = await res.json();
                    errMsg = errBody?.error?.message || errMsg;
                    // Specific friendly messages
                    if (res.status === 401) errMsg = 'Invalid Groq API key. Check your key at console.groq.com.';
                    if (res.status === 413) errMsg = 'File too large for Groq API (max 25 MB). Compress to MP3.';
                    if (res.status === 429) errMsg = 'Groq rate limit reached. Wait a moment and try again.';
                } catch (_) {}
                throw new Error(errMsg);
            }

            onProgress('✅ Transcription received — processing word timestamps...');
            const data = await res.json();

            // Groq returns data.words[] with {word, start, end}
            // Fall back to segments if word-level not available
            const words = data.words && data.words.length > 0
                ? data.words
                : (data.segments || []).flatMap(seg => {
                    const ws = (seg.text || '').trim().split(/\s+/);
                    const dur = (seg.end - seg.start) / ws.length;
                    return ws.map((w, i) => ({ word: w, start: seg.start + i * dur, end: seg.start + (i + 1) * dur }));
                });

            if (words.length === 0) throw new Error('Groq returned no words. Is the audio silent or corrupted?');

            return words;
        }

        // ── Button handler ────────────────────────────────────────────────────
        document.getElementById('autoSubBtn').addEventListener('click', async () => {
            const apiKey = (document.getElementById('groqApiKey').value || '').trim() ||
                           (localStorage.getItem('groq_api_key') || '').trim();

            if (!apiKey) {
                alert('Please enter your Groq API key above first.\n\nGet one free at: https://console.groq.com');
                const panel = document.getElementById('groqSettingsPanel');
                const toggle = document.getElementById('toggleGroqSettingsBtn');
                if (panel && toggle) {
                    panel.style.display = 'block';
                    toggle.style.background = 'var(--panel-hover)';
                }
                document.getElementById('groqApiKey').focus();
                return;
            }
            if (!audioBlob) {
                alert('Please upload an audio file (step 1) before transcribing.');
                return;
            }

            const btn = document.getElementById('autoSubBtn');
            const GROQ_MAX_BYTES = 25 * 1024 * 1024;
            
            if (audioBlob.size > GROQ_MAX_BYTES) {
                document.getElementById('compressAudioBox').style.display = 'block';
                showToast('error', '\u274c', `Audio is ${(audioBlob.size / 1024 / 1024).toFixed(1)} MB (Max 25 MB for AI). Please click Compress.`);
                return;
            }
            
            document.getElementById('compressAudioBox').style.display = 'none';
            btn.disabled = true;
            showToast('working', '\u27f3', 'Connecting to Groq Whisper…');

            const t0 = Date.now();
            try {
                const words = await transcribeWithGroq(audioBlob, apiKey, (msg) => {
                    showToast('working', '\u26a1', msg);
                });

                originalParsedSubtitles = groqWordsToSubtitles(words);
                applySubSpeed();
                const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

                showToast('success', '\u2705',
                    `${parsedSubtitles.length} subtitle blocks — ${words.length} word timestamps`,
                    `${elapsed}s`);
                setStatus('s5status', `\u2713 ${parsedSubtitles.length} blocks`, 'ok');
                log(`Groq transcription done in ${elapsed}s \u2014 ${parsedSubtitles.length} subtitle blocks, ${words.length} word timestamps.`, 'success');
                
                // Auto-save SRT
                await saveSRTToFile(parsedSubtitles);

            } catch (err) {
                console.error(err);
                showToast('error', '\u274c', err.message || 'Unknown error \u2014 check console');
                log('Groq transcription failed: ' + err.message, 'error');
            } finally {
                btn.disabled = false;
            }
        });

        document.getElementById('compressBtn').addEventListener('click', async () => {
            if (!originalAudioBuffer) return;
            const btn = document.getElementById('compressBtn');
            btn.disabled = true;
            btn.textContent = 'Compressing... Please wait.';
            
            try {
                showToast('working', '\u26a1', 'Compressing audio for Groq API (~32kbps)...');
                
                let config = null;
                const testConfigs = [
                    { codec: 'mp4a.40.2', sampleRate: 44100, numberOfChannels: 1, bitrate: 64000 },
                    { codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 1, bitrate: 64000 },
                    { codec: 'mp4a.40.2', sampleRate: 44100, numberOfChannels: 2, bitrate: 96000 },
                    { codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2, bitrate: 96000 },
                    { codec: 'mp4a.40.2', sampleRate: 44100, numberOfChannels: 2, bitrate: 128000 },
                    { codec: 'mp4a.40.2', sampleRate: originalAudioBuffer.sampleRate, numberOfChannels: Math.min(2, originalAudioBuffer.numberOfChannels), bitrate: 128000 }
                ];
                
                for (let c of testConfigs) {
                    const support = await AudioEncoder.isConfigSupported(c);
                    if (support.supported) {
                        config = c;
                        break;
                    }
                }
                
                if (!config) {
                    throw new Error("Local AAC encoding is not supported in this browser. Please manually compress to MP3.");
                }

                log(`Muxer using config: ${config.sampleRate}Hz, ${config.numberOfChannels}ch, ${config.bitrate}bps`);

                // Set up mp4-muxer for an audio-only file
                const muxer = new Mp4Muxer.Muxer({
                    target: new Mp4Muxer.ArrayBufferTarget(),
                    audio: { codec: 'aac', numberOfChannels: config.numberOfChannels, sampleRate: config.sampleRate },
                    fastStart: 'in-memory'
                });

                // Resample using hardware OfflineAudioContext
                const offlineCtx = new OfflineAudioContext(config.numberOfChannels, Math.ceil(originalAudioBuffer.duration * config.sampleRate), config.sampleRate);
                const source = offlineCtx.createBufferSource();
                source.buffer = originalAudioBuffer;
                source.connect(offlineCtx.destination);
                source.start(0);
                const resampled = await offlineCtx.startRendering();

                let encoderError = null;
                const audioEncoder = new AudioEncoder({
                    output: (chunk, meta) => {
                        try {
                            muxer.addAudioChunk(chunk, meta);
                        } catch (err) {
                            encoderError = err;
                        }
                    },
                    error: e => { encoderError = e; }
                });
                
                audioEncoder.configure(config);

                const frameSize = 1024;
                const totalAudioFrames = resampled.length;
                const channels = config.numberOfChannels;
                
                const channelData = [];
                for (let c = 0; c < channels; c++) {
                    channelData.push(resampled.getChannelData(c));
                }

                for (let offset = 0; offset < totalAudioFrames; offset += frameSize) {
                    if (encoderError) throw encoderError;
                    
                    const size = Math.min(frameSize, totalAudioFrames - offset);
                    const planarData = new Float32Array(size * channels);
                    
                    for (let c = 0; c < channels; c++) {
                        planarData.set(channelData[c].subarray(offset, offset + size), c * size);
                    }
                    
                    const audioData = new AudioData({
                        format: 'f32-planar',
                        sampleRate: config.sampleRate,
                        numberOfFrames: size,
                        numberOfChannels: channels,
                        timestamp: Math.round((offset / config.sampleRate) * 1e6),
                        data: planarData
                    });
                    
                    audioEncoder.encode(audioData);
                    audioData.close();
                    
                    if (audioEncoder.encodeQueueSize > 50) await new Promise(r => setTimeout(r, 10));
                }
                
                if (encoderError) throw encoderError;
                await audioEncoder.flush();
                audioEncoder.close();
                muxer.finalize();
                
                audioBlob = new Blob([muxer.target.buffer], { type: 'audio/mp4' });
                
                // Hide compress UI, restore button, autostart transcription
                document.getElementById('compressAudioBox').style.display = 'none';
                showToast('success', '\u2705', `Compressed to ${(audioBlob.size / 1024 / 1024).toFixed(2)} MB. Now transcribing...`);
                log(`Audio successfully compressed for AI down to ${(audioBlob.size / 1024 / 1024).toFixed(2)} MB.`, 'success');
                
                document.getElementById('autoSubBtn').click();
                
            } catch (err) {
                console.error(err);
                showToast('error', '\u274c', 'Compression failed: ' + err.message);
                log('Audio Compression failed: ' + err.message, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = '🗜️ Compress for AI';
            }
        });

        // ── UI Helpers ────────────────────────────────────────────────
        function updateTotalTime() {
            const inputs = document.querySelectorAll('.scene-duration');
            let total = 0;
            inputs.forEach(input => total += (parseInt(input.value) || 0));
            const mins = Math.floor(total / 60);
            const secs = total % 60;
            const display = document.getElementById('totalTimeDisplay');
            if (display) {
                if (mins > 0) display.innerText = `${mins}m ${secs}s total`;
                else          display.innerText = `${total}s total`;
            }
            setStatus('s4status', `${total}s (${loadedScenes.length} scenes)`, 'ok');
        }

        function renderScenesList() {
            const list = document.getElementById('scenesList');
            list.innerHTML = '';
            // Fallback: 30 mins divided evenly
            const fallbackDuration = Math.floor(1800 / loadedScenes.length);

            loadedScenes.forEach((scene, i) => {
                const div = document.createElement('div');
                div.className = 'scene-item';

                // Advanced format: use scene name + built-in dur; Classic: generic label
                const isAdvanced  = (sceneFormat === 'new' && scene && typeof scene === 'object');
                const sceneName   = isAdvanced && scene.name ? scene.name : `Scene ${i + 1}`;
                const sceneSub    = isAdvanced && scene.sub  ? scene.sub  : '';
                const sceneColor  = isAdvanced && scene.color ? scene.color : 'var(--accent)';
                // Pre-fill with the scene's own dur if available (from advanced format)
                const initDur     = isAdvanced && scene.dur ? scene.dur : fallbackDuration;

                const labelHTML = sceneSub
                    ? `<div style="display:flex;flex-direction:column;gap:1px;min-width:160px;max-width:220px;">
                           <span style="font-size:0.82rem;font-weight:600;color:${sceneColor};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${sceneName}">${sceneName}</span>
                           <span style="font-size:0.72rem;color:#666;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${sceneSub}">${sceneSub}</span>
                       </div>`
                    : `<span style="min-width:120px;font-weight:500;color:${sceneColor};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${sceneName}">🎬 ${sceneName}</span>`;

                div.innerHTML = `
                    ${labelHTML}
                    <input type="range" class="scene-slider" data-index="${i}" value="${initDur}" min="1" max="1800" style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="number" class="scene-duration" data-index="${i}" value="${initDur}" min="1">
                        <span style="color: #888; font-size: 0.9rem;">sec</span>
                    </div>
                `;
                list.appendChild(div);
            });

            document.querySelectorAll('.scene-item').forEach(item => {
                const slider = item.querySelector('.scene-slider');
                const number = item.querySelector('.scene-duration');

                slider.addEventListener('input', (e) => {
                    number.value = e.target.value;
                    updateTotalTime();
                });

                number.addEventListener('input', (e) => {
                    slider.value = e.target.value;
                    updateTotalTime();
                });
            });
            updateTotalTime();
        }

        document.getElementById('applyGlobalTimeBtn').addEventListener('click', () => {
            const val = document.getElementById('globalTimeInput').value;
            document.querySelectorAll('.scene-item').forEach(item => {
                item.querySelector('.scene-slider').value = val;
                item.querySelector('.scene-duration').value = val;
            });
            updateTotalTime();
            log(`Set all scenes to ${val} seconds.`);
        });

        document.getElementById('distributeBtn').addEventListener('click', () => {
            const inputs = document.querySelectorAll('.scene-duration');
            const sliders = document.querySelectorAll('.scene-slider');
            const duration = Math.floor(1800 / inputs.length);
            inputs.forEach(input => input.value = duration);
            sliders.forEach(slider => slider.value = duration);
            log(`Distributed 1800 seconds evenly across ${inputs.length} scenes.`);
            updateTotalTime();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            if (isRendering) {
                cancelRender = true;
                log('Cancel requested. Stopping after current frame...', 'error');
            }
        });

        // --- Core Render Engine ---
        document.getElementById('renderBtn').addEventListener('click', async () => {
            if (loadedScenes.length === 0) return;
            
            isRendering = true;
            cancelRender = false;
            document.getElementById('renderBtn').style.display = 'none';
            document.getElementById('cancelBtn').style.display = 'inline-flex';
            document.getElementById('renderPanel').classList.add('rendering');
            
            const fps = parseInt(document.getElementById('fps').value) || 30;
            const bitrate = (parseFloat(document.getElementById('bitrate').value) || 4) * 1e6;
            
            // Parse resolution from dropdown
            const resolutionStr = document.getElementById('resolution').value || '1920x1080';
            const resMatch = resolutionStr.match(/(\d+)\s*[x×]\s*(\d+)/);
            let width = 1920, height = 1080;
            if (resMatch) {
                width = parseInt(resMatch[1]);
                height = parseInt(resMatch[2]);
            }
            
            // Dynamically resize iframe to match selected resolution
            const iframe = document.getElementById('renderIframe');
            if (iframe) {
                iframe.style.width = width + 'px';
                iframe.style.height = height + 'px';
                log(`📐 Resized capture iframe to ${width}×${height}`, 'highlight');
            }
            
            // Gather scene durations
            const sceneDurations = Array.from(document.querySelectorAll('.scene-duration')).map(input => parseInt(input.value) || 0);
            const totalDuration = sceneDurations.reduce((a, b) => a + b, 0);
            const totalFrames = Math.ceil(totalDuration * fps);
            
            log(`Starting render: 1080p @ ${fps}fps, ${bitrate/1e6}Mbps.`, 'highlight');
            log(`Total duration: ${totalDuration}s (${totalFrames} frames).`);

            try {
                // 0. Request file save location (for direct-to-disk streaming)
                let writableStream = null;
                try {
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: `rendered_video_${Date.now()}.mp4`,
                        types: [{ description: 'MP4 Video', accept: { 'video/mp4': ['.mp4'] } }]
                    });
                    writableStream = await fileHandle.createWritable();
                    log(`📁 File destination locked. Streaming to disk...`, 'highlight');
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        log(`Warning: File System Access API not available. Using RAM buffer (may fail on large videos).`, 'error');
                    } else {
                        log(`Render cancelled by user.`, 'error');
                        throw new Error('User cancelled file save dialog');
                    }
                }

                // 1. Setup mp4-muxer
                const muxerTarget = writableStream 
                    ? new Mp4Muxer.FileSystemWritableFileStreamTarget(writableStream)
                    : new Mp4Muxer.ArrayBufferTarget();
                
                const muxer = new Mp4Muxer.Muxer({
                    target: muxerTarget,
                    video: {
                        codec: 'avc',
                        width: width,
                        height: height
                    },
                    audio: audioBuffer ? {
                        codec: 'aac',
                        numberOfChannels: audioBuffer.numberOfChannels,
                        sampleRate: audioBuffer.sampleRate
                    } : undefined,
                    fastStart: writableStream ? false : 'in-memory' // Disable fastStart when streaming
                });

                // 2. Setup Video Encoder
                const videoEncoder = new VideoEncoder({
                    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
                    error: e => log(`Video Encoder Error: ${e.message}`, 'error')
                });
                
                videoEncoder.configure({
                    codec: 'avc1.4d002a', // H.264 Main Profile 4.2 (universally supported)
                    width: width,
                    height: height,
                    bitrate: bitrate,
                    framerate: fps,
                    hardwareAcceleration: 'prefer-hardware', // Use GPU (NVENC/VideoToolbox)
                    bitrateMode: 'variable', // Variable Bitrate for better quality in complex scenes
                    latencyMode: 'quality' // Prioritize render quality over real-time latency
                });

                // 3. Setup Audio Encoder (if audio present)
                let audioEncoder = null;
                if (audioBuffer) {
                    audioEncoder = new AudioEncoder({
                        output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
                        error: e => log(`Audio Encoder Error: ${e.message}`, 'error')
                    });
                    audioEncoder.configure({
                        codec: 'mp4a.40.2', // AAC-LC
                        sampleRate: audioBuffer.sampleRate,
                        numberOfChannels: audioBuffer.numberOfChannels,
                        bitrate: 128000
                    });
                }

                // 4. Create Offscreen Canvas
                const canvas = new OffscreenCanvas(width, height);
                const ctx = canvas.getContext('2d', { alpha: false });
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                const startTime = performance.now();
                let currentSceneIndex = 0;
                let framesInCurrentScene = 0;

                // --- AUDIO ENCODING LOOP ---
                if (audioEncoder && audioBuffer) {
                    log('Encoding audio track first...', 'highlight');
                    const sampleRate = audioBuffer.sampleRate;
                    const channels = audioBuffer.numberOfChannels;
                    const frameSize = 1024; // AAC frame size
                    const totalAudioFrames = audioBuffer.length;
                    
                    // Interleave planar audio buffer data for WebCodecs
                    const channelData = [];
                    for (let c = 0; c < channels; c++) {
                        channelData.push(audioBuffer.getChannelData(c));
                    }

                    for (let offset = 0; offset < totalAudioFrames; offset += frameSize) {
                        if (cancelRender) break;
                        const size = Math.min(frameSize, totalAudioFrames - offset);
                        const planarData = new Float32Array(size * channels);
                        
                        for (let c = 0; c < channels; c++) {
                            planarData.set(channelData[c].subarray(offset, offset + size), c * size);
                        }

                        const audioData = new AudioData({
                            format: 'f32-planar',
                            sampleRate: sampleRate,
                            numberOfFrames: size,
                            numberOfChannels: channels,
                            timestamp: (offset / sampleRate) * 1e6,
                            data: planarData
                        });

                        audioEncoder.encode(audioData);
                        audioData.close();

                        // Backpressure handling
                        if (audioEncoder.encodeQueueSize > 100) {
                            await new Promise(r => setTimeout(r, 10));
                        }
                    }
                    await audioEncoder.flush();
                    audioEncoder.close();
                    log('Audio encoding complete.', 'success');
                }

                // --- VIDEO ENCODING LOOP ---
                log('Encoding video frames...', 'highlight');
                log(`Scene format: ${sceneFormat === 'new' ? 'Advanced (RENDERERS)' : 'Classic (RAF callbacks)'}`, 'highlight');

                const iframe = document.getElementById('renderIframe');
                const iWindow = iframe.contentWindow;
                const iDoc = iframe.contentDocument;

                // For new format: immediately kill the auto-started masterLoop RAF
                // so it doesn't interfere with our frame-driven pipeline
                if (sceneFormat === 'new') {
                    iWindow.__drawCallbacks.clear();
                }

                for (let i = 0; i < totalFrames; i++) {
                    if (cancelRender) break;

                    // Determine active scene
                    const sceneDurationFrames = sceneDurations[currentSceneIndex] * fps;

                    // ── SCENE INITIALIZATION (first frame of each scene) ──────────────
                    if (framesInCurrentScene === 0) {

                        if (sceneFormat === 'new') {
                            // Advanced format: kill any queued masterLoop, then navigate
                            iWindow.__drawCallbacks.clear();
                            try {
                                if (typeof iWindow.goTo === 'function') {
                                    iWindow.goTo(currentSceneIndex);
                                } else {
                                    // Graceful fallback: manually set currentScene / cur
                                    if ('currentScene' in iWindow) iWindow.currentScene = currentSceneIndex;
                                    if ('cur'          in iWindow) iWindow.cur          = currentSceneIndex;
                                }
                            } catch (err) {
                                log(`Error switching to Scene ${currentSceneIndex + 1}: ${err.message}`, 'error');
                            }

                        } else {
                            // Classic format: clear RAF queue, clear canvases, call show()
                            iWindow.__drawCallbacks.clear();

                            const allCanvases = iDoc.querySelectorAll('canvas');
                            allCanvases.forEach(c => {
                                const cctx = c.getContext('2d');
                                if (cctx) cctx.clearRect(0, 0, c.width, c.height);
                            });

                            try {
                                if (typeof iWindow.show === 'function') {
                                    iWindow.__mockTime = (i / fps) * 1000;
                                    iWindow.__sceneStartMockTime = iWindow.__mockTime;
                                    iWindow.show(currentSceneIndex);
                                } else {
                                    iWindow.active = currentSceneIndex;
                                    loadedScenes[currentSceneIndex]();
                                }
                            } catch (err) {
                                log(`Error initializing Scene ${currentSceneIndex + 1}: ${err.message}`, 'error');
                            }
                        }
                    }

                    // ── DRAW CURRENT FRAME ────────────────────────────────────────────
                    if (sceneFormat === 'new') {
                        // Advanced format:
                        //   gt  = i                 (global frame counter — never resets)
                        //   st  = framesInCurrentScene (frame within this scene — resets per scene)
                        //   tot = total frames for this scene at target fps
                        const totalFramesForScene = sceneDurations[currentSceneIndex] * fps;
                        try {
                            drawFunctions[currentSceneIndex](i, framesInCurrentScene, totalFramesForScene);
                        } catch (e) {
                            console.error(`Renderer[${currentSceneIndex}] error:`, e);
                        }

                    } else {
                        // Classic format: fire RAF callbacks synchronously
                        const callbacks = Array.from(iWindow.__drawCallbacks.values());
                        iWindow.__drawCallbacks.clear();
                        iWindow.__mockTime = (i / fps) * 1000;

                        callbacks.forEach(cb => {
                            try { cb(iWindow.__mockTime); }
                            catch (e) { console.error(e); }
                        });
                    }

                    // ── GRAB THE ACTIVE CANVAS ────────────────────────────────────────
                    // Supports both 'cv0' (advanced format) and 'c0' (classic format)
                    const canvases = iDoc.querySelectorAll('canvas');
                    let sourceCanvas =
                        iDoc.getElementById('cv' + currentSceneIndex) ||
                        iDoc.getElementById('c'  + currentSceneIndex) ||
                        canvases[currentSceneIndex] ||
                        canvases[0];

                    if (!sourceCanvas && canvases.length > 0) {
                        sourceCanvas = canvases[0];
                    }

                    // Clear and render frame to our offscreen canvas
                    ctx.fillStyle = '#000';
                    ctx.fillRect(0, 0, width, height);
                    
                    if (sourceCanvas) {
                        ctx.drawImage(sourceCanvas, 0, 0, width, height);
                    }

                    // Draw Subtitles
                    if (parsedSubtitles.length > 0) {
                        const currentTime = i / fps;
                        // Find active subtitle
                        const activeSub = parsedSubtitles.find(s => currentTime >= s.start && currentTime <= s.end);
                        if (activeSub) {
                            drawSubtitle(ctx, activeSub, currentTime, width, height);
                        }
                    }

                    // Encode frame
                    const frame = new VideoFrame(canvas, { timestamp: i * 1e6 / fps });
                    videoEncoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
                    frame.close();

                    framesInCurrentScene++;

                    if (framesInCurrentScene >= sceneDurationFrames) {
                        currentSceneIndex++;
                        framesInCurrentScene = 0;
                        if (currentSceneIndex >= loadedScenes.length) break;
                    }

                    // Handle backpressure to prevent memory leaks
                    if (videoEncoder.encodeQueueSize > 30) {
                        await new Promise(r => setTimeout(r, 10));
                    }

                    // Update UI periodically
                    if (i % 15 === 0) {
                        const percent = (i / totalFrames) * 100;
                        document.getElementById('progressFill').style.width = `${percent.toFixed(1)}%`;
                        document.getElementById('progressPct').textContent = `${percent.toFixed(1)}%`;

                        const elapsed = (performance.now() - startTime) / 1000;
                        const fpsRender = i / Math.max(elapsed, 0.001);
                        const remaining = (totalFrames - i) / Math.max(fpsRender, 0.001);

                        document.getElementById('statusText').innerText =
                            `Scene ${currentSceneIndex + 1}/${loadedScenes.length}  \u00b7  Frame ${i}/${totalFrames}  \u00b7  ${fpsRender.toFixed(0)} fps  \u00b7  ~${remaining.toFixed(0)}s left`;

                        await new Promise(r => setTimeout(r, 0));
                    }
                }

                // ── FINALIZE ───────────────────────────────────────────
                if (!cancelRender) {
                    document.getElementById('progressFill').style.width = '100%';
                    document.getElementById('progressPct').textContent  = '100%';
                    document.getElementById('statusText').innerText = 'Flushing encoder…';

                    await videoEncoder.flush();
                    videoEncoder.close();

                    muxer.finalize();
                    
                    // Handle both streaming and buffer modes
                    if (writableStream) {
                        await writableStream.close();
                        log(`✅ Render complete! Video saved directly to your chosen folder.`, 'success');
                        document.getElementById('statusText').innerText = `✅ Done! Video saved to disk.`;
                    } else {
                        const buffer = muxer.target.buffer;
                        const sizeMB = (buffer.byteLength / 1024 / 1024).toFixed(2);
                        log(`✅ Render complete! File size: ${sizeMB} MB`, 'success');
                        document.getElementById('statusText').innerText = `✅ Done! Saved ${sizeMB} MB MP4`;

                        const blob = new Blob([buffer], { type: 'video/mp4' });
                        const url  = URL.createObjectURL(blob);
                        const a    = document.createElement('a');
                        a.href = url;
                        a.download = `rendered_video_${Date.now()}.mp4`;
                        a.click();
                        URL.revokeObjectURL(url);
                    }
                } else {
                    document.getElementById('progressPct').textContent = '';
                    document.getElementById('statusText').innerText = 'Render cancelled.';
                }

            } catch (err) {
                log(`Fatal Error: ${err.message}`, 'error');
                document.getElementById('statusText').innerText = '\u274c Error: ' + err.message;
            } finally {
                isRendering = false;
                document.getElementById('renderBtn').style.display = 'inline-flex';
                document.getElementById('cancelBtn').style.display = 'none';
                document.getElementById('renderPanel').classList.remove('rendering');
            }
        });
        // --- Subtitle Rendering Logic ---
        function drawSubtitle(ctx, sub, time, w, h) {
            const fontSize = parseInt(document.getElementById('subSize').value) || 72;
            const animType = document.getElementById('subAnim').value;
            
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            // Use a thick, bold font perfect for social media
            ctx.font = `900 ${fontSize}px "Arial Black", Impact, sans-serif`;
            
            // Heavy styling for readability against any background
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = fontSize * 0.2;
            ctx.lineJoin = 'round';
            
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetY = 8;
            
            // Animation math
            const elapsed = time - sub.start;
            const remaining = sub.end - time;
            const duration = sub.end - sub.start;
            
            let scale = 1;
            let alpha = 1;
            let yOffset = 0;
            let blurAmount = 0;
            let wipeProgress = 1;
            
            // Ensure intro/outro animations don't overlap on very short subtitles
            const introTime = Math.min(0.15, duration * 0.3); 
            const outroTime = Math.min(0.15, duration * 0.3); 
            
            if (animType === 'pop') {
                if (elapsed < introTime) {
                    // Overshoot spring effect
                    const t = elapsed / introTime;
                    scale = 0.5 + 0.6 * Math.sin(t * Math.PI / 2); 
                    if (scale > 1.05) scale = 1.05 - (scale - 1.05); // slight bounce
                } else if (remaining < outroTime) {
                    scale = Math.max(0, remaining / outroTime);
                    alpha = scale;
                }
            } else if (animType === 'fade') {
                if (elapsed < introTime) alpha = elapsed / introTime;
                else if (remaining < outroTime) alpha = Math.max(0, remaining / outroTime);
            } else if (animType === 'slide') {
                if (elapsed < introTime) {
                    yOffset = 50 * (1 - (elapsed / introTime));
                    alpha = elapsed / introTime;
                } else if (remaining < outroTime) {
                    yOffset = 50 * (1 - (remaining / outroTime));
                    alpha = Math.max(0, remaining / outroTime);
                }
            } else if (animType === 'slam') {
                if (elapsed < introTime) {
                    const t = elapsed / introTime;
                    const easeOut = 1 - Math.pow(1 - t, 3);
                    scale = 3 - 2 * easeOut; // 3 down to 1
                    alpha = t;
                } else if (remaining < outroTime) {
                    scale = Math.max(0, remaining / outroTime);
                    alpha = scale;
                }
            } else if (animType === 'blur') {
                if (elapsed < introTime) {
                    const t = elapsed / introTime;
                    alpha = t;
                    blurAmount = 20 * (1 - t);
                } else if (remaining < outroTime) {
                    const t = remaining / outroTime;
                    alpha = t;
                    blurAmount = 20 * (1 - t);
                }
            } else if (animType === 'typewriter') {
                const typeIntro = Math.min(0.3, duration * 0.5); // Slower intro for typewriter
                if (elapsed < typeIntro) {
                    wipeProgress = elapsed / typeIntro;
                }
                if (remaining < outroTime) {
                    alpha = Math.max(0, remaining / outroTime);
                }
            } else if (animType === 'neon') {
                const pulse = 0.5 + 0.5 * Math.sin(time * 8);
                ctx.shadowColor = `rgba(0, 255, 255, ${0.6 + 0.4 * pulse})`; // Cyan glow
                ctx.shadowBlur = 20 + 15 * pulse;
                ctx.strokeStyle = '#0088ff';
                ctx.lineWidth = fontSize * 0.1;
                
                if (elapsed < introTime) {
                    const t = elapsed / introTime;
                    scale = 0.8 + 0.2 * t;
                    alpha = t;
                } else if (remaining < outroTime) {
                    alpha = Math.max(0, remaining / outroTime);
                }
            } else if (animType === 'drop') {
                if (elapsed < introTime) {
                    const t = elapsed / introTime;
                    const c4 = (2 * Math.PI) / 3;
                    const easeOutElastic = t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
                    yOffset = h * 0.5 * (1 - easeOutElastic); // Drop from middle of screen
                    alpha = Math.min(1, t * 2);
                } else if (remaining < outroTime) {
                    const t = remaining / outroTime;
                    yOffset = -50 * (1 - t);
                    alpha = t;
                }
            }
            
            let displayText = sub.text;
            let activeWordIndex = -1;
            
            if (animType === 'oneword') {
                if (sub.wordList && sub.wordList.length > 0) {
                    // Find the exact word being spoken right now
                    let found = sub.wordList.find(w => time >= w.start && time <= w.end);
                    // If between words, pick the one that just ended or is about to start
                    if (!found) found = sub.wordList.find(w => time <= w.start) || sub.wordList[sub.wordList.length - 1];
                    
                    displayText = found.text;
                    
                    // Add a micro-pop effect specifically for this word
                    const wElapsed = time - found.start;
                    if (wElapsed > 0 && wElapsed < 0.15) {
                        scale = Math.max(scale, 1 + 0.2 * Math.sin((wElapsed / 0.15) * Math.PI));
                    }
                } else {
                    // Fallback for uploaded SRT/VTT files (estimate word timing)
                    const words = sub.text.split(/\s+/);
                    const wordDuration = duration / words.length;
                    const wordIndex = Math.min(words.length - 1, Math.floor(elapsed / wordDuration));
                    
                    displayText = words[wordIndex];
                    
                    const wElapsed = elapsed - (wordIndex * wordDuration);
                    if (wElapsed > 0 && wElapsed < 0.15) {
                        scale = Math.max(scale, 1 + 0.2 * Math.sin((wElapsed / 0.15) * Math.PI));
                    }
                }
            } else if (animType === 'highlight') {
                if (sub.wordList && sub.wordList.length > 0) {
                    for (let i = 0; i < sub.wordList.length; i++) {
                        if (time >= sub.wordList[i].start) {
                            activeWordIndex = i;
                        }
                    }
                } else {
                    const words = sub.text.split(/\s+/);
                    const wordDuration = duration / words.length;
                    activeWordIndex = Math.min(words.length - 1, Math.max(0, Math.floor(elapsed / wordDuration)));
                }
            }
            
            ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
            if (blurAmount > 0) ctx.filter = `blur(${blurAmount}px)`;
            
            const x = w / 2;
            const y = Math.min(h - 50, h * 0.85) - yOffset; // Clamp subtitle within visible bounds
            
            ctx.translate(x, y);
            ctx.scale(scale, scale);
            
            if (animType === 'typewriter' && wipeProgress < 1) {
                ctx.beginPath();
                // Clip from far left to a percentage of the screen width
                // Since we translated to w/2, left edge is -w/2
                ctx.rect(-w, -h, (w * 2) * wipeProgress, h * 2);
                ctx.clip();
            }
            
            if (animType === 'highlight') {
                ctx.textAlign = 'left';
                const lines = displayText.split('\n');
                const lineHeight = fontSize * 1.2;
                const startY = -(lines.length - 1) * lineHeight;
                
                let globalWordIdx = 0;
                
                for (let j = 0; j < lines.length; j++) {
                    const lineY = startY + (j * lineHeight);
                    const words = lines[j].split(/\s+/);
                    
                    let totalWidth = 0;
                    const wordWidths = [];
                    const pureWordWidths = [];
                    
                    for (let w = 0; w < words.length; w++) {
                        const pureWidth = ctx.measureText(words[w]).width;
                        const spaceWidth = (w < words.length - 1) ? ctx.measureText(' ').width : 0;
                        pureWordWidths.push(pureWidth);
                        wordWidths.push(pureWidth + spaceWidth);
                        totalWidth += pureWidth + spaceWidth;
                    }
                    
                    let currentX = -totalWidth / 2;
                    
                    for (let w = 0; w < words.length; w++) {
                        const isPast = (globalWordIdx < activeWordIndex);
                        const isActive = (globalWordIdx === activeWordIndex);
                        
                        if (isActive) {
                            ctx.fillStyle = '#FFD700'; // Yellow highlight
                            ctx.strokeStyle = '#000000';
                        } else if (isPast) {
                            ctx.fillStyle = '#FFFFFF'; // Solid white for spoken
                            ctx.strokeStyle = '#000000';
                        } else {
                            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; // Faded for future
                            ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
                        }
                        
                        if (isActive) {
                            ctx.save();
                            ctx.translate(currentX + pureWordWidths[w] / 2, lineY);
                            
                            let popScale = 1;
                            if (sub.wordList && sub.wordList[globalWordIdx]) {
                                const wElapsed = time - sub.wordList[globalWordIdx].start;
                                if (wElapsed > 0 && wElapsed < 0.15) {
                                    popScale = 1 + 0.15 * Math.sin((wElapsed / 0.15) * Math.PI);
                                }
                            } else {
                                const wordDuration = duration / (displayText.split(/\s+/).length);
                                const wElapsed = elapsed - (globalWordIdx * wordDuration);
                                if (wElapsed > 0 && wElapsed < 0.15) {
                                    popScale = 1 + 0.15 * Math.sin((wElapsed / 0.15) * Math.PI);
                                }
                            }
                            
                            ctx.scale(popScale, popScale);
                            ctx.textAlign = 'center';
                            ctx.strokeText(words[w], 0, 0);
                            ctx.fillText(words[w], 0, 0);
                            ctx.restore();
                        } else {
                            ctx.textAlign = 'left';
                            ctx.strokeText(words[w], currentX, lineY);
                            ctx.fillText(words[w], currentX, lineY);
                        }
                        
                        currentX += wordWidths[w];
                        globalWordIdx++;
                    }
                }
            } else {
                // Handle multiline text for other animations
                const lines = displayText.split('\n');
                const lineHeight = fontSize * 1.2;
                const startY = -(lines.length - 1) * lineHeight;
                
                for (let j = 0; j < lines.length; j++) {
                    const lineY = startY + (j * lineHeight);
                    ctx.strokeText(lines[j], 0, lineY);
                    ctx.fillText(lines[j], 0, lineY);
                }
            }
            
            ctx.filter = 'none'; // reset filter
            ctx.restore();
        }
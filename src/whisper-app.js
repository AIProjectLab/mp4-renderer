/**
 * Whisper transcription for auto-subtitles. Loaded as a Vite module so
 * @xenova/transformers is bundled correctly (avoids CDN +esm registerBackend null bug).
 */
import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.allowRemoteModels = true;
env.backends.onnx.wasm.numThreads = 1;

let transcriber = null;

/** Expand one chunk (possibly multiple words) into one wordList entry per word for karaoke highlight. */
function expandChunkToWordList(chunkText, chunkStart, chunkEnd) {
    const words = (chunkText || '').trim().split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) return [];
    if (words.length === 1) return [{ text: words[0], start: chunkStart, end: chunkEnd }];
    const duration = chunkEnd - chunkStart;
    return words.map((text, i) => ({
        text,
        start: chunkStart + (duration * i) / words.length,
        end: chunkStart + (duration * (i + 1)) / words.length,
    }));
}

function processOutput(output, audioLengthSamples) {
    const chunks = output?.chunks || [];
    const text = output?.text ?? '';
    const result = [];
    let currentSub = null;
    const getTs = (c) => c.timestamp || c.timestamps;

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const wordText = (chunk.text || '').trim();
        if (!wordText) continue;

        const ts = getTs(chunk);
        const start = Array.isArray(ts) ? ts[0] : 0;
        const end = Array.isArray(ts) && ts[1] != null ? ts[1] : start + 0.5;
        const chunkWordList = expandChunkToWordList(wordText, start, end);
        const wordCountInChunk = chunkWordList.length;

        if (!currentSub) {
            currentSub = {
                start,
                end,
                text: wordText,
                words: wordCountInChunk,
                wordList: [...chunkWordList],
            };
        } else {
            currentSub.text += ' ' + wordText;
            currentSub.end = end;
            currentSub.words += wordCountInChunk;
            currentSub.wordList.push(...chunkWordList);
        }

        const hasPunctuation = /[.!?]$/.test(wordText);
        const nextChunk = chunks[i + 1];
        const nextTs = nextChunk ? getTs(nextChunk) : null;
        const gap = nextTs && Array.isArray(nextTs) ? nextTs[0] - end : 0;

        if (currentSub.words >= 3 || hasPunctuation || gap > 0.4) {
            result.push({
                start: currentSub.start,
                end: currentSub.end,
                text: currentSub.text,
                wordList: currentSub.wordList,
            });
            currentSub = null;
        }
    }
    if (currentSub) {
        result.push({
            start: currentSub.start,
            end: currentSub.end,
            text: currentSub.text,
            wordList: currentSub.wordList,
        });
    }
    if (result.length === 0 && text.trim()) {
        const dur = audioLengthSamples / 16000;
        result.push({
            start: 0,
            end: Math.max(1, dur),
            text: text.trim(),
            wordList: [],
        });
    }
    return result;
}

/**
 * Run Whisper transcription on 16kHz mono Float32Array audio.
 * @param {Float32Array} audioData - mono 16kHz float32 samples
 * @param {(msg: string) => void} onProgress - progress callback
 * @returns {Promise<Array<{start: number, end: number, text: string, wordList: Array}>} parsed subtitles
 */
function yieldToBrowser() {
    return new Promise((r) => setTimeout(r, 0));
}

function allowPaint() {
    if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => {});
    }
}

export async function runTranscription(audioData, onProgress) {
    if (!audioData || !(audioData instanceof Float32Array) || audioData.length === 0) {
        throw new Error('Invalid audio: expected non-empty Float32Array (16kHz mono).');
    }

    await yieldToBrowser();

    if (!transcriber) {
        if (onProgress) onProgress('Loading Whisper model (~40MB, cached after first run)...');
        allowPaint();
        try {
            transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
                revision: 'output_attentions',
                progress_callback: (data) => {
                    if (onProgress && data && (data.progress != null || data.status === 'progress')) {
                        const pct = data.progress != null ? Math.round(data.progress) : 0;
                        onProgress(pct ? `Downloading model: ${pct}%` : 'Loading model...');
                        allowPaint();
                    }
                },
            });
        } catch (_) {
            transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
                progress_callback: (data) => {
                    if (onProgress && data && data.progress != null) {
                        onProgress(`Downloading model: ${Math.round(data.progress)}%`);
                        allowPaint();
                    }
                },
            });
        }
    }

    await yieldToBrowser();
    if (onProgress) onProgress('Transcribing audio... (this may take a minute)');
    allowPaint();

    const output = await transcriber(audioData, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: 'word',
    });

    return processOutput(output, audioData.length);
}

if (typeof window !== 'undefined') {
    window.WhisperApp = { runTranscription };
}

// ESM build from jsDelivr (dist/transformers.min.js is UMD and breaks in module workers)
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.16.1/+esm';

env.allowLocalModels = false;
env.allowRemoteModels = true;
env.backends.onnx.wasm.numThreads = 1;

let transcriber = null;

function getChunkTiming(chunk) {
    const t = chunk.timestamp || chunk.timestamps;
    if (Array.isArray(t) && t.length >= 2) return { start: t[0], end: t[1] };
    return null;
}

self.onmessage = async (e) => {
    let audioData = e.data?.audioData;

    try {
        if (audioData == null) {
            self.postMessage({ status: 'error', message: 'No audio data received. Upload an audio file first.' });
            return;
        }
        if (audioData instanceof Float32Array) {
            // keep as-is
        } else if (audioData.buffer instanceof ArrayBuffer && audioData.byteLength != null) {
            audioData = new Float32Array(audioData.buffer, audioData.byteOffset || 0, (audioData.byteLength || 0) / 4);
        } else {
            self.postMessage({ status: 'error', message: 'Invalid audio format. Expected Float32Array.' });
            return;
        }
        if (audioData.length === 0) {
            self.postMessage({ status: 'error', message: 'Audio is empty.' });
            return;
        }

        if (!transcriber) {
            self.postMessage({ status: 'init', message: 'Loading Whisper model (~40MB, cached after first run)...' });
            try {
                transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
                    revision: 'output_attentions',
                    progress_callback: (data) => {
                        self.postMessage({ status: 'progress', data });
                    }
                });
            } catch (loadErr) {
                transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
                    progress_callback: (data) => {
                        self.postMessage({ status: 'progress', data });
                    }
                });
            }
        }

        self.postMessage({ status: 'transcribing', message: 'Transcribing audio... This may take a minute.' });

        const output = await transcriber(audioData, {
            chunk_length_s: 30,
            stride_length_s: 5,
            return_timestamps: 'word',
        });

        const chunks = output?.chunks;
        const text = output?.text ?? '';
        const normalized = { text, chunks: [] };
        if (Array.isArray(chunks) && chunks.length > 0) {
            normalized.chunks = chunks.map((c) => {
                const timing = getChunkTiming(c);
                return {
                    text: (c.text ?? '').trim(),
                    timestamp: timing ? [timing.start, timing.end] : [0, 0],
                };
            }).filter((c) => c.text.length > 0);
        } else if (text.trim()) {
            normalized.chunks = [{ text: text.trim(), timestamp: [0, Math.max(1, audioData.length / 16000)] }];
        }
        self.postMessage({ status: 'complete', output: normalized });
    } catch (error) {
        const msg = error?.message ?? String(error);
        self.postMessage({ status: 'error', message: msg });
    }
};

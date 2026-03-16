const fs = require('fs');
const path = require('path');
const https = require('https');

const modelId = 'Xenova/whisper-tiny.en';
const baseUrl = `https://huggingface.co/${modelId}/resolve/main`;
const targetDir = path.join(__dirname, 'public', 'models', modelId);

const files = [
    'config.json',
    'generation_config.json',
    'preprocessor_config.json',
    'special_tokens_map.json',
    'tokenizer.json',
    'tokenizer_config.json',
    'vocab.json',
    'merges.txt',
    'onnx/encoder_model_quantized.onnx',
    'onnx/decoder_model_merged_quantized.onnx'
];

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        const file = fs.createWriteStream(dest);
        https.get(url, response => {
            if ([301, 302, 307, 308].includes(response.statusCode)) {
                let redirectUrl = response.headers.location;
                if (redirectUrl.startsWith('/')) {
                    redirectUrl = 'https://huggingface.co' + redirectUrl;
                }
                downloadFile(redirectUrl, dest).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', err => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

async function main() {
    console.log(`Downloading model ${modelId}...`);
    for (const file of files) {
        const url = `${baseUrl}/${file}`;
        const dest = path.join(targetDir, file);
        console.log(`Downloading ${file}...`);
        try {
            await downloadFile(url, dest);
            console.log(`Successfully downloaded ${file}`);
        } catch (err) {
            console.error(`Error downloading ${file}:`, err);
        }
    }
    console.log('All downloads finished.');
}

main();

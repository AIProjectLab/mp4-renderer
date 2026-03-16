const fs = require('fs');

const htmlPath = 'C:\\Users\\Mzoha\\Downloads\\mp4-renderer\\index.html';
const cssPath = 'C:\\Users\\Mzoha\\Downloads\\mp4-renderer\\styles.css';
const jsPath = 'C:\\Users\\Mzoha\\Downloads\\mp4-renderer\\app.js';

let content = fs.readFileSync(htmlPath, 'utf8');

// 1. Extract CSS
const styleStart = content.indexOf('<style>');
const styleEnd = content.indexOf('</style>') + '</style>'.length;
if (styleStart !== -1 && styleEnd !== -1) {
    let cssContent = content.substring(styleStart + '<style>'.length, styleEnd - '</style>'.length).trim();
    fs.writeFileSync(cssPath, cssContent);
    // Replace with link tag
    content = content.substring(0, styleStart) + '<link rel="stylesheet" href="styles.css">' + content.substring(styleEnd);
}

// 2. Extract JS (assuming the main application script is the last <script> tag before </body>)
const scriptTags = [...content.matchAll(/<script>((.|\n|\r)*?)<\/script>/g)];
if (scriptTags.length > 0) {
    // Usually the last script is our huge main application log
    const lastScript = scriptTags[scriptTags.length - 1];
    let jsContent = lastScript[1].trim();
    fs.writeFileSync(jsPath, jsContent);
    // Replace the exact lastScript
    content = content.replace(lastScript[0], '<script src="app.js"></script>');
}

fs.writeFileSync(htmlPath, content, 'utf8');
console.log('Successfully split index.html into styles.css and app.js');

const fs = require('fs');

const contentStr = fs.readFileSync('constants.ts', 'utf-8');
const rawMatch = contentStr.match(/const RAW_DATA = `([\s\S]*?)`;/);
const RAW_DATA = rawMatch[1];

const parts = RAW_DATA.split(/(第\d+组（.*?）)/).filter(p => p.trim().length > 0);
const groups = [];
for (let i = 0; i < parts.length; i += 2) {
    const header = parts[i];
    const content = parts[i+1];
    if (header && content) {
        const levelMatch = header.match(/第(\d+)组/);
        const level = levelMatch ? parseInt(levelMatch[1], 10) : i / 2 + 1;
        const words = content.split(',').map(w => w.trim()).filter(w => w.length > 0);
        groups.push({ level, label: header.replace(/,$/, '').trim(), wordsCount: words.length });
    }
}
console.log(groups);

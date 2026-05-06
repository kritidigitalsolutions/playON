const fs = require('fs');
const path = require('path');

const pagesDir = 'c:/Users/Asus/OneDrive/Desktop/Play ON/frontend/src/pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

const replacements = [
    { from: /ðŸ‘‘/g, to: '👑' },
    { from: /â€¢/g, to: '•' },
    { from: /â‚¹/g, to: '₹' },
    { from: /ðŸŒ/g, to: '🌍' },
    { from: /â€”/g, to: '—' },
    { from: /â€“/g, to: '–' },
    { from: /ðŸ”’/g, to: '🔒' },
    { from: /ðŸ”“/g, to: '🔓' },
    { from: /ðŸŽ¬/g, to: '🎬' },
    { from: /ðŸ“¹/g, to: '📹' },
    { from: /ðŸ”¥/g, to: '🔥' },
    { from: /âš½/g, to: '⚽' },
    { from: /âœ…/g, to: '✅' },
    { from: /ðŸ🏏/g, to: '🏏' } // Some emojis might be mixed
];

files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    let modified = false;
    replacements.forEach(r => {
        if (r.from.test(content)) {
            content = content.replace(r.from, r.to);
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed encoding in: ${file}`);
    }
});

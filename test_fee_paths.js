const fs = require('fs');
const path = require('path');

const filename = 'health services support .pdf';
const __dirname_mock = 'c:\\Users\\iv\\Desktop\\admission-system';

const localPath = path.join(__dirname_mock, 'backend', 'fee', filename);
console.log('Constructed Path:', localPath);

if (fs.existsSync(localPath)) {
    console.log('✅ File exists at constructed path');
    const stats = fs.statSync(localPath);
    console.log('File size:', stats.size, 'bytes');
} else {
    console.log('❌ File DOES NOT exist at constructed path');

    // Check if maybe it's in the root
    const rootPath = path.join(__dirname_mock, 'fee', filename);
    if (fs.existsSync(rootPath)) {
        console.log('ℹ️ Found it in the root "fee" folder instead');
    }
}

// Check other files
const files = [
    'Business course .pdf',
    'beauty.pdf',
    'peri.pdf'
];

files.forEach(f => {
    const p = path.join(__dirname_mock, 'backend', 'fee', f);
    console.log(`Checking ${f}: ${fs.existsSync(p) ? '✅' : '❌'}`);
});

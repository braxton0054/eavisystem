const fs = require('fs');
const path = require('path');

const files = [
    'public/admin/reporting-dates.html',
    'public/admin/reporting-dates.js'
];

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
            console.log(`✅ Deleted: ${file}`);
        } catch (err) {
            console.error(`❌ Error deleting ${file}:`, err.message);
        }
    } else {
        console.log(`ℹ️  File not found (already deleted): ${file}`);
    }
});

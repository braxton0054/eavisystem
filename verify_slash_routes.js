const http = require('http');

function testUrl(url) {
    return new Promise((resolve) => {
        http.get(url, (res) => {
            console.log(`[${res.statusCode}] ${url}`);
            resolve(res.statusCode);
        }).on('error', (e) => {
            console.error(`ERROR: ${url} - ${e.message}`);
            resolve(500);
        });
    });
}

const testId = 'EAVI/1009/2026';
const encodedId = encodeURIComponent(testId);
const urls = [
    `http://localhost:3000/api/twon/students/${encodedId}`,
    `http://localhost:3000/api/twon/students/download/${encodedId}`,
    `http://localhost:3000/api/twon/students/${testId}`,
    `http://localhost:3000/api/twon/students/download/${testId}`
];

(async () => {
    console.log('Starting verification...');
    for (const url of urls) {
        await testUrl(url);
    }
    console.log('Verification finished.');
})();

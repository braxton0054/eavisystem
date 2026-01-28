const http = require('http');
const fs = require('fs');

const filename = encodeURIComponent('health services support .pdf');
const url = `http://localhost:3000/api/west/fees/download/${filename}`;

console.log('Requesting URL:', url);

http.get(url, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);

    if (res.statusCode === 200) {
        console.log('✅ Successfully reached endpoint');
        if (res.headers['content-type'] === 'application/pdf') {
            console.log('✅ Content-Type is application/pdf');
        } else {
            console.log('❌ Incorrect Content-Type:', res.headers['content-type']);
        }

        // Don't need to download the whole thing, just check start
        res.on('data', (chunk) => {
            if (chunk.toString('ascii', 0, 4) === '%PDF') {
                console.log('✅ PDF signature found in data');
            } else {
                console.log('❌ Invalid PDF signature');
            }
            // Close connection
            res.destroy();
            process.exit(0);
        });
    } else {
        console.log('❌ Request failed');
        process.exit(1);
    }
}).on('error', (e) => {
    console.error('❌ Error testing endpoint:', e.message);
    process.exit(1);
});

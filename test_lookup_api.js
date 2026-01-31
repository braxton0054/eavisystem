const http = require('http');

async function testLookup() {
    const campus = 'west';
    const phone = '0728249135';
    const url = `http://localhost:3000/api/${campus}/students/lookup/phone?phone=${phone}`;

    console.log(`Testing Lookup API: ${url}`);

    http.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('Status Code:', res.statusCode);
            console.log('Response Body:', data);
        });
    }).on('error', err => {
        console.error('Error:', err.message);
    });
}

testLookup();

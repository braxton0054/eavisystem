const http = require('http');

function testEndpoint(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        console.log(`\nEndpoint ${path}: SUCCESS`);
                        console.log(`Status Code: ${res.statusCode}`);
                        console.log(`Found ${json.data ? json.data.length : 0} items`);
                        if (json.data && json.data.length > 0) {
                            const depts = new Set(json.data.map(c => c.department || 'Unknown'));
                            console.log(`Departments: ${Array.from(depts).join(', ')}`);
                        }
                        resolve(json);
                    } catch (e) {
                        console.log(`\nEndpoint ${path}: JSON Parse Error`);
                        reject(e);
                    }
                } else {
                    console.log(`\nEndpoint ${path}: FAILED (Status ${res.statusCode})`);
                    console.log(`Data: ${data}`);
                    resolve(null);
                }
            });
        });

        req.on('error', (e) => {
            console.error(`\nError testing ${path}:`, e.message);
            resolve(null);
        });

        req.end();
    });
}

async function runTests() {
    await testEndpoint('/api/twon/courses');
    await testEndpoint('/api/west/courses');
}

runTests();

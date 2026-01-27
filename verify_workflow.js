const http = require('http');

async function testRegistration() {
    const postData = JSON.stringify({
        full_name: 'Workflow Test Student',
        email: 'test@example.com',
        phone_number: '0700000000',
        date_of_birth: '2000-01-01',
        location: 'Test Location',
        course_id: 1,
        kcse_grade: 'B'
    });

    const options = {
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/twon/registration/register',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', async () => {
                const result = JSON.parse(data);
                console.log('Registration Result:', JSON.stringify(result, null, 2));

                if (result.success) {
                    // Check student details to verify status and department
                    await verifyStudent(result.data.admission_number);
                }
                resolve();
            });
        });
        req.write(postData);
        req.end();
    });
}

async function verifyStudent(admissionNumber) {
    const options = {
        hostname: '127.0.0.1',
        port: 3000,
        path: `/api/twon/students/${admissionNumber}`,
        method: 'GET',
        headers: {
            'Authorization': 'Bearer mock_token_admin'
        }
    };

    return new Promise((resolve) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const result = JSON.parse(data);
                console.log('Student Details Result:', JSON.stringify(result, null, 2));
                resolve();
            });
        });
        req.end();
    });
}

testRegistration();

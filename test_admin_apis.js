const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';
const campus = 'west';

async function testAPIs() {
    console.log('=== Testing Admin API Endpoints ===\n');

    // Test 1: Departments
    console.log('1. Testing GET /api/:campus/departments');
    try {
        const res = await fetch(`${API_BASE}/${campus}/departments`);
        console.log(`   Status: ${res.status}`);
        const data = await res.json();
        console.log(`   Response:`, JSON.stringify(data, null, 2));
    } catch (err) {
        console.log(`   ERROR:`, err.message);
    }

    console.log('\n2. Testing GET /api/:campus/courses');
    try {
        const res = await fetch(`${API_BASE}/${campus}/courses`);
        console.log(`   Status: ${res.status}`);
        const data = await res.json();
        console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 500));
    } catch (err) {
        console.log(`   ERROR:`, err.message);
    }

    console.log('\n3. Testing GET /api/:campus/students');
    try {
        const res = await fetch(`${API_BASE}/${campus}/students?page=1&limit=5`);
        console.log(`   Status: ${res.status}`);
        const data = await res.json();
        console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 500));
    } catch (err) {
        console.log(`   ERROR:`, err.message);
    }

    console.log('\n4. Testing GET /api/:campus/fees');
    try {
        const res = await fetch(`${API_BASE}/${campus}/fees`);
        console.log(`   Status: ${res.status}`);
        const data = await res.json();
        console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 500));
    } catch (err) {
        console.log(`   ERROR:`, err.message);
    }
}

testAPIs().catch(console.error);

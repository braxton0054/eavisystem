const fetch = require('node-fetch');

async function testIntakeApi() {
    const campus = 'west'; // Assuming 'west' is a valid campus param mapped in server
    // Note: server.js usually maps 'west' to process.env.WEST_DB_URL, but let's check how it handles params.
    // The route is /api/:campus/intake-dates.
    // Common issue: Authentication middleware might be blocking it if not carefully placed, or route ordering.

    // I need to know the port. server.js said 3000.
    const url = `http://localhost:3000/api/${campus}/intake-dates`;

    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log('Body:', text);
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

testIntakeApi();

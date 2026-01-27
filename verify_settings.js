const fetch = require('node-fetch');

async function testValidation() {
    const campus = 'west';
    const baseUrl = `http://localhost:3000/api/${campus}/settings`;

    console.log('--- Testing Settings Validation ---');

    // 1. Test past reporting date
    console.log('\n1. Testing past reporting date:');
    try {
        const res = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admission_number_format: 'WEST-2025-{seq}',
                admission_starting_number: 9999, // High enough to avoid sequence error
                reporting_date_term1: '2023-01-01' // PAST
            })
        });
        const data = await res.json();
        console.log('Result:', res.status, data);
    } catch (e) {
        console.log('Error (likely server not running):', e.message);
    }

    // 2. Test weekend reporting date
    console.log('\n2. Testing weekend reporting date (2026-02-01 is Sunday):');
    try {
        const res = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admission_number_format: 'WEST-2025-{seq}',
                admission_starting_number: 9999,
                reporting_date_term1: '2026-02-01' // SUNDAY
            })
        });
        const data = await res.json();
        console.log('Result:', res.status, data);
    } catch (e) { }

    // 3. Test lower starting number
    console.log('\n3. Testing lower starting number (assuming current is > 100):');
    try {
        const res = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                admission_number_format: 'WEST-2025-{seq}',
                admission_starting_number: 10, // VERY LOW
                reporting_date_term1: '2026-02-02' // VALID MONDAY
            })
        });
        const data = await res.json();
        console.log('Result:', res.status, data);
    } catch (e) { }
}

testValidation();

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function verifyAPI() {
    const campuses = ['twon', 'west'];
    const baseUrl = 'http://localhost:3000';

    for (const campus of campuses) {
        console.log(`\n--- Testing ${campus.toUpperCase()} ---`);
        try {
            const res = await fetch(`${baseUrl}/api/${campus}/courses`);
            if (res.ok) {
                const json = await res.json();
                console.log(`Courses API search: SUCCESS`);
                console.log(`Found ${json.data ? json.data.length : 0} courses`);
                if (json.data && json.data.length > 0) {
                    const depts = new Set(json.data.map(c => c.department));
                    console.log(`Departments available: ${Array.from(depts).join(', ')}`);
                }
            } else {
                console.error(`Courses API search: FAILED (Status ${res.status})`);
            }
        } catch (error) {
            console.error(`Error testing ${campus}:`, error.message);
            console.log('Is the server running? Run `node server.js` in a separate terminal.');
        }
    }
}

verifyAPI();

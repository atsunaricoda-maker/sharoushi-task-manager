// Test script to simulate the subsidies creation POST request
// This helps debug the 500 error without needing the full frontend

const testData = {
    subsidy_name: "テスト助成金",
    client_id: "1", // This comes from FormData so it's a string
    expected_amount: "100000",
    deadline_date: "2024-01-31",
    status: "preparing",
    notes: "テスト申請です"
};

console.log('Testing POST /api/subsidies/applications with data:', testData);

// Test both local dev server and deployed version
const testEndpoints = [
    'http://localhost:8788/api/subsidies/applications',
    'https://sharoushi-task-manager.pages.dev/api/subsidies/applications'
];

async function testCreation(url) {
    try {
        console.log(`\n🔧 Testing endpoint: ${url}`);
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Using proper emergency auth token
                'Authorization': 'Bearer eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzU4NzEzMzU4LCJlbWVyZ2VuY3lBdXRoIjp0cnVlfQ'
            },
            body: JSON.stringify(testData)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);
        
        const responseText = await response.text();
        console.log('Response body:', responseText);
        
        if (response.status === 500) {
            console.error('❌ 500 Error occurred');
        } else if (response.ok) {
            console.log('✅ Request successful');
        } else {
            console.log('⚠️  Non-500 error:', response.status);
        }
        
    } catch (error) {
        console.error('❌ Network/fetch error:', error.message);
    }
}

// Test local development server first
testCreation(testEndpoints[0]).then(() => {
    console.log('\n=== LOCAL TEST COMPLETE ===');
    console.log('Now testing deployed version...\n');
    // Then test deployed version
    return testCreation(testEndpoints[1]);
}).then(() => {
    console.log('\n=== ALL TESTS COMPLETE ===');
}).catch(error => {
    console.error('Test failed:', error);
});
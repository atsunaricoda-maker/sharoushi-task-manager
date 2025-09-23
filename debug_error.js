// Debug script to get detailed error information from the 500 response
// This will help us see the actual error message from the server

async function debugPOSTError() {
    try {
        console.log('🔧 Testing POST endpoint with sample data...');
        
        // Sample data similar to what the frontend would send
        const testData = {
            subsidy_name: "テスト助成金",
            client_id: "1", // FormData sends as string
            expected_amount: "100000", // FormData sends as string
            deadline_date: "2024-12-31",
            status: "preparing",
            notes: "テスト用の申請です"
        };
        
        console.log('📤 Sending data:', testData);
        
        const response = await fetch('https://sharoushi-task-manager.pages.dev/api/subsidies/applications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Try without auth first to see if that's the issue
            },
            body: JSON.stringify(testData)
        });
        
        console.log('📥 Response Status:', response.status);
        console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));
        
        let responseBody;
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
            responseBody = await response.json();
            console.log('📥 JSON Response Body:', JSON.stringify(responseBody, null, 2));
        } else {
            responseBody = await response.text();
            console.log('📥 Text Response Body:', responseBody);
        }
        
        if (response.status === 500) {
            console.error('❌ 500 Error Details:');
            console.error('   - Error Message:', responseBody.error || 'No error message');
            console.error('   - Debug Info:', responseBody.debug || 'No debug info');
            console.error('   - Stack Trace:', responseBody.stack || 'No stack trace');
        }
        
    } catch (error) {
        console.error('❌ Network Error:', error.message);
        console.error('❌ Full Error:', error);
    }
}

// Also test with authentication to see difference
async function debugPOSTWithAuth() {
    try {
        console.log('\n🔧 Testing with authentication...');
        
        const testData = {
            subsidy_name: "テスト助成金認証付き",
            client_id: "1",
            expected_amount: "100000",
            deadline_date: "2024-12-31",
            status: "preparing",
            notes: "認証付きテスト"
        };
        
        const response = await fetch('https://sharoushi-task-manager.pages.dev/api/subsidies/applications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluIiwiZXhwIjoxNzU4NzEzMzU4LCJlbWVyZ2VuY3lBdXRoIjp0cnVlfQ'
            },
            body: JSON.stringify(testData)
        });
        
        console.log('📥 Auth Response Status:', response.status);
        
        const responseText = await response.text();
        console.log('📥 Auth Response Body:', responseText);
        
        if (response.status === 500) {
            try {
                const responseJson = JSON.parse(responseText);
                console.error('❌ 500 Error with Auth:');
                console.error('   - Error:', responseJson.error);
                console.error('   - Debug:', responseJson.debug);
                console.error('   - Stack:', responseJson.stack);
            } catch (parseError) {
                console.error('❌ Could not parse JSON response:', responseText);
            }
        }
        
    } catch (error) {
        console.error('❌ Auth Test Error:', error.message);
    }
}

// Run both tests
debugPOSTError().then(() => {
    return debugPOSTWithAuth();
}).then(() => {
    console.log('\n✅ Debug tests completed');
}).catch(error => {
    console.error('Debug script failed:', error);
});
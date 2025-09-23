// Test script to simulate the actual frontend form submission

async function testFrontendCreation() {
    console.log('🔧 Testing frontend-style application creation...');
    
    // First get a fresh auth token
    const authResponse = await fetch('https://sharoushi-task-manager.pages.dev/api/emergency-auth');
    const authData = await authResponse.json();
    console.log('Auth response:', authData);
    
    // Extract token from Set-Cookie header
    const setCookieHeader = authResponse.headers.get('set-cookie');
    let token = null;
    if (setCookieHeader) {
        const tokenMatch = setCookieHeader.match(/auth-token=([^;]+)/);
        if (tokenMatch) {
            token = decodeURIComponent(tokenMatch[1]);
        }
    }
    
    if (!token) {
        console.error('❌ Could not get auth token');
        return;
    }
    
    console.log('✅ Got auth token:', token.substring(0, 50) + '...');
    
    // Simulate FormData as sent by the frontend
    const formData = new FormData();
    formData.append('subsidy_name', 'フロントエンドテスト助成金');
    formData.append('client_id', '1');
    formData.append('expected_amount', '200000');
    formData.append('deadline_date', '2024-12-31');
    formData.append('status', 'preparing');
    formData.append('notes', 'フロントエンドからのテスト申請');
    
    // Convert FormData to Object (same as frontend does)
    const applicationData = Object.fromEntries(formData);
    console.log('📤 Application data:', applicationData);
    
    try {
        const response = await fetch('https://sharoushi-task-manager.pages.dev/api/subsidies/applications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `auth-token=${token}`
            },
            body: JSON.stringify(applicationData)
        });
        
        console.log('📥 Response status:', response.status);
        console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('📥 Response body:', responseText);
        
        if (response.ok) {
            const responseData = JSON.parse(responseText);
            console.log('✅ SUCCESS! Application created with ID:', responseData.id);
            console.log('✅ Message:', responseData.message);
            
            // Test retrieving the applications list
            console.log('\n🔧 Testing applications list retrieval...');
            const listResponse = await fetch('https://sharoushi-task-manager.pages.dev/api/subsidies/applications', {
                headers: {
                    'Cookie': `auth-token=${token}`
                }
            });
            
            const listText = await listResponse.text();
            console.log('📥 List response:', listText);
            
            if (listResponse.ok) {
                const listData = JSON.parse(listText);
                console.log('✅ Applications list retrieved:', listData.applications?.length, 'applications');
            }
            
        } else {
            try {
                const errorData = JSON.parse(responseText);
                console.error('❌ Application creation failed:');
                console.error('   Error:', errorData.error);
                console.error('   Debug:', errorData.debug);
                if (errorData.stack) {
                    console.error('   Stack:', errorData.stack.substring(0, 200) + '...');
                }
            } catch (parseError) {
                console.error('❌ Could not parse error response:', responseText);
            }
        }
        
    } catch (networkError) {
        console.error('❌ Network error:', networkError.message);
    }
}

// Also test with direct fetch to see raw behavior
async function testRawFetch() {
    console.log('\n🔧 Testing raw fetch behavior...');
    
    try {
        const response = await fetch('https://sharoushi-task-manager.pages.dev/api/subsidies/test', {
            method: 'GET'
        });
        
        console.log('Test endpoint status:', response.status);
        const testText = await response.text();
        console.log('Test endpoint response:', testText);
        
    } catch (error) {
        console.error('Raw fetch test failed:', error.message);
    }
}

// Run tests
testRawFetch().then(() => {
    console.log('\n' + '='.repeat(50));
    return testFrontendCreation();
}).then(() => {
    console.log('\n✅ All tests completed');
}).catch(error => {
    console.error('Test suite failed:', error);
});
// Get a proper auth token from the emergency auth endpoint

async function getEmergencyToken() {
    try {
        console.log('🔧 Getting emergency auth token...');
        
        const response = await fetch('https://sharoushi-task-manager.pages.dev/api/emergency-auth', {
            method: 'GET',
        });
        
        console.log('Status:', response.status);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('Response body:', responseText);
        
        // Check for token in Set-Cookie header
        const setCookieHeader = response.headers.get('set-cookie');
        console.log('Set-Cookie header:', setCookieHeader);
        
        if (setCookieHeader) {
            // Extract token from cookie
            const tokenMatch = setCookieHeader.match(/auth-token=([^;]+)/);
            if (tokenMatch) {
                const token = tokenMatch[1];
                console.log('✅ Extracted token:', token);
                return token;
            }
        }
        
        return null;
    } catch (error) {
        console.error('❌ Failed to get token:', error);
        return null;
    }
}

async function testWithValidToken() {
    const token = await getEmergencyToken();
    
    if (!token) {
        console.error('❌ Could not get valid token');
        return;
    }
    
    console.log('\n🔧 Testing POST with valid token...');
    
    const testData = {
        subsidy_name: "トークンテスト助成金",
        client_id: "1",
        expected_amount: "100000",
        deadline_date: "2024-12-31",
        status: "preparing",
        notes: "有効なトークンでのテスト"
    };
    
    try {
        const response = await fetch('https://sharoushi-task-manager.pages.dev/api/subsidies/applications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(testData)
        });
        
        console.log('📥 Response Status:', response.status);
        console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('📥 Response Body:', responseText);
        
        if (response.status === 500) {
            try {
                const errorData = JSON.parse(responseText);
                console.error('\n❌ 500 ERROR DETAILS:');
                console.error('Error:', errorData.error);
                console.error('Debug:', errorData.debug);
                console.error('Stack:', errorData.stack);
            } catch (parseError) {
                console.error('Could not parse error JSON:', responseText);
            }
        } else if (response.ok) {
            console.log('✅ Success! Application created');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testWithValidToken();
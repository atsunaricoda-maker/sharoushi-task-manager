// Test with properly decoded token

async function testWithDecodedToken() {
    // The token we got was URL encoded, let's decode it
    const encodedToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0%3D.eyJzdWIiOiIxIiwiZW1haWwiOiJ0YW5ha2FAc2hhcm91c2hpLmNvbSIsIm5hbWUiOiJUYW5ha2EgVGFybyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1ODYyNzI2OSwiZXhwIjoxNzU4NzEzNjY5fQ%3D%3D.";
    
    const decodedToken = decodeURIComponent(encodedToken);
    console.log('🔧 Original encoded token:', encodedToken);
    console.log('🔧 Decoded token:', decodedToken);
    
    const testData = {
        subsidy_name: "デコードトークンテスト",
        client_id: "1",
        expected_amount: "100000",
        deadline_date: "2024-12-31",
        status: "preparing",
        notes: "デコードされたトークンでのテスト"
    };
    
    console.log('📤 Testing with decoded token...');
    
    try {
        const response = await fetch('https://sharoushi-task-manager.pages.dev/api/subsidies/applications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${decodedToken}`
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
                console.error('Error:', errorData.error || 'No error message');
                console.error('Debug:', errorData.debug || 'No debug info');
                console.error('Stack:', errorData.stack || 'No stack trace');
            } catch (parseError) {
                console.error('❌ Could not parse error JSON. Raw response:', responseText);
            }
        } else if (response.status === 401) {
            console.error('❌ Still getting 401 - authentication issue');
            try {
                const errorData = JSON.parse(responseText);
                console.error('Auth error:', errorData.error);
                console.error('Auth message:', errorData.message);
            } catch (parseError) {
                console.error('Auth error response:', responseText);
            }
        } else if (response.ok) {
            console.log('✅ Success! Application created');
            try {
                const successData = JSON.parse(responseText);
                console.log('Success data:', successData);
            } catch (parseError) {
                console.log('Success response:', responseText);
            }
        }
        
    } catch (error) {
        console.error('❌ Network error:', error);
    }
}

// Also test with Cookie instead of Authorization header
async function testWithCookie() {
    console.log('\n🔧 Testing with Cookie header...');
    
    const decodedToken = decodeURIComponent("eyJ0eXAiOiJKV1QiLCJhbGciOiJub25lIn0%3D.eyJzdWIiOiIxIiwiZW1haWwiOiJ0YW5ha2FAc2hhcm91c2hpLmNvbSIsIm5hbWUiOiJUYW5ha2EgVGFybyIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1ODYyNzI2OSwiZXhwIjoxNzU4NzEzNjY5fQ%3D%3D.");
    
    const testData = {
        subsidy_name: "Cookieテスト助成金",
        client_id: "1",
        expected_amount: "100000",
        deadline_date: "2024-12-31",
        status: "preparing",
        notes: "Cookieヘッダーでのテスト"
    };
    
    try {
        const response = await fetch('https://sharoushi-task-manager.pages.dev/api/subsidies/applications', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `auth-token=${decodedToken}`
            },
            body: JSON.stringify(testData)
        });
        
        console.log('📥 Cookie Response Status:', response.status);
        const responseText = await response.text();
        console.log('📥 Cookie Response Body:', responseText);
        
        if (response.status === 500) {
            try {
                const errorData = JSON.parse(responseText);
                console.error('\n🎯 FOUND THE 500 ERROR WITH COOKIE!');
                console.error('Error:', errorData.error);
                console.error('Debug:', errorData.debug);
                console.error('Stack:', errorData.stack);
            } catch (parseError) {
                console.error('Could not parse 500 error:', responseText);
            }
        }
        
    } catch (error) {
        console.error('❌ Cookie test error:', error);
    }
}

// Run both tests
testWithDecodedToken().then(() => {
    return testWithCookie();
}).then(() => {
    console.log('\n✅ All token tests completed');
}).catch(error => {
    console.error('Token test failed:', error);
});
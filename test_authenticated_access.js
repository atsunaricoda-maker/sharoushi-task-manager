// Test script to access pages with proper authentication

async function testAuthenticatedAccess() {
    try {
        console.log('🔧 Step 1: Getting emergency auth token...');
        
        // Get emergency auth token first
        const authResponse = await fetch('https://sharoushi-task-manager.pages.dev/api/emergency-auth');
        console.log('Auth response:', authResponse.status, authResponse.statusText);
        
        if (!authResponse.ok) {
            console.error('❌ Emergency auth failed');
            return;
        }
        
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
            console.error('❌ Could not extract auth token');
            return;
        }
        
        console.log('✅ Got auth token:', token.substring(0, 50) + '...');
        
        // Test accessing the business page with authentication
        console.log('🔧 Step 2: Accessing business page...');
        const businessResponse = await fetch('https://sharoushi-task-manager.pages.dev/business', {
            headers: {
                'Cookie': `auth-token=${token}`
            }
        });
        
        console.log('Business response:', businessResponse.status, businessResponse.url);
        
        if (businessResponse.ok) {
            const businessText = await businessResponse.text();
            console.log('✅ Business page loaded successfully');
            
            // Look for JavaScript errors in the content
            if (businessText.includes('Cannot set properties of null')) {
                console.log('❌ Found null property error in page content');
            }
            
            // Check if the page contains the expected elements
            if (businessText.includes('今日やることリスト')) {
                console.log('✅ Found "今日やることリスト" section');
                
                // Look for specific JavaScript that might be causing errors
                const lines = businessText.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    if (line.includes('.value =') && !line.includes('null')) {
                        console.log(`Line ${i + 1}: ${line.trim()}`);
                    }
                }
            }
        } else {
            console.error('❌ Failed to access business page');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testAuthenticatedAccess();
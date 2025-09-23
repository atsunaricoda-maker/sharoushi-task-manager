#!/usr/bin/env node

// Test script to debug contact creation and UI issues

const baseUrl = 'https://5176-iy1thkrci6m3pdaa9ne9m-6532622b.e2b.dev';

async function testContactIssues() {
  console.log('🧪 Testing Contact Management Issues');
  console.log('Base URL:', baseUrl);
  
  try {
    // Test 1: Check if emergency auth works
    console.log('\n1. Testing emergency authentication...');
    const authResponse = await fetch(`${baseUrl}/api/emergency-auth`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!authResponse.ok) {
      console.error('❌ Emergency auth failed:', authResponse.status, authResponse.statusText);
      return;
    }
    
    const authData = await authResponse.json();
    console.log('✅ Emergency auth successful:', authData.message);
    
    // Extract auth token from response headers or cookies
    const cookies = authResponse.headers.get('set-cookie') || '';
    const authToken = cookies.match(/auth-token=([^;]+)/)?.[1];
    
    if (!authToken) {
      console.error('❌ No auth token found in response');
      return;
    }
    
    console.log('✅ Auth token extracted');
    
    // Test 2: Check database table status
    console.log('\n2. Checking client_contacts table status...');
    const tableStatusResponse = await fetch(`${baseUrl}/api/contacts/table-status`, {
      method: 'GET',
      headers: {
        'Cookie': `auth-token=${authToken}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    if (tableStatusResponse.ok) {
      const tableData = await tableStatusResponse.json();
      console.log('✅ Table status check successful:', tableData);
    } else {
      console.log('⚠️  Table status check failed:', tableStatusResponse.status);
    }
    
    // Test 3: Try database initialization
    console.log('\n3. Testing database initialization...');
    const initResponse = await fetch(`${baseUrl}/api/public/init-db`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (initResponse.ok) {
      const initData = await initResponse.json();
      console.log('✅ Database initialization successful:', initData);
    } else {
      const initError = await initResponse.text();
      console.log('❌ Database initialization failed:', initResponse.status, initError);
    }
    
    // Test 4: Try to create a test contact
    console.log('\n4. Testing contact creation...');
    const testContactData = {
      client_id: 1, // Assuming client with ID 1 exists
      contact_type: 'phone',
      subject: 'Test Contact - Debug',
      notes: 'This is a test contact to debug the 500 error issue',
      contact_date: new Date().toISOString()
    };
    
    const contactResponse = await fetch(`${baseUrl}/api/contacts`, {
      method: 'POST',
      headers: {
        'Cookie': `auth-token=${authToken}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(testContactData)
    });
    
    console.log('Contact creation response status:', contactResponse.status);
    
    if (contactResponse.ok) {
      const contactResult = await contactResponse.json();
      console.log('✅ Contact creation successful:', contactResult);
    } else {
      const contactError = await contactResponse.json().catch(() => contactResponse.text());
      console.log('❌ Contact creation failed:', contactResponse.status, contactError);
      
      // Check if data was actually saved despite the error
      if (contactResponse.status === 500) {
        console.log('\n🔍 Checking if contact was saved despite 500 error...');
        // We would need a way to verify this, but this demonstrates the issue
      }
    }
    
    // Test 5: Test accessing the clients page to see UI
    console.log('\n5. Testing clients page access...');
    const clientsPageResponse = await fetch(`${baseUrl}/clients`, {
      method: 'GET',
      headers: {
        'Cookie': `auth-token=${authToken}`
      },
      credentials: 'include'
    });
    
    if (clientsPageResponse.ok) {
      const clientsHtml = await clientsPageResponse.text();
      console.log('✅ Clients page accessible');
      
      // Check if DB initialization button is in the HTML
      if (clientsHtml.includes('DB初期化')) {
        console.log('✅ DB initialization button found in HTML');
      } else {
        console.log('❌ DB initialization button NOT found in HTML');
      }
      
      if (clientsHtml.includes('initializeDatabase()')) {
        console.log('✅ initializeDatabase() function found in HTML');
      } else {
        console.log('❌ initializeDatabase() function NOT found in HTML');
      }
    } else {
      console.log('❌ Clients page access failed:', clientsPageResponse.status);
    }
    
  } catch (error) {
    console.error('🚨 Test failed with error:', error.message);
  }
}

// Run the test
testContactIssues();
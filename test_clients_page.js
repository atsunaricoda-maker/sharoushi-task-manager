#!/usr/bin/env node

// Test script to check clients page access

const baseUrl = 'https://5176-iy1thkrci6m3pdaa9ne9m-6532622b.e2b.dev';

async function testClientsPage() {
  console.log('🧪 Testing Clients Page Access');
  
  try {
    // Get auth token first
    console.log('\n1. Getting auth token...');
    const authResponse = await fetch(`${baseUrl}/api/emergency-auth`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!authResponse.ok) {
      console.error('❌ Auth failed:', authResponse.status);
      return;
    }
    
    const cookies = authResponse.headers.get('set-cookie') || '';
    const authToken = cookies.match(/auth-token=([^;]+)/)?.[1];
    console.log('✅ Auth token obtained');
    
    // Test clients page
    console.log('\n2. Testing clients page...');
    const clientsResponse = await fetch(`${baseUrl}/clients`, {
      method: 'GET',
      headers: {
        'Cookie': `auth-token=${authToken}`
      },
      credentials: 'include'
    });
    
    console.log('Clients page status:', clientsResponse.status);
    
    if (clientsResponse.ok) {
      const html = await clientsResponse.text();
      console.log('✅ Clients page accessible');
      
      // Check for key elements
      if (html.includes('DB初期化')) {
        console.log('✅ DB initialization button found in HTML');
      } else {
        console.log('❌ DB initialization button NOT found');
      }
      
      if (html.includes('initializeDatabase')) {
        console.log('✅ initializeDatabase function found');
      } else {
        console.log('❌ initializeDatabase function NOT found');
      }
      
      // Test API clients endpoint
      console.log('\n3. Testing API clients endpoint...');
      const apiResponse = await fetch(`${baseUrl}/api/clients`, {
        method: 'GET',
        headers: {
          'Cookie': `auth-token=${authToken}`
        },
        credentials: 'include'
      });
      
      if (apiResponse.ok) {
        const clientsData = await apiResponse.json();
        console.log('✅ API clients endpoint working');
        console.log('Clients found:', clientsData.clients?.length || 0);
      } else {
        const apiError = await apiResponse.text();
        console.log('❌ API clients endpoint failed:', apiResponse.status, apiError);
      }
      
    } else {
      const error = await clientsResponse.text();
      console.log('❌ Clients page failed:', clientsResponse.status);
      console.log('Error details:', error.substring(0, 200));
    }
    
  } catch (error) {
    console.error('🚨 Test failed:', error.message);
  }
}

testClientsPage();
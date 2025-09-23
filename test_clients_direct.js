#!/usr/bin/env node

// 顧問先ページの直接テスト

const prodUrl = 'https://sharoushi-task-manager.pages.dev';

async function testClientsDirectly() {
  console.log('🔍 顧問先ページを直接テスト...');
  
  try {
    // 1. リダイレクトを追跡しながら /clients にアクセス
    console.log('\n=== 1. /clients ページ直接アクセス ===');
    const response = await fetch(`${prodUrl}/clients`, {
      redirect: 'manual'  // リダイレクトを手動で処理
    });
    
    console.log('レスポンス:', response.status, response.statusText);
    
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      console.log('リダイレクト先:', location);
      
      if (location) {
        // リダイレクト先にアクセス
        const redirectUrl = location.startsWith('http') ? location : `${prodUrl}${location}`;
        console.log('リダイレクト先にアクセス:', redirectUrl);
        
        const redirectResponse = await fetch(redirectUrl, {
          redirect: 'manual'
        });
        console.log('リダイレクト先レスポンス:', redirectResponse.status, redirectResponse.statusText);
        
        if (redirectResponse.status >= 300 && redirectResponse.status < 400) {
          const finalLocation = redirectResponse.headers.get('location');
          console.log('最終リダイレクト先:', finalLocation);
        }
      }
    } else if (response.ok) {
      console.log('✅ /clients ページが直接アクセス可能');
      const html = await response.text();
      
      // HTML内容を確認
      const hasDbButton = html.includes('DB初期化');
      const hasContactForm = html.includes('連絡記録を追加');
      console.log('DB初期化ボタン:', hasDbButton ? '✅ 存在' : '❌ なし');
      console.log('連絡フォーム:', hasContactForm ? '✅ 存在' : '❌ なし');
    }
    
    // 2. 緊急認証でCookieを設定してから再アクセス
    console.log('\n=== 2. 緊急認証後のアクセス ===');
    const authResponse = await fetch(`${prodUrl}/api/emergency-auth`);
    if (authResponse.ok) {
      const cookies = authResponse.headers.get('set-cookie') || '';
      console.log('認証Cookie取得:', cookies ? '✅' : '❌');
      
      if (cookies) {
        // Cookieを使って再度アクセス
        const authenticatedResponse = await fetch(`${prodUrl}/clients`, {
          headers: {
            'Cookie': cookies
          }
        });
        
        console.log('認証後アクセス:', authenticatedResponse.status, authenticatedResponse.statusText);
        
        if (authenticatedResponse.ok) {
          const html = await authenticatedResponse.text();
          const hasDbButton = html.includes('DB初期化');
          const hasContactForm = html.includes('連絡記録を追加');
          console.log('✅ 認証後アクセス成功');
          console.log('DB初期化ボタン:', hasDbButton ? '✅ 存在' : '❌ なし');
          console.log('連絡フォーム:', hasContactForm ? '✅ 存在' : '❌ なし');
        }
      }
    }
    
    // 3. デバッグページも確認
    console.log('\n=== 3. デバッグページ確認 ===');
    const debugResponse = await fetch(`${prodUrl}/clients-debug`);
    console.log('デバッグページ:', debugResponse.status, debugResponse.statusText);
    
    if (debugResponse.ok) {
      const html = await debugResponse.text();
      const hasDbButton = html.includes('DB初期化');
      console.log('✅ デバッグページアクセス成功');
      console.log('DB初期化ボタン:', hasDbButton ? '✅ 存在' : '❌ なし');
    }
    
  } catch (error) {
    console.error('🚨 テスト中にエラー:', error.message);
  }
}

testClientsDirectly();
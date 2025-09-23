#!/usr/bin/env node

// 最終修正のテスト

const baseUrl = 'https://5173-iy1thkrci6m3pdaa9ne9m-6532622b.e2b.dev';

async function testFinalFix() {
  console.log('🔍 最終修正をテスト中...');
  console.log('Base URL:', baseUrl);
  
  try {
    // 1. データベース初期化
    console.log('\n=== 1. データベース初期化 ===');
    const initResponse = await fetch(`${baseUrl}/api/public/init-db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('DB初期化:', initResponse.status);
    const initData = await initResponse.json();
    console.log('結果:', initData.message);
    
    // 2. 顧問先ページアクセス（認証なし）
    console.log('\n=== 2. 顧問先ページアクセステスト ===');
    const pageResponse = await fetch(`${baseUrl}/clients`);
    
    console.log('顧問先ページ:', pageResponse.status);
    if (pageResponse.ok) {
      const html = await pageResponse.text();
      console.log('✅ 顧問先ページアクセス成功');
      
      // 重要な要素をチェック
      const hasDbButton = html.includes('DB初期化');
      const hasContactForm = html.includes('addContactForm');
      const hasInitFunction = html.includes('initializeDatabase');
      
      console.log('\n--- 要素確認 ---');
      console.log('DB初期化ボタン:', hasDbButton ? '✅ 存在' : '❌ なし');
      console.log('連絡フォーム:', hasContactForm ? '✅ 存在' : '❌ なし');
      console.log('初期化関数:', hasInitFunction ? '✅ 存在' : '❌ なし');
      
    } else {
      console.log('❌ 顧問先ページアクセス失敗:', pageResponse.status);
    }
    
    // 3. デバッグページも試す
    console.log('\n=== 3. デバッグページテスト ===');
    const debugResponse = await fetch(`${baseUrl}/clients-debug`);
    console.log('デバッグページ:', debugResponse.status);
    
    // 4. 緊急認証でAPIテスト
    console.log('\n=== 4. API機能テスト ===');
    const authResponse = await fetch(`${baseUrl}/api/emergency-auth`);
    if (authResponse.ok) {
      const cookies = authResponse.headers.get('set-cookie') || '';
      const authToken = cookies.match(/auth-token=([^;]+)/)?.[1];
      
      if (authToken) {
        // 連絡記録作成テスト
        const contactData = {
          client_id: 1,
          contact_type: 'phone',
          subject: '最終テスト連絡',
          notes: '修正後の動作確認テスト',
          contact_date: new Date().toISOString()
        };
        
        const contactResponse = await fetch(`${baseUrl}/api/contacts`, {
          method: 'POST',
          headers: {
            'Cookie': `auth-token=${authToken}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(contactData)
        });
        
        console.log('連絡記録作成:', contactResponse.status);
        if (contactResponse.ok) {
          const result = await contactResponse.json();
          console.log('✅ 連絡記録作成成功:', result.message);
        } else {
          const error = await contactResponse.json().catch(() => contactResponse.text());
          console.log('❌ 連絡記録作成失敗:', error);
        }
      }
    }
    
    console.log('\n=== テスト完了 ===');
    console.log('ブラウザでのテスト用URL:');
    console.log('- メインページ:', baseUrl + '/clients');
    console.log('- デバッグページ:', baseUrl + '/clients-debug');
    
  } catch (error) {
    console.error('🚨 テスト中にエラー:', error.message);
  }
}

testFinalFix();
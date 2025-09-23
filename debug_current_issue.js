#!/usr/bin/env node

// 現在の問題を詳細にデバッグするスクリプト

const baseUrl = 'https://5176-iy1thkrci6m3pdaa9ne9m-6532622b.e2b.dev';

async function debugCurrentIssue() {
  console.log('🔍 現在の問題を詳細デバッグ中...');
  console.log('Base URL:', baseUrl);
  
  try {
    // 1. 認証テスト
    console.log('\n=== 1. 認証テスト ===');
    const authResponse = await fetch(`${baseUrl}/api/emergency-auth`, {
      method: 'GET',
      credentials: 'include'
    });
    
    console.log('認証レスポンス:', authResponse.status, authResponse.statusText);
    
    if (!authResponse.ok) {
      console.error('❌ 認証失敗');
      return;
    }
    
    const authData = await authResponse.json();
    console.log('✅ 認証成功:', authData);
    
    const cookies = authResponse.headers.get('set-cookie') || '';
    const authToken = cookies.match(/auth-token=([^;]+)/)?.[1];
    
    if (!authToken) {
      console.error('❌ 認証トークンが見つかりません');
      return;
    }
    
    console.log('✅ 認証トークン取得済み');
    
    // 2. データベース初期化テスト  
    console.log('\n=== 2. データベース初期化テスト ===');
    const initResponse = await fetch(`${baseUrl}/api/public/init-db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('DB初期化レスポンス:', initResponse.status);
    const initData = await initResponse.json();
    console.log('DB初期化結果:', initData);
    
    // 3. 顧問先一覧API テスト
    console.log('\n=== 3. 顧問先一覧API テスト ===');
    const clientsApiResponse = await fetch(`${baseUrl}/api/clients`, {
      method: 'GET',
      headers: { 'Cookie': `auth-token=${authToken}` },
      credentials: 'include'
    });
    
    console.log('顧問先APIレスポンス:', clientsApiResponse.status);
    if (clientsApiResponse.ok) {
      const clientsData = await clientsApiResponse.json();
      console.log('顧問先データ:', clientsData);
    } else {
      const apiError = await clientsApiResponse.text();
      console.log('顧問先APIエラー:', apiError);
    }
    
    // 4. 顧問先ページテスト
    console.log('\n=== 4. 顧問先ページテスト ===');
    const pageResponse = await fetch(`${baseUrl}/clients`, {
      method: 'GET',
      headers: { 'Cookie': `auth-token=${authToken}` },
      credentials: 'include'
    });
    
    console.log('顧問先ページレスポンス:', pageResponse.status);
    if (pageResponse.ok) {
      const html = await pageResponse.text();
      console.log('✅ 顧問先ページ読み込み成功');
      
      // HTMLの重要な部分をチェック
      const hasDbInitButton = html.includes('DB初期化');
      const hasInitFunction = html.includes('initializeDatabase');
      const hasContactForm = html.includes('addContactForm');
      
      console.log('\n--- HTMLコンテンツ確認 ---');
      console.log('DB初期化ボタンあり:', hasDbInitButton ? '✅' : '❌');
      console.log('初期化関数あり:', hasInitFunction ? '✅' : '❌');
      console.log('連絡フォームあり:', hasContactForm ? '✅' : '❌');
      
      // もし要素が見つからない場合、HTMLの一部を表示
      if (!hasDbInitButton) {
        console.log('\n--- DB初期化ボタン周辺のHTML ---');
        const buttonArea = html.match(/.{200}連絡履歴.{200}/s);
        if (buttonArea) {
          console.log(buttonArea[0]);
        } else {
          console.log('「連絡履歴」テキストが見つかりません');
        }
      }
    } else {
      const pageError = await pageResponse.text();
      console.log('顧問先ページエラー:', pageResponse.status, pageError.substring(0, 500));
    }
    
    // 5. 連絡記録作成テスト
    console.log('\n=== 5. 連絡記録作成テスト ===');
    const testContactData = {
      client_id: 1,
      contact_type: 'phone',
      subject: 'テスト連絡記録',
      notes: 'これは問題デバッグ用のテスト連絡記録です',
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
    
    console.log('連絡記録作成レスポンス:', contactResponse.status);
    if (contactResponse.ok) {
      const contactResult = await contactResponse.json();
      console.log('✅ 連絡記録作成成功:', contactResult);
    } else {
      const contactError = await contactResponse.json().catch(() => contactResponse.text());
      console.log('❌ 連絡記録作成失敗:', contactResponse.status, contactError);
    }
    
  } catch (error) {
    console.error('🚨 デバッグ中にエラー発生:', error.message);
  }
}

debugCurrentIssue();
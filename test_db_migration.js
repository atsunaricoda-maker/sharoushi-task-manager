#!/usr/bin/env node

// 本番環境でデータベースマイグレーションをテスト

const prodUrl = 'https://sharoushi-task-manager.pages.dev';

async function testDatabaseMigration() {
  console.log('🔧 本番環境でデータベースマイグレーションを実行...');
  
  try {
    // 1. 現在のデータベースの状態を確認
    console.log('\n=== 1. マイグレーション前の状態確認 ===');
    
    // 2. データベース初期化（マイグレーション）を実行
    console.log('\n=== 2. データベースマイグレーション実行 ===');
    const migrationResponse = await fetch(`${prodUrl}/api/public/init-db`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('マイグレーション実行:', migrationResponse.status);
    
    if (migrationResponse.ok) {
      const migrationResult = await migrationResponse.json();
      console.log('✅ マイグレーション成功');
      console.log('実行結果:', migrationResult.results);
    } else {
      const migrationError = await migrationResponse.text();
      console.log('❌ マイグレーション失敗:', migrationError.substring(0, 500));
    }
    
    // 3. 認証を取得
    console.log('\n=== 3. 認証取得 ===');
    const authResponse = await fetch(`${prodUrl}/api/emergency-auth`);
    if (!authResponse.ok) {
      console.log('❌ 認証失敗');
      return;
    }
    
    const cookies = authResponse.headers.get('set-cookie') || '';
    const authToken = cookies.match(/auth-token=([^;]+)/)?.[1];
    
    if (!authToken) {
      console.log('❌ 認証トークン取得失敗');
      return;
    }
    
    console.log('✅ 認証トークン取得成功');
    
    // 4. 連絡記録作成をテスト（エラーが解決されたか確認）
    console.log('\n=== 4. 連絡記録作成テスト ===');
    const testContactData = {
      client_id: 1,
      contact_type: 'phone', 
      subject: 'マイグレーション後テスト',
      notes: 'データベーススキーマ修正後のテスト連絡記録です。last_contact_dateカラムのエラーが解決されているかを確認します。',
      contact_date: new Date().toISOString()
    };
    
    const contactResponse = await fetch(`${prodUrl}/api/contacts`, {
      method: 'POST',
      headers: {
        'Cookie': `auth-token=${authToken}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(testContactData)
    });
    
    console.log('連絡記録作成:', contactResponse.status);
    
    if (contactResponse.ok) {
      const contactResult = await contactResponse.json();
      console.log('✅ 連絡記録作成成功:', contactResult.message);
      console.log('作成された連絡記録ID:', contactResult.id);
    } else {
      const contactError = await contactResponse.json().catch(() => contactResponse.text());
      console.log('❌ 連絡記録作成失敗:', contactError);
      
      // エラーの詳細を確認
      if (typeof contactError === 'object' && contactError.details) {
        console.log('エラー詳細:', contactError.details);
        if (contactError.details.includes('last_contact_date')) {
          console.log('⚠️  まだlast_contact_dateのエラーが発生しています。追加の修正が必要です。');
        }
      }
    }
    
    // 5. 顧問先一覧を確認（last_contact_dateが正しく表示されるか）
    console.log('\n=== 5. 顧問先一覧確認 ===');
    const clientsResponse = await fetch(`${prodUrl}/api/clients`, {
      headers: { 'Cookie': `auth-token=${authToken}` },
      credentials: 'include'
    });
    
    if (clientsResponse.ok) {
      const clientsData = await clientsResponse.json();
      console.log('✅ 顧問先一覧取得成功');
      console.log('顧問先数:', clientsData.clients?.length || 0);
      
      if (clientsData.clients && clientsData.clients.length > 0) {
        const client = clientsData.clients[0];
        console.log('最初の顧問先:', client.name);
        console.log('最終連絡日:', client.last_contact_date || '未設定');
      }
    } else {
      console.log('❌ 顧問先一覧取得失敗:', clientsResponse.status);
    }
    
    console.log('\n=== マイグレーションテスト完了 ===');
    console.log('次のステップ:');
    console.log('1. ブラウザで https://sharoushi-task-manager.pages.dev/clients にアクセス');
    console.log('2. 顧問先をクリックして連絡記録追加を試す');
    console.log('3. エラーが出ないことを確認');
    
  } catch (error) {
    console.error('🚨 マイグレーションテスト中にエラー:', error.message);
  }
}

testDatabaseMigration();
#!/usr/bin/env node

// 本番環境のエラー状況を詳細に調査

const prodUrl = 'https://sharoushi-task-manager.pages.dev';

async function testProductionErrors() {
  console.log('🔍 本番環境のエラー状況を調査中...');
  console.log('Production URL:', prodUrl);
  
  const results = [];
  
  try {
    // 1. メインページのステータス確認
    console.log('\n=== 1. メインページ確認 ===');
    try {
      const mainResponse = await fetch(prodUrl);
      console.log('メインページ:', mainResponse.status, mainResponse.statusText);
      results.push({ endpoint: 'メインページ', status: mainResponse.status, success: mainResponse.ok });
      
      if (mainResponse.ok) {
        const html = await mainResponse.text();
        console.log('ページタイトル:', html.match(/<title>(.*?)<\/title>/)?.[1] || '不明');
      }
    } catch (error) {
      console.log('❌ メインページエラー:', error.message);
      results.push({ endpoint: 'メインページ', status: 'ERROR', success: false, error: error.message });
    }
    
    // 2. 緊急認証エンドポイント確認
    console.log('\n=== 2. 緊急認証エンドポイント確認 ===');
    try {
      const authResponse = await fetch(`${prodUrl}/api/emergency-auth`);
      console.log('緊急認証:', authResponse.status, authResponse.statusText);
      results.push({ endpoint: '緊急認証', status: authResponse.status, success: authResponse.ok });
      
      if (authResponse.ok) {
        const authData = await authResponse.json();
        console.log('認証レスポンス:', authData.message || 'OK');
      } else {
        const errorText = await authResponse.text();
        console.log('認証エラー内容:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ 緊急認証エラー:', error.message);
      results.push({ endpoint: '緊急認証', status: 'ERROR', success: false, error: error.message });
    }
    
    // 3. データベース初期化エンドポイント確認
    console.log('\n=== 3. データベース初期化確認 ===');
    try {
      const initResponse = await fetch(`${prodUrl}/api/public/init-db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('DB初期化:', initResponse.status, initResponse.statusText);
      results.push({ endpoint: 'DB初期化', status: initResponse.status, success: initResponse.ok });
      
      if (initResponse.ok) {
        const initData = await initResponse.json();
        console.log('DB初期化結果:', initData.message || 'OK');
      } else {
        const errorText = await initResponse.text();
        console.log('DB初期化エラー:', errorText.substring(0, 300));
      }
    } catch (error) {
      console.log('❌ DB初期化エラー:', error.message);
      results.push({ endpoint: 'DB初期化', status: 'ERROR', success: false, error: error.message });
    }
    
    // 4. 顧問先ページ確認
    console.log('\n=== 4. 顧問先ページ確認 ===');
    try {
      const clientsResponse = await fetch(`${prodUrl}/clients`);
      console.log('顧問先ページ:', clientsResponse.status, clientsResponse.statusText);
      results.push({ endpoint: '顧問先ページ', status: clientsResponse.status, success: clientsResponse.ok });
      
      if (!clientsResponse.ok) {
        const errorText = await clientsResponse.text();
        console.log('顧問先ページエラー:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ 顧問先ページエラー:', error.message);
      results.push({ endpoint: '顧問先ページ', status: 'ERROR', success: false, error: error.message });
    }
    
    // 5. その他の重要なエンドポイント
    const endpoints = [
      '/api/public/test',
      '/business', 
      '/dev-login',
      '/clients-debug'
    ];
    
    console.log('\n=== 5. その他のエンドポイント確認 ===');
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${prodUrl}${endpoint}`);
        console.log(`${endpoint}:`, response.status);
        results.push({ endpoint, status: response.status, success: response.ok });
      } catch (error) {
        console.log(`❌ ${endpoint}:`, error.message);
        results.push({ endpoint, status: 'ERROR', success: false, error: error.message });
      }
    }
    
    // 結果サマリー
    console.log('\n=== 結果サマリー ===');
    const errorCount = results.filter(r => !r.success).length;
    const totalCount = results.length;
    
    console.log(`総エンドポイント数: ${totalCount}`);
    console.log(`エラー数: ${errorCount}`);
    console.log(`成功率: ${Math.round((totalCount - errorCount) / totalCount * 100)}%`);
    
    if (errorCount > 0) {
      console.log('\n❌ エラーが発生しているエンドポイント:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`- ${r.endpoint}: ${r.status} ${r.error || ''}`);
      });
    }
    
    // 推奨される対処法
    console.log('\n=== 推奨される対処法 ===');
    if (errorCount === 0) {
      console.log('✅ 全エンドポイントが正常に動作しています');
    } else if (errorCount < totalCount / 2) {
      console.log('🔧 部分的なエラーが発生しています。特定のエンドポイントの修正が必要です');
    } else {
      console.log('🚨 深刻なエラーが発生しています。全体的な見直しが必要です');
    }
    
  } catch (error) {
    console.error('🚨 調査中に予期しないエラー:', error.message);
  }
}

testProductionErrors();
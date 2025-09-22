#!/usr/bin/env node

/**
 * Database Structure Verification Script
 * このスクリプトはローカル環境で助成金システムのデータベース構造を確認します
 */

const axios = require('axios');

async function checkDatabaseStructure() {
  console.log('🔍 助成金システムのデータベース構造を確認中...\n');
  
  try {
    // Health check endpoint to verify database connectivity
    console.log('1️⃣ データベース接続確認...');
    const healthResponse = await axios.get('http://localhost:8787/api/health');
    
    if (healthResponse.data.database === 'connected') {
      console.log('   ✅ データベース接続: 正常');
    } else {
      console.log('   ❌ データベース接続: 異常');
      return;
    }
    
    // Check if subsidies table has data
    console.log('\n2️⃣ 助成金マスターデータ確認...');
    try {
      const subsidiesResponse = await axios.get('http://localhost:8787/api/subsidies/master?limit=5');
      
      if (subsidiesResponse.data.success) {
        const subsidies = subsidiesResponse.data.subsidies;
        console.log(`   ✅ 助成金マスターデータ: ${subsidies.length}件存在`);
        
        if (subsidies.length > 0) {
          console.log('   📋 サンプルデータ:');
          subsidies.forEach((subsidy, index) => {
            console.log(`      ${index + 1}. ${subsidy.name} (${subsidy.category})`);
          });
        } else {
          console.log('   ⚠️  助成金マスターデータが空です。サンプルデータの投入を推奨します。');
        }
      }
    } catch (error) {
      console.log('   ❌ 助成金マスターテーブルにアクセスできません');
      console.log(`      エラー: ${error.response?.data?.error || error.message}`);
    }
    
    // Check applications table
    console.log('\n3️⃣ 助成金申請データ確認...');
    try {
      const applicationsResponse = await axios.get('http://localhost:8787/api/subsidies/applications');
      
      if (applicationsResponse.data.success) {
        const applications = applicationsResponse.data.applications;
        console.log(`   ✅ 助成金申請データ: ${applications.length}件存在`);
        
        if (applications.length > 0) {
          const statusCounts = applications.reduce((acc, app) => {
            acc[app.status] = (acc[app.status] || 0) + 1;
            return acc;
          }, {});
          
          console.log('   📊 ステータス別件数:');
          Object.entries(statusCounts).forEach(([status, count]) => {
            console.log(`      ${status}: ${count}件`);
          });
        }
      }
    } catch (error) {
      console.log('   ❌ 助成金申請テーブルにアクセスできません');
      console.log(`      エラー: ${error.response?.data?.error || error.message}`);
    }
    
    // Check analytics endpoint
    console.log('\n4️⃣ ダッシュボード機能確認...');
    try {
      const analyticsResponse = await axios.get('http://localhost:8787/api/subsidies/dashboard/analytics');
      
      if (analyticsResponse.data.success) {
        const analytics = analyticsResponse.data.analytics;
        console.log('   ✅ ダッシュボード機能: 正常動作');
        console.log(`   📈 統計情報:`);
        console.log(`      総申請数: ${analytics.overview.total_applications || 0}`);
        console.log(`      成功数: ${analytics.overview.successful_applications || 0}`);
        console.log(`      成功率: ${analytics.overview.success_rate || 0}%`);
        
        if (analytics.overview.total_received_amount) {
          console.log(`      受給総額: ¥${analytics.overview.total_received_amount.toLocaleString()}`);
        }
      }
    } catch (error) {
      console.log('   ❌ ダッシュボード機能にアクセスできません');
      console.log(`      エラー: ${error.response?.data?.error || error.message}`);
    }
    
    console.log('\n🎯 **推奨アクション:**');
    console.log('1. サンプルデータが不足している場合:');
    console.log('   npx wrangler d1 execute sharoushi-task-manager-db --file=./seed-subsidies-updated.sql');
    console.log('\n2. 助成金マスター管理画面でデータを確認:');
    console.log('   http://localhost:8787/subsidy-master');
    console.log('\n3. 助成金申請管理画面でダッシュボードを確認:');
    console.log('   http://localhost:8787/subsidies');
    
  } catch (error) {
    console.log('❌ データベースチェック中にエラーが発生しました:');
    console.log(`   ${error.message}`);
    console.log('\n💡 解決方法:');
    console.log('1. 開発サーバーが起動していることを確認してください');
    console.log('2. データベースマイグレーションが完了していることを確認してください');
    console.log('3. 認証が必要な場合は、/api/dev-auth エンドポイントを使用してください');
  }
}

// Run the check
checkDatabaseStructure();
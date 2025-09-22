#!/bin/bash

# 助成金システム用データベースセットアップスクリプト
# Usage: ./setup-subsidies-db.sh [environment]
# environment: local (default) | production

set -e

ENVIRONMENT=${1:-local}
DB_NAME="sharoushi-task-manager-db"

echo "🚀 助成金システムデータベースセットアップ開始..."
echo "📍 環境: $ENVIRONMENT"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI がインストールされていません"
    echo "💡 インストール方法: npm install -g wrangler"
    exit 1
fi

# Check if we're logged in to Cloudflare
echo "1️⃣ Cloudflare認証状況確認..."
if ! wrangler whoami &> /dev/null; then
    echo "⚠️  Cloudflareにログインしていません"
    echo "💡 ログイン方法: wrangler login"
    exit 1
else
    echo "   ✅ Cloudflare認証済み"
fi

# Run schema migration
echo ""
echo "2️⃣ データベーススキーマ適用..."
if [ "$ENVIRONMENT" == "production" ]; then
    wrangler d1 execute $DB_NAME --file=./migrations/production_complete_schema.sql
    echo "   ✅ 本番環境スキーマ適用完了"
else
    wrangler d1 execute $DB_NAME --local --file=./migrations/production_complete_schema.sql
    echo "   ✅ ローカル環境スキーマ適用完了"
fi

# Check if sample data should be inserted
echo ""
echo "3️⃣ サンプルデータ投入確認..."
read -p "サンプル助成金データを投入しますか？ (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "   📦 サンプルデータ投入中..."
    
    if [ "$ENVIRONMENT" == "production" ]; then
        echo "⚠️  本番環境への自動サンプルデータ投入はスキップします"
        echo "💡 手動で必要なデータを投入してください"
    else
        wrangler d1 execute $DB_NAME --local --file=./seed-subsidies-updated.sql
        echo "   ✅ サンプルデータ投入完了"
    fi
else
    echo "   ⏭️  サンプルデータ投入をスキップ"
fi

# Verify database setup
echo ""
echo "4️⃣ データベース構造確認..."

if [ "$ENVIRONMENT" == "local" ]; then
    echo "   💡 データベース確認を実行するには:"
    echo "      1. 開発サーバーを起動: npm run dev"
    echo "      2. 確認スクリプト実行: node check-database.js"
else
    echo "   💡 本番環境の確認:"
    echo "      1. https://your-domain.pages.dev/subsidy-master にアクセス"
    echo "      2. https://your-domain.pages.dev/subsidies にアクセス"
fi

echo ""
echo "🎉 助成金システムデータベースセットアップ完了！"
echo ""
echo "📋 次のステップ:"
echo "1. 開発サーバー起動: npm run dev (ローカル環境の場合)"
echo "2. 助成金マスター管理: /subsidy-master"
echo "3. 助成金申請管理: /subsidies"
echo "4. メインダッシュボード: /"
echo ""
echo "🔧 トラブルシューティング:"
echo "- データベース接続エラー: wrangler.toml の d1_databases 設定を確認"
echo "- 認証エラー: /api/dev-auth エンドポイントで開発用認証を取得"
echo "- データ不足: seed-subsidies-updated.sql を再実行"
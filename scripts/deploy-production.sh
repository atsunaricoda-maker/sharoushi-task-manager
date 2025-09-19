#!/bin/bash

# ===================================================
# 本番環境デプロイスクリプト
# ===================================================

set -e  # エラーがあれば即座に停止

echo "🚀 本番環境デプロイを開始します..."

# 色設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# プロジェクト名（環境変数または引数から取得）
PROJECT_NAME=${1:-sharoushi-task-manager}

echo -e "${YELLOW}プロジェクト名: $PROJECT_NAME${NC}"

# 1. 環境確認
echo "📋 環境確認中..."
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.productionファイルが見つかりません${NC}"
    echo "  .env.production.exampleをコピーして設定してください"
    exit 1
fi

# 2. ビルド
echo "🔨 アプリケーションをビルド中..."
npm run build

# 3. テスト実行（オプション）
# echo "🧪 テスト実行中..."
# npm test

# 4. データベースマイグレーション確認
echo -e "${YELLOW}⚠️  本番データベースのマイグレーションを実行しますか？ (y/N)${NC}"
read -r response
if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "🗄️ データベースマイグレーション実行中..."
    npx wrangler d1 migrations apply sharoushi-db-production
fi

# 5. シークレット設定確認
echo -e "${YELLOW}⚠️  本番環境のシークレットは設定済みですか？ (y/N)${NC}"
read -r response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}以下のコマンドでシークレットを設定してください:${NC}"
    echo "npx wrangler pages secret put JWT_SECRET --project-name $PROJECT_NAME"
    echo "npx wrangler pages secret put GEMINI_API_KEY --project-name $PROJECT_NAME"
    echo "npx wrangler pages secret put SENDGRID_API_KEY --project-name $PROJECT_NAME"
    echo "npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name $PROJECT_NAME"
    echo "npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name $PROJECT_NAME"
    echo "npx wrangler pages secret put SENDGRID_FROM_EMAIL --project-name $PROJECT_NAME"
    echo "npx wrangler pages secret put SENDGRID_FROM_NAME --project-name $PROJECT_NAME"
    exit 1
fi

# 6. デプロイ前の最終確認
echo -e "${YELLOW}⚠️  本番環境にデプロイしてもよろしいですか？ (y/N)${NC}"
echo "  - プロジェクト: $PROJECT_NAME"
echo "  - ブランチ: main"
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo -e "${RED}デプロイをキャンセルしました${NC}"
    exit 0
fi

# 7. 本番環境へデプロイ
echo "🚀 本番環境へデプロイ中..."
npx wrangler pages deploy dist --project-name "$PROJECT_NAME" --branch main

# 8. デプロイ完了
echo -e "${GREEN}✅ デプロイが完了しました！${NC}"
echo ""
echo "📌 デプロイされたURL:"
echo "  https://$PROJECT_NAME.pages.dev"
echo ""
echo "📊 確認事項:"
echo "  1. アプリケーションが正常に動作しているか確認"
echo "  2. Google OAuthログインが機能しているか確認"
echo "  3. データベース接続が正常か確認"
echo "  4. Cloudflareダッシュボードでログを確認"
echo ""
echo -e "${GREEN}おめでとうございます！本番環境のデプロイが完了しました。${NC}"
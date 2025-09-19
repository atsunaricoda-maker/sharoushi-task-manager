#!/bin/bash

# 組織向けデプロイスクリプト
# 使い方: ./deploy-new-org.sh <組織名> <管理者メール>

ORG_NAME=$1
ADMIN_EMAIL=$2
PROJECT_NAME="${ORG_NAME}-task-manager"

if [ -z "$ORG_NAME" ] || [ -z "$ADMIN_EMAIL" ]; then
    echo "使い方: ./deploy-new-org.sh <組織名> <管理者メール>"
    echo "例: ./deploy-new-org.sh tanaka-office admin@tanaka-office.jp"
    exit 1
fi

echo "🚀 ${ORG_NAME} 向けのタスク管理システムをデプロイします..."

# 1. 環境変数ファイルの作成
cat > .env.${ORG_NAME} << EOF
# 組織情報
ORGANIZATION_NAME="${ORG_NAME}"
ADMIN_EMAIL="${ADMIN_EMAIL}"

# Google OAuth (組織ごとに設定が必要)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# API Keys
GEMINI_API_KEY="your-gemini-api-key"
SENDGRID_API_KEY="your-sendgrid-api-key"

# アプリURL
APP_URL="https://${PROJECT_NAME}.pages.dev"
REDIRECT_URI="https://${PROJECT_NAME}.pages.dev/auth/callback"
EOF

echo "✅ 環境変数ファイル .env.${ORG_NAME} を作成しました"
echo "⚠️  Google OAuth認証情報とAPIキーを設定してください"

# 2. Cloudflare Pagesプロジェクトの作成
echo "📦 Cloudflare Pagesプロジェクトを作成中..."
npx wrangler pages project create ${PROJECT_NAME} \
  --production-branch main \
  --compatibility-date 2024-01-01

# 3. D1データベースの作成
echo "💾 データベースを作成中..."
npx wrangler d1 create ${PROJECT_NAME}-db

# 4. 環境変数の設定
echo "🔐 環境変数を設定中..."
while IFS='=' read -r key value; do
    if [[ ! "$key" =~ ^# ]] && [[ ! -z "$key" ]]; then
        value=$(echo $value | tr -d '"')
        npx wrangler pages secret put $key --project-name ${PROJECT_NAME} <<< "$value"
    fi
done < .env.${ORG_NAME}

# 5. デプロイ
echo "🚀 アプリケーションをデプロイ中..."
npm run build
npx wrangler pages deploy dist --project-name ${PROJECT_NAME}

echo "✅ デプロイ完了！"
echo "🌐 URL: https://${PROJECT_NAME}.pages.dev"
echo ""
echo "📝 次のステップ:"
echo "1. Google Cloud ConsoleでOAuth認証情報を設定"
echo "2. .env.${ORG_NAME} にクライアントIDとシークレットを記入"
echo "3. npx wrangler pages secret put で環境変数を更新"
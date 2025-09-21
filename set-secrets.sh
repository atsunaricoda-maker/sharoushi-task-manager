#!/bin/bash

# Cloudflare Pages シークレット設定スクリプト

echo "🔐 Cloudflare Pages シークレット設定を開始します..."
echo ""
echo "以下の情報を準備してください："
echo "1. GOOGLE_CLIENT_ID (例: 123456789-xxx.apps.googleusercontent.com)"
echo "2. GOOGLE_CLIENT_SECRET (例: GOCSPX-xxxxx)"
echo "3. JWT_SECRET (32文字以上のランダム文字列)"
echo ""

# GOOGLE_CLIENT_ID
echo "📝 GOOGLE_CLIENT_IDを設定します..."
read -p "GOOGLE_CLIENT_IDを入力してください: " CLIENT_ID
echo $CLIENT_ID | npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name sharoushi-task-manager

# GOOGLE_CLIENT_SECRET
echo ""
echo "📝 GOOGLE_CLIENT_SECRETを設定します..."
read -s -p "GOOGLE_CLIENT_SECRETを入力してください（表示されません）: " CLIENT_SECRET
echo ""
echo $CLIENT_SECRET | npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name sharoushi-task-manager

# JWT_SECRET
echo ""
echo "📝 JWT_SECRETを設定します..."
echo "ランダムな文字列を生成しますか？ (y/n)"
read -p "> " GENERATE_JWT

if [ "$GENERATE_JWT" = "y" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    echo "生成されたJWT_SECRET: $JWT_SECRET"
else
    read -s -p "JWT_SECRETを入力してください（32文字以上）: " JWT_SECRET
    echo ""
fi

echo $JWT_SECRET | npx wrangler pages secret put JWT_SECRET --project-name sharoushi-task-manager

echo ""
echo "✅ シークレットの設定が完了しました！"
echo ""
echo "📌 次のステップ："
echo "1. Cloudflare Dashboardで Deployments → Retry deployment"
echo "2. 3-5分待つ"
echo "3. https://sharoushi-task-manager.pages.dev でテスト"
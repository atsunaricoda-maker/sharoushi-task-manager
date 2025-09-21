#!/bin/bash

echo "🗄️ D1データベースのセットアップを開始します..."
echo ""

# データベースID取得
echo "📝 CloudflareのD1ページで作成したDatabase IDを入力してください"
echo "（例: a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6）"
read -p "Database ID: " DB_ID

# wrangler.jsonc を更新
echo ""
echo "📝 wrangler.jsonc を更新中..."
cat > wrangler-temp.jsonc << EOF
{
  "\$schema": "node_modules/wrangler/config-schema.json",
  "name": "sharoushi-task-manager",
  "compatibility_date": "2024-01-01",
  "compatibility_flags": ["nodejs_compat"],
  "pages_build_output_dir": "./dist",
  
  // D1 Database configuration
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "sharoushi-task-manager-db",
      "database_id": "${DB_ID}"
    }
  ],

  // Environment variables (use wrangler secret put for production)
  "vars": {
    "ENVIRONMENT": "production",
    "APP_URL": "https://sharoushi-task-manager.pages.dev",
    "REDIRECT_URI": "https://sharoushi-task-manager.pages.dev/auth/callback"
  }
}
EOF

mv wrangler-temp.jsonc wrangler.jsonc
echo "✅ wrangler.jsonc 更新完了"

# マイグレーション実行
echo ""
echo "🔄 データベースマイグレーションを実行中..."

# 各マイグレーションファイルを実行
for migration in migrations/*.sql; do
  if [ -f "$migration" ]; then
    echo "実行中: $migration"
    npx wrangler d1 execute sharoushi-task-manager-db --remote --file="$migration"
  fi
done

echo ""
echo "✅ マイグレーション完了！"

# 初期データ投入（オプション）
echo ""
echo "初期データを投入しますか？ (y/n)"
read -p "> " SEED_DATA

if [ "$SEED_DATA" = "y" ]; then
  echo "📝 初期データ投入中..."
  npx wrangler d1 execute sharoushi-task-manager-db --remote --command="
    INSERT INTO users (email, name, role) VALUES 
    ('admin@sharoushi.com', '管理者', 'admin')
    ON CONFLICT(email) DO NOTHING;
  "
  echo "✅ 初期データ投入完了"
fi

echo ""
echo "🎉 データベースセットアップ完了！"
echo ""
echo "📌 次のステップ:"
echo "1. git add . && git commit -m 'Add D1 database configuration'"
echo "2. git push origin main"
echo "3. Cloudflareで自動デプロイを待つ"
echo "4. https://sharoushi-task-manager.pages.dev でログインテスト"
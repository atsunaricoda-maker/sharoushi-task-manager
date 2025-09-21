#!/bin/bash

echo "🗄️ D1データベースマイグレーションを開始します..."
echo ""

DB_NAME="sharoushi-task-manager-db"

echo "📝 以下のマイグレーションを実行します："
echo "1. 初期スキーマ（users, clients, tasks テーブル）"
echo ""

# 基本テーブル作成
echo "🔄 基本テーブルを作成中..."
npx wrangler d1 execute $DB_NAME --remote --command="
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  organization_id INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  contract_plan TEXT,
  employee_count INTEGER,
  monthly_fee INTEGER,
  notes TEXT,
  organization_id INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  client_id INTEGER,
  assignee_id INTEGER,
  task_type TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  due_date DATE,
  estimated_hours INTEGER,
  actual_hours INTEGER,
  progress INTEGER DEFAULT 0,
  notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (assignee_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  client_id INTEGER,
  status TEXT DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  organization_id INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

CREATE TABLE IF NOT EXISTS subsidies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  target_employees TEXT,
  max_amount INTEGER,
  application_deadline DATE,
  requirements TEXT,
  documents_required TEXT,
  url TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
"

echo "✅ 基本テーブル作成完了"
echo ""

# インデックス作成
echo "🔄 インデックスを作成中..."
npx wrangler d1 execute $DB_NAME --remote --command="
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_client ON tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
"

echo "✅ インデックス作成完了"
echo ""

# 初期ユーザー作成（オプション）
echo "📝 初期管理者ユーザーを作成しますか？ (y/n)"
read -p "> " CREATE_ADMIN

if [ "$CREATE_ADMIN" = "y" ]; then
  read -p "管理者のメールアドレス: " ADMIN_EMAIL
  read -p "管理者の名前: " ADMIN_NAME
  
  npx wrangler d1 execute $DB_NAME --remote --command="
    INSERT INTO users (email, name, role) 
    VALUES ('$ADMIN_EMAIL', '$ADMIN_NAME', 'admin')
    ON CONFLICT(email) DO UPDATE SET
      name = '$ADMIN_NAME',
      role = 'admin',
      updated_at = CURRENT_TIMESTAMP;
  "
  echo "✅ 管理者ユーザー作成完了"
fi

echo ""
echo "🎉 マイグレーション完了！"
echo ""
echo "📌 次のステップ:"
echo "1. Cloudflareで自動デプロイの完了を待つ（3-5分）"
echo "2. https://sharoushi-task-manager.pages.dev でログイン"
echo "3. ダッシュボードが表示されれば成功！"
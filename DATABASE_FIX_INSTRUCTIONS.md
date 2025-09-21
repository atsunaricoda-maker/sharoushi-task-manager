# 🚨 Production Database Fix - 助成金機能エラー解決

## 🎯 現在の問題
本番環境で助成金機能を使用すると以下のエラーが発生しています：
- **"no such column: created_by"** - D1データベースのテーブル構造が不完全
- **"Request failed with status code 500"** - データベーススキーマの不整合

## 🔍 根本原因
本番のD1データベースに必要なマイグレーション（特に `subsidy_applications` テーブルの `created_by` カラム）が適用されていない状態です。

## 🛠️ 解決手順

### Step 1: Cloudflare API認証の設定

#### オプション A: API トークンを使用（推奨）
```bash
# 1. Cloudflare ダッシュボードでAPIトークンを作成
# https://developers.cloudflare.com/fundamentals/api/get-started/create-token/

# 2. 環境変数を設定
export CLOUDFLARE_API_TOKEN="your-api-token-here"
```

#### オプション B: Wrangler ログイン
```bash
# ブラウザ経由でログイン
wrangler login
```

### Step 2: データベース修正の実行

#### 自動実行（推奨）
```bash
# 作成済みのスクリプトを実行
./deploy-database-fix.sh
```

#### 手動実行
```bash
# 1. 完全なスキーマを適用
wrangler d1 execute sharoushi-task-manager-db \
  --file=./migrations/production_complete_schema.sql \
  --remote

# 2. サンプルデータを追加
wrangler d1 execute sharoushi-task-manager-db \
  --file=./migrations/production_sample_data.sql \
  --remote

# 3. テーブル構造を確認
wrangler d1 execute sharoushi-task-manager-db \
  --remote \
  --command="PRAGMA table_info(subsidy_applications);"
```

### Step 3: 修正内容の確認

#### テーブル一覧の確認
```bash
wrangler d1 execute sharoushi-task-manager-db \
  --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table';"
```

#### subsidy_applications テーブルの確認
```bash
wrangler d1 execute sharoushi-task-manager-db \
  --remote \
  --command="SELECT * FROM subsidy_applications LIMIT 5;"
```

### Step 4: 機能テスト

1. **アプリケーションにアクセス**: https://sharoushi-task-manager.pages.dev
2. **ログイン**: Google OAuth でログイン
3. **助成金機能をテスト**:
   - 助成金一覧の表示
   - 新しい申請の作成
   - 厚労省データの取得機能
   - CSV エクスポート機能

## 📋 修正されるテーブル

### 新規作成/更新されるテーブル：
- ✅ `subsidies` - 助成金マスター
- ✅ `subsidy_applications` - 助成金申請（**created_by カラム含む**）
- ✅ `subsidy_documents` - 申請書類管理
- ✅ `subsidy_checklists` - 申請チェックリスト
- ✅ `subsidy_schedules` - スケジュール管理
- ✅ `subsidy_progress_logs` - 進捗履歴
- ✅ `subsidy_receipts` - 受給実績
- ✅ `subsidy_templates` - テンプレート
- ✅ `subsidy_updates` - 更新履歴

### その他のテーブル：
- ✅ `users`, `clients`, `tasks` - 既存テーブルの維持
- ✅ `projects`, `calendar_events` - プロジェクト・カレンダー機能
- ✅ インデックスの最適化

## 🚨 緊急対応コマンド

もし上記手順でエラーが発生した場合：

```bash
# 1. 現在のテーブル状況を確認
wrangler d1 execute sharoushi-task-manager-db \
  --remote \
  --command="SELECT sql FROM sqlite_master WHERE name='subsidy_applications';"

# 2. 必要に応じてテーブルを削除・再作成
wrangler d1 execute sharoushi-task-manager-db \
  --remote \
  --command="DROP TABLE IF EXISTS subsidy_applications;"

# 3. 再度スキーマを適用
wrangler d1 execute sharoushi-task-manager-db \
  --file=./migrations/production_complete_schema.sql \
  --remote
```

## 📊 修正後の確認ポイント

### ✅ 必須チェック項目：
1. **認証**: Google OAuth ログインが成功する
2. **助成金一覧**: エラーなしで助成金一覧が表示される
3. **新規申請**: 助成金申請の新規作成ができる
4. **データ更新**: 厚労省データ取得機能が動作する
5. **エクスポート**: CSV エクスポートが正常動作する

### 🔍 ログ確認：
```bash
# リアルタイムログの確認
wrangler pages deployment tail --project-name=sharoushi-task-manager
```

## 🎉 修正完了後

修正が完了すると、以下が正常に動作するようになります：

- **助成金管理機能の全CRUD操作**
- **厚生労働省データとの連携**
- **CSV エクスポート機能**
- **詳細な申請状況管理**
- **スケジュール・チェックリスト機能**

---

## 📞 サポート

修正中に問題が発生した場合は、以下の情報を確認してください：

1. **Cloudflare API認証**の状況
2. **wrangler のバージョン**（4.24.3 以上推奨）
3. **D1 データベース ID**が正しく設定されているか
4. **エラーメッセージの詳細**

これで本番環境の助成金機能が完全に動作するようになります！🚀
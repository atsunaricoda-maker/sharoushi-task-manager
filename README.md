# 社労士事務所タスク管理システム

## プロジェクト概要
- **名称**: 社労士事務所タスク管理システム
- **目的**: 社労士事務所（7名体制）における業務の属人化解消と進捗の見える化を実現
- **主要機能**: 
  - タスク管理（定期・不定期業務）
  - 顧問先管理
  - スタッフ別業務量の可視化
  - 期限管理とアラート機能
  - ダッシュボード

## URLs
- **開発環境**: https://3000-ivn6amwip8uhxdg63ar73-6532622b.e2b.dev
- **本番環境**: 未デプロイ
- **GitHub**: 未設定

## 現在完成済みの機能

### ✅ 基本機能
- [x] Hono + Cloudflare Pagesベースのプロジェクト構成
- [x] D1データベースの設計と実装
- [x] マイグレーション機能
- [x] テストデータの投入

### ✅ API機能
- [x] ヘルスチェックAPI (`GET /api/health`)
- [x] タスク一覧取得API (`GET /api/tasks`)
- [x] タスク作成API (`POST /api/tasks`)
- [x] タスク更新API (`PUT /api/tasks/:id`)
- [x] 顧問先一覧取得API (`GET /api/clients`)
- [x] ユーザー一覧取得API (`GET /api/users`)
- [x] ダッシュボード統計API (`GET /api/dashboard/stats`)

### ✅ UI機能
- [x] ダッシュボード画面
  - 今日のタスク表示
  - 遅延タスク表示
  - 今週のタスク表示
  - 進行中タスク表示
- [x] スタッフ別業務量チャート
- [x] 直近タスクリスト表示
- [x] レスポンシブデザイン
- [x] 直感的な色分けシステム

## 機能エントリーポイント

### APIエンドポイント
| メソッド | パス | 説明 | パラメータ |
|---------|------|------|-----------|
| GET | `/` | メインダッシュボード画面 | - |
| GET | `/api/health` | ヘルスチェック | - |
| GET | `/api/tasks` | タスク一覧取得 | `status`, `assignee_id`, `client_id`, `priority` |
| POST | `/api/tasks` | タスク作成 | `title`, `description`, `client_id`, `assignee_id`, `task_type`, `priority`, `due_date`, `estimated_hours` |
| PUT | `/api/tasks/:id` | タスク更新 | `status`, `progress`, `actual_hours`, `notes` |
| GET | `/api/clients` | 顧問先一覧取得 | - |
| GET | `/api/users` | ユーザー一覧取得 | - |
| GET | `/api/dashboard/stats` | ダッシュボード統計データ | - |

## 未実装の機能

### 📝 認証・セキュリティ
- [ ] Google OAuth 2.0認証
- [ ] JWT セッション管理
- [ ] ロールベースアクセス制御

### 📊 高度なタスク管理
- [ ] タスクの詳細編集画面
- [ ] タスクテンプレート機能
- [ ] 一括タスク生成機能
- [ ] タスク履歴の詳細表示

### 🏢 顧問先管理
- [ ] 顧問先詳細画面
- [ ] 顧問先別タスクテンプレート設定
- [ ] 契約情報管理

### 📈 レポート機能
- [ ] 月次レポート生成
- [ ] 顧問先別レポート
- [ ] CSV/PDFエクスポート

### 🔔 通知機能
- [ ] メール通知
- [ ] ブラウザ通知
- [ ] 期限アラート

### 🔗 Google Workspace連携
- [ ] Gmail連携
- [ ] Google Calendar連携
- [ ] Google Drive連携

## データアーキテクチャ
- **データベース**: Cloudflare D1 (SQLite)
- **セッション管理**: Cloudflare KV（予定）
- **主要テーブル**: 
  - `users`: 社労士情報
  - `clients`: 顧問先情報
  - `tasks`: タスク情報
  - `task_templates`: タスクテンプレート
  - `client_task_templates`: 顧問先別テンプレート
  - `task_history`: タスク履歴

## 開発の推奨次ステップ

### 優先度：高
1. **Google OAuth認証の実装**
   - セキュリティの確保
   - ユーザー管理の実装

2. **タスクCRUD画面の実装**
   - タスク作成モーダル
   - タスク編集画面
   - タスク削除機能

3. **顧問先管理画面の実装**
   - 顧問先一覧画面
   - 顧問先詳細画面
   - タスクテンプレート設定

### 優先度：中
4. **通知システムの構築**
   - 期限アラート機能
   - メール通知設定

5. **レポート機能の開発**
   - 月次レポート
   - エクスポート機能

### 優先度：低
6. **Google Workspace連携**
   - Gmail API統合
   - Calendar同期
   - Drive連携

## 技術スタック
- **フロントエンド**: HTML + TailwindCSS + Vanilla JavaScript
- **バックエンド**: Hono Framework
- **データベース**: Cloudflare D1 (SQLite)
- **ランタイム**: Cloudflare Workers
- **デプロイ**: Cloudflare Pages

## 開発環境セットアップ

```bash
# 依存関係のインストール
npm install

# データベースマイグレーション
npm run db:migrate:local

# テストデータ投入
npm run db:seed

# 開発サーバー起動
npm run build
pm2 start ecosystem.config.cjs

# サービス確認
curl http://localhost:3000/api/health
```

## デプロイメント

```bash
# 本番環境へのデプロイ（Cloudflare Pages）
npm run deploy:prod
```

## 最終更新日
2025-09-19
# 社労士事務所タスク管理システム

## プロジェクト概要
- **名称**: 社労士事務所タスク管理システム
- **目的**: 社労士事務所（7名体制）における業務の属人化解消と進捗の見える化を実現
- **主要機能**: 
  - タスク管理（定期・不定期業務）
  - 顧問先管理
  - スタッフ別業務量の可視化
  - Google OAuth認証
  - AI自動タスク生成（Gemini API）
  - ダッシュボード

## URLs
- **開発環境**: https://3000-ivn6amwip8uhxdg63ar73-6532622b.e2b.dev
- **本番環境**: 未デプロイ
- **GitHub**: 未設定

## 現在完了済みの機能

### ✅ 基本機能
- [x] Hono + Cloudflare Pagesベースのプロジェクト構成
- [x] D1データベースの設計と実装
- [x] マイグレーション機能
- [x] テストデータの投入
- [x] Google OAuth 2.0認証システム
- [x] JWT ベースのセッション管理

### ✅ API機能
- [x] ヘルスチェックAPI (`GET /api/health`)
- [x] 認証ステータスAPI (`GET /api/auth/status`)
- [x] タスク一覧取得API (`GET /api/tasks`)
- [x] タスク作成API (`POST /api/tasks`)
- [x] タスク更新API (`PUT /api/tasks/:id`)
- [x] タスク削除API (`DELETE /api/tasks/:id`)
- [x] 顧問先一覧取得API (`GET /api/clients`)
- [x] ユーザー一覧取得API (`GET /api/users`)
- [x] ダッシュボード統計API (`GET /api/dashboard/stats`)

### ✅ AI機能（Gemini API）
- [x] AI自動タスク生成API (`POST /api/ai/generate-tasks`)
- [x] AIタスク説明生成API (`POST /api/ai/enhance-description`)
- [x] AI自動タスク生成UIセクション
- [x] 顧問先情報に基づくタスク提案
- [x] 季節業務の自動判定（算定基礎届、年末調整など）

### ✅ UI機能
- [x] ログイン画面（Google認証）
- [x] ダッシュボード画面
  - 今日のタスク表示
  - 遅延タスク表示
  - 今週のタスク表示
  - 進行中タスク表示
- [x] スタッフ別業務量チャート
- [x] 直近タスクリスト表示
- [x] タスク作成モーダル
- [x] レスポンシブデザイン
- [x] 直感的な色分けシステム

## 機能エントリーポイント

### ページエンドポイント
| メソッド | パス | 説明 | パラメータ |
|---------|------|------|-----------|
| GET | `/` | メインダッシュボード画面（要認証） | - |
| GET | `/login` | ログイン画面 | - |
| GET | `/auth/google` | Google OAuth認証開始 | - |
| GET | `/auth/callback` | OAuth認証コールバック | `code` |
| GET | `/auth/logout` | ログアウト | - |

### APIエンドポイント
| メソッド | パス | 説明 | パラメータ |
|---------|------|------|-----------|
| GET | `/api/health` | ヘルスチェック | - |
| GET | `/api/auth/status` | 認証状態確認 | - |
| GET | `/api/tasks` | タスク一覧取得 | `status`, `assignee_id`, `client_id`, `priority` |
| POST | `/api/tasks` | タスク作成 | `title`, `description`, `client_id`, `assignee_id`, `task_type`, `priority`, `due_date`, `estimated_hours` |
| PUT | `/api/tasks/:id` | タスク更新 | `status`, `progress`, `actual_hours`, `notes` |
| DELETE | `/api/tasks/:id` | タスク削除 | - |
| GET | `/api/clients` | 顧問先一覧取得 | - |
| GET | `/api/users` | ユーザー一覧取得 | - |
| GET | `/api/dashboard/stats` | ダッシュボード統計データ | - |
| POST | `/api/ai/generate-tasks` | AI自動タスク生成 | `client_id`, `month` |
| POST | `/api/ai/enhance-description` | AIタスク説明生成 | `task_title` |

## 未実装の機能

### 📝 セキュリティ強化
- [ ] ロールベースアクセス制御（管理者権限）
- [ ] API Rate Limiting
- [ ] 監査ログ機能

### 📊 高度なタスク管理
- [ ] タスクの詳細編集画面
- [ ] タスクテンプレート管理
- [ ] タスク履歴の詳細表示
- [ ] タスクのドラッグ&ドロップ

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
- [ ] Gmail連携（タスク通知）
- [ ] Google Calendar連携（期限同期）
- [ ] Google Drive連携（ファイル管理）

## データアーキテクチャ
- **データベース**: Cloudflare D1 (SQLite)
- **セッション管理**: JWT + Cookie
- **主要テーブル**: 
  - `users`: 社労士情報
  - `clients`: 顧問先情報
  - `tasks`: タスク情報
  - `task_templates`: タスクテンプレート
  - `client_task_templates`: 顧問先別テンプレート
  - `task_history`: タスク履歴

## 開発の推奨次ステップ

### 優先度：高
1. **Google Workspace API連携**
   - Gmail連携でタスク通知
   - Calendar連携で期限管理
   - Drive連携でファイル管理

2. **顧問先管理画面の実装**
   - 顧問先詳細画面
   - 契約情報管理
   - タスクテンプレート設定

3. **レポート機能の強化**
   - 月次レポート自動生成
   - PDF/CSVエクスポート
   - グラフィカルな分析画面

### 優先度：中
4. **通知システムの構築**
   - 期限アラート機能
   - メール通知設定

5. **UIの改善**
   - タスクのドラッグ&ドロップ
   - 詳細な編集画面

### 優先度：低
6. **管理機能**
   - 管理者権限
   - システム設定画面
   - 監査ログ

## 技術スタック
- **フロントエンド**: HTML + TailwindCSS + Vanilla JavaScript
- **バックエンド**: Hono Framework
- **データベース**: Cloudflare D1 (SQLite)
- **認証**: Google OAuth 2.0 + JWT
- **AI**: Google Gemini API
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

## 設定方法

### 必要な環境変数（.dev.vars）
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-random-jwt-secret
GEMINI_API_KEY=your-gemini-api-key
APP_URL=http://localhost:3000
REDIRECT_URI=http://localhost:3000/auth/callback
```

### Google OAuth設定
1. Google Cloud Consoleでプロジェクト作成
2. OAuth 2.0クライアントID作成
3. 承認済みリダイレクトURIに `http://localhost:3000/auth/callback` を追加
4. クライアントIDとシークレットを.dev.varsに設定

### Gemini API設定
1. Google AI Studioにアクセス
2. APIキーを生成
3. .dev.varsにGEMINI_API_KEYを設定

## デプロイメント

```bash
# 本番環境へのデプロイ（Cloudflare Pages）
npm run deploy:prod

# 本番環境の環境変数設定
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name sharoushi-task-manager
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name sharoushi-task-manager
npx wrangler pages secret put JWT_SECRET --project-name sharoushi-task-manager
npx wrangler pages secret put GEMINI_API_KEY --project-name sharoushi-task-manager
```

## 最終更新日
2025-09-19
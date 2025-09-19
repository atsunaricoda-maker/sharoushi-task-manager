# 社労士事務所タスク管理システム

## プロジェクト概要
- **名称**: 社労士事務所タスク管理システム
- **目的**: 社労士事務所（7名体制）における業務の属人化解消と進捗の見える化を実現
- **主要機能**: 
  - タスク管理（定期・不定期業務）
  - 顧問先管理
  - プロジェクト管理（AI自動生成対応）
  - 助成金申請管理
  - スタッフ別業務量の可視化
  - Google Workspace統合（Gmail、Calendar）
  - Google OAuth認証
  - AI自動タスク生成（Gemini API）
  - 通知システム（メール、ブラウザ）
  - ダッシュボード

## URLs
- **開発環境**: https://3000-ivn6amwip8uhxdg63ar73-6532622b.e2b.dev
- **本番環境**: 未デプロイ
- **GitHub**: 未設定

## 現在完了済みの機能

### ✅ フェーズ6完了機能（最新機能 - 自動スケジュール調整）
- [x] 自動スケジュール調整システム
  - タスク期限の自動調整機能
  - クリティカルパス検出
  - バッファー時間の自動割当（タイトなスケジュール対応）
  - リソース競合チェック
  - 並列実行最適化
  - スケジュール警告システム
- [x] スケジュール管理UI
  - タイムライン表示
  - ガントチャート可視化（Chart.js統合）
  - プロジェクト別スケジュール生成
  - スケジュール最適化機能
  - バッファー率カスタマイズ
  - 作業時間設定機能
- [x] 管理者ダッシュボード
  - スタッフ別パフォーマンス可視化
  - 業務完了件数の追跡
  - ランキング表示（メダル付き）
  - ワークロード分析
  - 月次トレンド分析
  - チーム全体の生産性レポート
- [x] 助成金情報自動取得
  - 厚労省サイトからの情報スクレイピング
  - J-Grants連携
  - ミラサポplus連携
  - 助成金データベースの自動更新

### ✅ フェーズ5完了機能
- [x] プロジェクト管理システム
  - プロジェクト作成・管理
  - AIによるプロジェクトとタスクの自動生成
  - マイルストーン管理
  - 進捗率の自動計算
  - プロジェクトメンバー管理
  - 詳細な進捗レポート
- [x] 助成金申請管理システム
  - 助成金データベース管理
  - 申請状況の追跡
  - 自動チェックリスト生成
  - 必要書類管理
  - 期限アラート機能
  - 進捗率の可視化
  - 領収書・費用管理

### ✅ フェーズ4完了機能（優先順位対応）
- [x] 通知機能実装
  - メール通知設定画面
  - 日次サマリー・リマインダー機能
  - SendGrid API連携（設定準備完了）
  - 通知履歴管理
- [x] Gmail API統合
  - メール送受信機能
  - クライアントメールからのタスク自動生成
  - 進捗報告自動送信
  - メールテンプレート機能
  - メールアーカイブ・既読管理
- [x] Google Calendar API統合
  - カレンダー表示（FullCalendar統合）
  - タスクとカレンダーの双方向同期
  - イベントからのタスク自動生成
  - クイック追加機能（自然言語入力）
  - 空き時間検索機能
  - 定期タスクのスケジュール管理

### ✅ フェーズ3完了機能
- [x] 顧問先管理画面（一覧・詳細・新規登録）
- [x] 顧問先詳細パネル（スライド表示）
- [x] レポート機能（月次・顧問先別）
- [x] ダイナミックチャート（Chart.js統合）
- [x] CSVエクスポート機能
- [x] 統計ダッシュボード

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
| GET | `/clients` | 顧問先管理画面 | - |
| GET | `/reports` | レポート画面 | - |
| GET | `/settings` | 設定画面（通知設定） | - |
| GET | `/gmail` | Gmail連携画面 | - |
| GET | `/calendar` | カレンダー画面 | - |
| GET | `/projects` | プロジェクト管理画面 | - |
| GET | `/subsidies` | 助成金申請管理画面 | - |
| GET | `/schedule` | スケジュール管理画面 | - |
| GET | `/admin` | 管理者ダッシュボード | - |

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
| POST | `/api/schedule/generate` | スケジュール自動生成 | `projectId`, `startDate`, `endDate`, `bufferPercentage`, `allowParallelExecution` |
| POST | `/api/schedule/optimize` | スケジュール最適化 | `projectId`, `additionalDays` |
| GET | `/api/schedule/project/:projectId` | プロジェクトスケジュール取得 | - |
| GET | `/api/schedule/gantt/:projectId` | ガントチャートデータ取得 | - |
| GET | `/api/notifications/settings` | 通知設定取得 | - |
| PUT | `/api/notifications/settings` | 通知設定更新 | `email_enabled`, `browser_enabled`, `frequency`, `reminder_time` |
| POST | `/api/notifications/send-reminder/:taskId` | タスクリマインダー送信 | - |
| POST | `/api/gmail/send` | メール送信 | `to`, `subject`, `body`, `cc`, `bcc` |
| GET | `/api/gmail/messages` | メール一覧取得 | `q`, `maxResults` |
| POST | `/api/gmail/process-client-emails` | クライアントメールのタスク自動生成 | - |
| POST | `/api/gmail/send-progress-report/:clientId` | 進捗報告送信 | - |
| GET | `/api/calendar/events` | カレンダーイベント取得 | `timeMin`, `timeMax` |
| POST | `/api/calendar/events` | イベント作成 | `summary`, `start`, `end`, `description` |
| GET | `/api/projects` | プロジェクト一覧取得 | - |
| POST | `/api/projects` | プロジェクト作成 | `name`, `client_id`, `description`, `start_date`, `end_date` |
| POST | `/api/projects/generate` | AIプロジェクト生成 | `prompt`, `client_id` |
| GET | `/api/subsidies` | 助成金一覧取得 | `category`, `is_active` |
| POST | `/api/subsidies/applications` | 申請作成 | `subsidy_id`, `client_id`, `amount_requested` |
| PUT | `/api/subsidies/applications/:id/status` | 申請ステータス更新 | `status` |

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
- [x] メール通知（SendGrid API）
- [x] ブラウザ通知設定
- [x] 期限アラート機能

### 🔗 Google Workspace連携
- [x] Gmail連携（送受信・自動処理）
- [x] Google Calendar連携（タスク期限同期・双方向連携）
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

## 特徴的な実装

### ⚡ 自動スケジュール調整機能
ユーザーの「AIでタスク生成を行うときに期限決めたらそれまでのタスクごとの期限て自動調節してくれる？」という要望に対応し、以下を実装：

1. **TaskSchedulerクラス** (`src/lib/task-scheduler.ts`)
   - クリティカルパス法（CPM）によるスケジュール最適化
   - タイトなスケジュールの自動検出と警告
   - バッファー時間の動的割当
   - リソース競合の検出と解決

2. **スケジュール最適化API**
   - プロジェクト期限内でのタスク自動配分
   - 並列実行可能なタスクの識別
   - 期限が厳しすぎる場合の警告と提案

3. **視覚的なスケジュール表示**
   - タイムライン表示でクリティカルパスを赤色強調
   - ガントチャートによる全体像の把握
   - バッファー時間の可視化

## 開発の推奨次ステップ

### 優先度：高
1. **スケジュール機能の更なる改善**
   - 休日・祝日を考慮したスケジューリング
   - チームメンバーのスキルレベル考慮
   - 過去の実績に基づく見積もり精度向上
   - マイルストーン単位でのスケジュール管理

2. **AI機能の拡張**
   - タスクの自動優先度設定
   - リソースの最適配分提案
   - プロジェクトリスクの予測分析

3. **レポート機能の強化**
   - スケジュール達成率レポート
   - ボトルネック分析
   - リソース使用率の可視化

### 優先度：中
4. **モバイル対応**
   - レスポンシブデザインの完全化
   - PWA化でオフライン動作
   - モバイルアプリ化

5. **データ連携の強化**
   - 他社労務管理システムとのAPI連携
   - CSV/Excelインポート機能
   - バックアップ・リストア機能
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
SENDGRID_API_KEY=your-sendgrid-api-key
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

### 本番環境構築前のチェックリスト
詳細は `PRODUCTION_CHECKLIST.md` を参照してください。

### 本番環境へのデプロイ手順
```bash
# 1. 環境変数ファイルの準備
cp .env.production.example .env.production
# .env.productionを編集して実際の値を設定

# 2. 本番用D1データベースの作成
npx wrangler d1 create sharoushi-db-production

# 3. wrangler.jsoncのdatabase_id更新
# 生成されたIDをwrangler.jsoncに記載

# 4. 本番環境へのデプロイ
./scripts/deploy-production.sh sharoushi-task-manager

# 5. 本番環境の環境変数設定（初回のみ）
npx wrangler pages secret put JWT_SECRET --project-name sharoushi-task-manager
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name sharoushi-task-manager
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name sharoushi-task-manager
npx wrangler pages secret put GEMINI_API_KEY --project-name sharoushi-task-manager
npx wrangler pages secret put SENDGRID_API_KEY --project-name sharoushi-task-manager
npx wrangler pages secret put SENDGRID_FROM_EMAIL --project-name sharoushi-task-manager
npx wrangler pages secret put SENDGRID_FROM_NAME --project-name sharoushi-task-manager
```

## セキュリティ注意事項
- 本番環境では必ず新しいJWT_SECRETを生成してください
- Google OAuthのクライアントシークレットは定期的に更新してください
- APIキーは最小権限の原則に従って設定してください
- CORS設定は本番URLのみに限定してください

## トラブルシューティング
- **認証エラー**: Google Cloud ConsoleでリダイレクトURIを確認
- **データベースエラー**: マイグレーションが正しく実行されているか確認
- **メール送信エラー**: SendGrid APIキーと送信者認証を確認
- **AI生成エラー**: Gemini APIキーのクォータを確認

## 最終更新日
2025-09-19
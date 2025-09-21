# 社労士事務所タスク管理システム

## プロジェクト概要
- **名称**: 社労士事務所タスク管理システム
- **目標**: 社会保険労務士事務所の業務効率化と顧客管理の最適化
- **主な機能**: タスク管理、顧客管理、プロジェクト管理、助成金申請管理、スケジュール管理、レポート生成

## URL
- **本番環境**: https://sharoushi-task-manager.pages.dev
- **開発環境**: https://b0983e8b.sharoushi-task-manager.pages.dev
- **GitHub**: https://github.com/atsunaricoda-maker/sharoushi-task-manager

## 現在実装済みの機能

### ✅ 認証システム
- Google OAuth 2.0による安全なログイン
- JWT トークンベースのセッション管理
- ロール別アクセス制御（管理者、ユーザー、閲覧者）

### ✅ 顧客管理
- 顧客情報の登録・編集・削除
- 契約プラン、従業員数、月額料金の管理
- 顧客一覧の検索・フィルタリング

### ✅ タスク管理
- タスクの作成・編集・削除・完了
- 優先度設定（高・中・低）
- ステータス管理（保留・進行中・完了・キャンセル）
- 担当者割り当て
- 期限管理

### ✅ プロジェクト管理
- プロジェクトの作成・編集・削除
- プロジェクトごとのタスク管理
- 予算管理
- 進捗追跡

### ✅ 助成金申請管理
- 申請情報の登録・追跡
- 申請状況の管理（準備中・提出済・承認・却下）
- 申請金額と承認金額の記録
- 期限管理

### ✅ スケジュール管理
- カレンダーベースのスケジュール表示
- 会議・タスク・締切の管理
- 繰り返し予定の設定
- 場所情報の記録

### ✅ レポート機能
- ダッシュボード統計
- 収益レポート（月次・年次）
- タスク完了レポート
- 顧客活動レポート

### ✅ 通知設定
- ユーザーごとの通知設定
- メール・プッシュ・SMS通知の選択
- タスクリマインダー
- 締切アラート

### ✅ 管理者機能
- ユーザー管理
- システム統計表示
- データベース最適化
- アクティビティログ（実装予定）

## API エンドポイント

### 認証
- `GET /auth/google` - Google OAuth ログイン開始
- `GET /auth/google/callback` - OAuth コールバック
- `GET /auth/logout` - ログアウト
- `GET /api/auth/status` - 認証状態確認

### 顧客管理
- `GET /api/clients` - 顧客一覧取得
- `GET /api/clients/:id` - 顧客詳細取得
- `POST /api/clients` - 新規顧客登録
- `PUT /api/clients/:id` - 顧客情報更新
- `DELETE /api/clients/:id` - 顧客削除

### タスク管理
- `GET /api/tasks` - タスク一覧取得
- `GET /api/tasks/:id` - タスク詳細取得
- `POST /api/tasks` - タスク作成
- `PUT /api/tasks/:id` - タスク更新
- `DELETE /api/tasks/:id` - タスク削除

### プロジェクト管理
- `GET /api/projects` - プロジェクト一覧
- `GET /api/projects/:id` - プロジェクト詳細
- `POST /api/projects` - プロジェクト作成
- `PUT /api/projects/:id` - プロジェクト更新
- `DELETE /api/projects/:id` - プロジェクト削除
- `POST /api/projects/:id/tasks` - プロジェクトタスク追加

### 助成金管理
- `GET /api/subsidies` - 助成金申請一覧
- `GET /api/subsidies/:id` - 申請詳細
- `POST /api/subsidies` - 申請登録
- `PUT /api/subsidies/:id` - 申請更新
- `DELETE /api/subsidies/:id` - 申請削除
- `GET /api/subsidies/stats/summary` - 統計情報

### スケジュール管理
- `GET /api/schedule` - スケジュール取得（日付範囲指定）
- `GET /api/schedule/:id` - エントリー詳細
- `POST /api/schedule` - スケジュール登録
- `PUT /api/schedule/:id` - スケジュール更新
- `DELETE /api/schedule/:id` - スケジュール削除
- `GET /api/schedule/upcoming/summary` - 今後の予定

### レポート
- `GET /api/reports/dashboard` - ダッシュボード統計
- `GET /api/reports/revenue` - 収益レポート
- `GET /api/reports/task-completion` - タスク完了レポート
- `GET /api/reports/client-activity` - 顧客活動レポート

### 通知設定
- `GET /api/notifications/settings` - 通知設定取得
- `POST /api/notifications/settings` - 通知設定更新
- `GET /api/notifications/pending` - 保留中の通知

### 管理者機能
- `GET /api/admin/stats` - システム統計
- `GET /api/admin/users` - ユーザー一覧
- `PUT /api/admin/users/:id/role` - ユーザーロール更新
- `POST /api/admin/maintenance/optimize` - データベース最適化

## データアーキテクチャ

### データモデル
- **Users**: ユーザー情報（認証、ロール、プロフィール）
- **Clients**: 顧客企業情報（契約、従業員数、料金）
- **Tasks**: タスク情報（期限、優先度、ステータス）
- **Projects**: プロジェクト情報（期間、予算、ステータス）
- **Subsidy Applications**: 助成金申請情報
- **Schedule Entries**: スケジュール情報
- **Task Templates**: タスクテンプレート
- **Notification Settings**: 通知設定

### ストレージサービス
- **Cloudflare D1**: メインデータベース（SQLite）
- **Cloudflare KV**: セッション管理（将来実装）
- **Cloudflare R2**: ファイルストレージ（将来実装）

### データフロー
1. ユーザー認証 → JWT トークン発行 → Cookie 保存
2. API リクエスト → JWT 検証 → データベースアクセス
3. データ更新 → リアルタイム反映 → UI 更新

## 使用方法

### ログイン
1. https://sharoushi-task-manager.pages.dev にアクセス
2. 「Googleでログイン」をクリック
3. Googleアカウントで認証

### 基本操作
1. **ダッシュボード**: ログイン後の最初の画面で全体の統計を確認
2. **顧客管理**: サイドバーから「顧客管理」を選択して顧客を管理
3. **タスク管理**: 「タスク」から日々の業務タスクを管理
4. **プロジェクト**: 「プロジェクト」から大規模案件を管理
5. **助成金**: 「助成金申請」から申請状況を追跡
6. **スケジュール**: 「スケジュール」で予定を管理

## デプロイメント

- **プラットフォーム**: Cloudflare Pages
- **ステータス**: ✅ アクティブ
- **技術スタック**: Hono + TypeScript + TailwindCSS + Cloudflare D1
- **最終更新**: 2025-01-21

## 今後の実装予定

### 近日実装予定
1. **Gmail/Calendar実連携**: Google Workspace APIの統合
2. **ファイルアップロード**: 書類管理機能（R2ストレージ）
3. **メール通知**: 実際のメール送信機能
4. **データエクスポート**: CSV/PDF出力機能

### 中期計画
1. **モバイルアプリ**: PWA対応
2. **AIアシスタント**: Gemini APIによる業務支援
3. **電子署名**: 契約書の電子署名機能
4. **請求書管理**: 自動請求書生成

### 長期ビジョン
1. **マルチテナント対応**: 複数事務所での利用
2. **API公開**: 外部システム連携
3. **分析機能強化**: 業務分析とレポート自動生成

## 開発者向け情報

### ローカル開発
```bash
# 依存関係インストール
npm install

# ローカル開発サーバー起動
npm run dev:sandbox

# ビルド
npm run build

# デプロイ
npm run deploy:prod
```

### 環境変数
```
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
ENVIRONMENT=production
```

### データベースマイグレーション
```bash
# ローカル
npm run db:migrate:local

# 本番
npm run db:migrate:prod
```

## サポート
問題が発生した場合は、GitHub Issues でお知らせください。

---
*Last Updated: 2025-01-21*
# 🚀 Cloudflare Pages デプロイ手順

## 🎯 概要
労務管理タスクシステムをCloudflare Pagesにデプロイして、本格的なWebアプリケーションとして運用する手順です。

## 📋 前提条件
- [x] GitHubリポジトリが作成済み
- [ ] Cloudflareアカウント（無料でOK）
- [ ] Google Cloud Console アカウント（OAuth用）

## 🛠️ Step 1: Cloudflare Pagesプロジェクト作成

### 1-1. Cloudflare Dashboardにアクセス
1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. 左サイドバーで **"Pages"** をクリック

### 1-2. GitHubリポジトリと連携
1. **"Create a project"** をクリック
2. **"Connect to Git"** を選択
3. GitHubアカウントに接続
4. リポジトリ **sharoushi-task-manager** を選択
5. **"Begin setup"** をクリック

### 1-3. ビルド設定
```
Framework preset: None
Build command: npm run build
Build output directory: dist
Root directory: (empty)
```

### 1-4. 環境変数設定
**Environment variables** セクションで以下を追加：

**本番環境用（Production）:**
```
ENVIRONMENT = production
APP_URL = https://sharoushi-task-manager.pages.dev
REDIRECT_URI = https://sharoushi-task-manager.pages.dev/auth/callback
```

## 🗄️ Step 2: D1 Database設定

### 2-1. D1データベース作成
```bash
# Cloudflare D1データベース作成（コマンドライン）
npx wrangler d1 create sharoushi-task-manager-db
```

または、Cloudflare Dashboardで:
1. **"D1"** セクションに移動
2. **"Create database"** をクリック
3. データベース名: `sharoushi-task-manager-db`

### 2-2. Pages設定でD1をバインド
1. Pagesプロジェクト設定画面
2. **"Functions"** タブ
3. **"D1 database bindings"** セクション
4. **Variable name:** `DB`
5. **D1 database:** `sharoushi-task-manager-db`

### 2-3. データベースマイグレーション実行
```bash
# 本番D1にマイグレーション適用
npx wrangler d1 migrations apply sharoushi-task-manager-db --remote
```

## 🔐 Step 3: Google OAuth設定

### 3-1. Google Cloud Console設定
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成または既存プロジェクト選択
3. **APIs & Services > Credentials** に移動
4. **Create Credentials > OAuth 2.0 Client IDs**

### 3-2. OAuth同意画面設定
```
Application type: Web application
Name: 労務管理タスクシステム
Authorized JavaScript origins: 
  - https://sharoushi-task-manager.pages.dev
Authorized redirect URIs:
  - https://sharoushi-task-manager.pages.dev/auth/callback
```

### 3-3. CloudflareにOAuth情報追加
Pagesプロジェクトの環境変数に追加：
```
GOOGLE_CLIENT_ID = [取得したClient ID]
GOOGLE_CLIENT_SECRET = [取得したClient Secret]
JWT_SECRET = [32文字以上のランダム文字列]
```

## 🎨 Step 4: 追加機能設定（オプション）

### 4-1. Gemini AI API（AI機能用）
```
GEMINI_API_KEY = [Google AI Studio で取得]
```

### 4-2. SendGrid（メール送信用）
```
SENDGRID_API_KEY = [SendGridで取得]
```

## 🚀 Step 5: デプロイ実行

### 5-1. 自動デプロイ
mainブランチにプッシュすると自動的にデプロイされます。

### 5-2. 手動デプロイ（ローカルから）
```bash
# Wranglerにログイン
npx wrangler login

# プロジェクトをデプロイ
npm run deploy:cloudflare
```

## ✅ Step 6: デプロイ確認

### 6-1. 基本機能テスト
1. https://sharoushi-task-manager.pages.dev にアクセス
2. Google OAuth ログインをテスト
3. 各機能の動作確認：
   - [ ] タスク管理
   - [ ] 顧客管理（編集機能含む）
   - [ ] カレンダー機能（CRUD操作）
   - [ ] 助成金管理（データ取得機能）
   - [ ] レポート機能（CSV出力）

### 6-2. データベース確認
```bash
# テーブル一覧確認
npx wrangler d1 execute sharoushi-task-manager-db --remote --command="SELECT name FROM sqlite_master WHERE type='table'"

# サンプルクエリ
npx wrangler d1 execute sharoushi-task-manager-db --remote --command="SELECT COUNT(*) as subsidy_count FROM subsidies"
```

### 6-3. ログ確認
```bash
# リアルタイムログ確認
npx wrangler pages deployment tail --project-name=sharoushi-task-manager
```

## 🎯 完成したURL

デプロイ完了後のアプリケーション:
**https://sharoushi-task-manager.pages.dev**

## 🔧 メンテナンス

### 定期的な更新
- 依存関係のアップデート: `npm update`
- セキュリティパッチの適用
- D1データベースのバックアップ

### モニタリング
- Cloudflare Analytics でアクセス状況確認
- D1データベース使用量確認
- Pages Function実行回数確認

---

## 🆘 トラブルシューティング

### よくある問題と解決方法

**1. OAuth認証エラー**
- Google Cloud Consoleの認証済みURIを確認
- REDIRECT_URIの設定を確認

**2. データベース接続エラー**  
- D1バインディング設定を確認
- マイグレーションが適用されているか確認

**3. 助成金データ取得エラー**
- API実装は完了済み（現在はモックデータ）
- 実際の政府API連携は追加開発で対応可能

**4. ビルドエラー**
- `npm ci && npm run build` でローカルテスト
- Node.js バージョン確認（18以上推奨）

---

これで本格的な労務管理システムがCloudflare Pages上で稼働します！🎉
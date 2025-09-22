# 🚀 Cloudflare Pages 自動デプロイ設定ガイド

## 📋 必要な準備

### 1. **Cloudflare API Token の取得**
Cloudflare Dashboard でAPI Tokenを作成してください：

#### 手順:
1. [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) にアクセス
2. **"Create Token"** をクリック
3. **"Custom token"** を選択
4. 以下の権限を設定：

```
Token name: sharoushi-task-manager-deploy
Permissions:
  - Account - Cloudflare Pages:Edit
  - Zone - Zone:Read
  - Zone - Page Rules:Edit
Account Resources:
  - Include - All accounts
Zone Resources:
  - Include - All zones
```

5. **"Continue to summary"** → **"Create Token"**
6. 生成されたトークンをコピー

### 2. **GitHub Secrets の設定**

GitHubリポジトリで以下のSecretsを設定してください：

1. GitHub リポジトリ: `https://github.com/atsunaricoda-maker/sharoushi-task-manager`
2. **Settings** → **Secrets and variables** → **Actions**
3. **"New repository secret"** で以下を追加：

```
Name: CLOUDFLARE_API_TOKEN
Value: [上記で取得したAPIトークン]
```

### 3. **Cloudflare Pages プロジェクト作成**

Cloudflare Dashboard でプロジェクトを作成：

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Pages**
2. **"Create a project"** → **"Connect to Git"**
3. GitHubを選択し、リポジトリ `sharoushi-task-manager` を選択
4. プロジェクト設定：
   - **Project name**: `sharoushi-task-manager`
   - **Production branch**: `main`
   - **Build settings**: Skip (GitHub Actionsで管理)

### 4. **D1 Database 作成**

```bash
# D1データベース作成
npx wrangler d1 create sharoushi-task-manager-db

# 出力されるdatabase_idをwrangler.tomlに反映
# database_id = "YOUR_DATABASE_ID"
```

### 5. **環境変数設定**

Cloudflare Pages Dashboard で以下の環境変数を設定：

```
ENVIRONMENT=production
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key (オプション)
SENDGRID_API_KEY=your_sendgrid_api_key (オプション)
APP_URL=https://sharoushi-task-manager.pages.dev
REDIRECT_URI=https://sharoushi-task-manager.pages.dev/auth/callback
```

## 🔄 自動デプロイフロー

### 動作仕組み:
1. **Git Push** → `main`ブランチ
2. **GitHub Actions** 自動実行
3. **ビルド** → `npm run build`
4. **Cloudflare Pages** デプロイ
5. **D1 Database** マイグレーション実行

### 確認方法:
- GitHub Actions: `https://github.com/atsunaricoda-maker/sharoushi-task-manager/actions`
- Cloudflare Pages: `https://dash.cloudflare.com/[account-id]/pages`

## 🎯 デプロイURL

デプロイ完了後のアクセス先:
```
https://sharoushi-task-manager.pages.dev
```

## 🐛 トラブルシューティング

### ビルドエラー
- GitHub Actionsのログを確認
- ローカルで `npm run build` をテスト

### 認証エラー
- CLOUDFLARE_API_TOKEN の権限を確認
- Account ID が正しいか確認

### データベースエラー
- D1 database の binding が正しいか確認
- マイグレーションが実行されたか確認

## 📞 サポート

問題が発生した場合：
1. GitHub Actions ログを確認
2. Cloudflare Pages ダッシュボードでエラー詳細を確認
3. このドキュメントのトラブルシューティングセクションを参照

---

**Account ID**: `a2beb7b88e3c7a9888e6ec0849498ce7`  
**Project Name**: `sharoushi-task-manager`  
**Repository**: `https://github.com/atsunaricoda-maker/sharoushi-task-manager.git`
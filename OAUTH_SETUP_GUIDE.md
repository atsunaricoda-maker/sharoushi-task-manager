# Google OAuth 設定ガイド

## 📋 概要
社労士事務所タスク管理システムでGoogle OAuth認証を使用するための設定手順です。

## 🔑 Google Cloud Console設定

### 1. プロジェクト作成・選択
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成するか、既存のプロジェクトを選択

### 2. OAuth同意画面の設定
1. **APIs & Services** → **OAuth consent screen**に移動
2. **External**を選択（内部ユーザーのみの場合はInternal）
3. 以下の情報を入力：
   - **App name**: 社労士事務所タスク管理システム
   - **User support email**: あなたのメールアドレス
   - **App domain** (オプション): 
     - Homepage: `https://sharoushi-task-manager.pages.dev`
     - Privacy Policy: `https://sharoushi-task-manager.pages.dev/privacy`
     - Terms of Service: `https://sharoushi-task-manager.pages.dev/terms`
   - **Developer contact information**: あなたのメールアドレス

### 3. 認証情報の作成
1. **APIs & Services** → **Credentials**に移動
2. **+ CREATE CREDENTIALS** → **OAuth 2.0 Client IDs**をクリック
3. **Application type**: Web application
4. **Name**: 社労士事務所タスク管理システム
5. **Authorized JavaScript origins**:
   - 本番環境: `https://sharoushi-task-manager.pages.dev`
   - 開発環境: `https://3000-is5n8ejx31y9aiscq9mwg-6532622b.e2b.dev`
   - ローカル開発: `http://localhost:3000`
6. **Authorized redirect URIs**:
   - 本番環境: `https://sharoushi-task-manager.pages.dev/auth/callback`
   - 開発環境: `https://3000-is5n8ejx31y9aiscq9mwg-6532622b.e2b.dev/auth/callback`
   - ローカル開発: `http://localhost:3000/auth/callback`

### 4. Client IDとSecretの取得
作成後、以下の情報をコピーして保存：
- **Client ID**: `1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxx`

## 🔧 アプリケーション設定

### 開発環境（.dev.vars）
```bash
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
APP_URL=https://3000-is5n8ejx31y9aiscq9mwg-6532622b.e2b.dev
REDIRECT_URI=https://3000-is5n8ejx31y9aiscq9mwg-6532622b.e2b.dev/auth/callback
```

### 本番環境（Cloudflare Pages Secrets）
```bash
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name sharoushi-task-manager
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name sharoushi-task-manager
```

## 🧪 テスト手順

### 1. 開発環境でのテスト
1. `.dev.vars`ファイルに正しい値を設定
2. `npm run dev:sandbox`でサーバー起動
3. ブラウザで`https://3000-SANDBOX-ID.e2b.dev/login`にアクセス
4. 「Googleでログイン」をクリックしてテスト

### 2. 認証フローの確認
1. Google認証画面が表示される
2. アカウント選択・認証
3. アプリケーションにリダイレクト
4. ダッシュボードが表示される

## 🚨 トラブルシューティング

### よくあるエラーと解決方法

#### 1. "redirect_uri_mismatch"
- Google Cloud Consoleの**Authorized redirect URIs**に正しいURLが設定されていることを確認
- URLが完全に一致している必要があります（末尾のスラッシュも含む）

#### 2. "invalid_client"
- Client IDとSecretが正しく設定されていることを確認
- 環境変数が正しく読み込まれていることを確認

#### 3. "access_denied"
- OAuth同意画面が適切に設定されていることを確認
- テストユーザーが追加されていることを確認（External設定の場合）

## 📝 セキュリティ注意事項

1. **Client Secret**は絶対に公開しない
2. `.dev.vars`ファイルはGitにコミットしない
3. 本番環境では必ずHTTPSを使用
4. 定期的にSecretをローテーション

## 🔗 参考リンク
- [Google OAuth 2.0 ドキュメント](https://developers.google.com/identity/protocols/oauth2)
- [Cloudflare Pages Environment Variables](https://developers.cloudflare.com/pages/platform/build-configuration/)
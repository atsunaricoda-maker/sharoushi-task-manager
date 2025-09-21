# 🌩️ Cloudflare Pages セットアップ完全ガイド

## 📋 やることリスト（全4ステップ・20分）

1. Cloudflareアカウント作成（3分）
2. GitHubリポジトリ連携（5分）
3. ビルド設定（3分）
4. 環境変数設定（5分）

---

## Step 1: Cloudflareアカウント作成【3分】

### 1-1. Cloudflareにアクセス
👉 https://dash.cloudflare.com/sign-up

### 1-2. アカウント作成
```
メールアドレス: あなたのメール
パスワード: 安全なパスワード
```

### 1-3. メール認証
受信したメールのリンクをクリックして認証完了

---

## Step 2: Pages プロジェクト作成【5分】

### 2-1. Cloudflare Dashboardにログイン
👉 https://dash.cloudflare.com

### 2-2. Workers & Pages を選択
左側メニューまたはトップページから「Workers & Pages」をクリック

### 2-3. Create application
青いボタン「Create application」をクリック

### 2-4. Pages を選択
「Pages」タブをクリック

### 2-5. Connect to Git をクリック
GitHubアイコンの「Connect to Git」ボタンをクリック

---

## Step 3: GitHub連携とビルド設定【5分】

### 3-1. GitHubアカウントを連携

初回の場合：
1. 「Connect GitHub account」をクリック
2. GitHubにログイン
3. 「Authorize Cloudflare Pages」をクリック

### 3-2. リポジトリを選択

1. 「Select a repository」で検索
2. `atsunaricoda-maker/sharoushi-task-manager` を選択
3. 「Begin setup」をクリック

### 3-3. ビルド設定【重要！】

以下の設定を**正確に**入力：

```
Project name: atsunari-task-manager
（または好きな名前。これがURLになります）

Production branch: main

Build settings:
├─ Framework preset: None （自動検出されたら「None」に変更）
├─ Build command: npm run build
├─ Build output directory: dist
└─ Root directory: / （空欄でOK）
```

⚠️ **注意**: 
- Project nameは後で変更できません
- 英数字とハイフンのみ使用可能
- このnameが `https://[project-name].pages.dev` のURLになります

---

## Step 4: 環境変数の設定【超重要！5分】

### 4-1. Environment variables セクション

「Environment variables」の「Add variable」をクリック

### 4-2. 必須の環境変数を追加

以下を**1つずつ**追加（コピペ推奨）：

#### 必須項目（これがないと動きません）

| Variable name | Value | 説明 |
|--------------|-------|------|
| `GOOGLE_CLIENT_ID` | `あなたのクライアントID` | Google OAuthのID |
| `GOOGLE_CLIENT_SECRET` | `あなたのシークレット` | Google OAuthのシークレット |
| `JWT_SECRET` | `ランダムな32文字以上` | 以下で生成👇 |

**JWT_SECRET の生成方法**:
```bash
# ランダムな文字列を生成（以下のどれかを使用）
openssl rand -hex 32

# または Node.js で
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# または単純に
your-super-secret-key-minimum-32-characters-long-2024
```

#### オプション項目（後で追加でもOK）

| Variable name | Value | 説明 |
|--------------|-------|------|
| `GEMINI_API_KEY` | `AIzaSy...` | AI機能用（後で追加可） |
| `SENDGRID_API_KEY` | `SG....` | メール通知用（後で追加可） |
| `ENVIRONMENT` | `production` | 環境識別用 |

### 4-3. APP_URL の設定

**重要**: デプロイ後に判明するURLを設定

```
APP_URL = https://atsunari-task-manager.pages.dev
REDIRECT_URI = https://atsunari-task-manager.pages.dev/auth/callback
```

---

## Step 5: デプロイ実行【3分】

### 5-1. Save and Deploy をクリック

すべての設定が完了したら、一番下の青いボタン：
「Save and Deploy」をクリック

### 5-2. デプロイ進行状況

1. 初回ビルドが開始（3-5分かかります）
2. 進捗バーが表示される
3. ログが流れる（エラーがないか確認）

### 5-3. デプロイ完了！

成功すると：
```
✅ Success! Your site is deployed to:
https://atsunari-task-manager.pages.dev
```

---

## 🔍 デプロイ後の確認

### 1. サイトにアクセス
ブラウザで `https://あなたのproject-name.pages.dev` を開く

### 2. ログインテスト
1. 「Googleでログイン」をクリック
2. Googleアカウントでログイン
3. ダッシュボードが表示されればOK！

---

## ⚠️ よくあるエラーと対処法

### エラー1: Build failed
```
原因: ビルドコマンドが間違っている
対処: Build command を npm run build に修正
```

### エラー2: 404 Not Found
```
原因: Build output directory が間違っている
対処: dist に設定されているか確認
```

### エラー3: Google認証でエラー
```
原因: リダイレクトURIが一致しない
対処: Google Cloud ConsoleでリダイレクトURIを追加
      https://あなたのproject-name.pages.dev/auth/callback
```

### エラー4: 環境変数が読み込まれない
```
原因: 環境変数の設定ミス
対処: Settings → Environment variables で再設定
```

---

## 📝 設定完了後のチェックリスト

- [ ] Cloudflareアカウント作成済み
- [ ] GitHubリポジトリ連携済み
- [ ] ビルド設定完了
- [ ] 環境変数設定完了（最低3つ）
- [ ] デプロイ成功
- [ ] サイトアクセス確認
- [ ] Googleログイン動作確認

---

## 🎯 次のステップ

### 1. D1データベース作成（必須）

Cloudflare Dashboard → Workers & Pages → D1
```bash
# ローカルで実行
npx wrangler d1 create atsunari-task-manager-db

# 出力されたdatabase_idをメモ
```

### 2. データベース連携

Pages → Settings → Functions → D1 database bindings
```
Variable name: DB
D1 database: atsunari-task-manager-db
```

### 3. マイグレーション実行

```bash
# ローカルで実行
npx wrangler d1 migrations apply atsunari-task-manager-db
```

---

## 💡 Pro Tips

### カスタムドメインを使いたい場合

Pages → Custom domains → Add custom domain
```
例: task.atsunari.com
```

### 環境変数を後で変更する場合

Settings → Environment variables → Edit variables
→ 変更後「Save」→ 再デプロイが必要

### ビルドログを確認

Deployments → 各デプロイをクリック → View build log

---

## 🆘 困ったときは

1. **ビルドログを確認**: エラーメッセージを読む
2. **環境変数を再確認**: 特にGOOGLE_CLIENT_IDとJWT_SECRET
3. **Google Cloud Console**: リダイレクトURIが正しいか確認
4. **ブラウザのコンソール**: F12でエラーを確認

それでも解決しない場合は、エラーメッセージを教えてください！
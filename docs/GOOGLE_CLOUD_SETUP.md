# 🔐 Google Cloud設定ガイド（社労士タスク管理システム用）

## 📍 必要な作業は3つだけ！

1. **Google OAuth認証情報の作成**（必須）← ログイン機能用
2. **Gemini API キーの取得**（オプション）← AIタスク生成用
3. **Gmail/Calendar API有効化**（オプション）← メール・カレンダー連携用

---

## 1️⃣ Google OAuth認証情報の作成【必須・15分】

### Step 1: Google Cloud Consoleにアクセス
1. https://console.cloud.google.com にアクセス
2. Googleアカウントでログイン

### Step 2: プロジェクト作成
1. 上部の「プロジェクトを選択」をクリック
2. 「新しいプロジェクト」をクリック
3. プロジェクト名: `sharoushi-task-manager`
4. 「作成」をクリック

### Step 3: OAuth同意画面の設定
1. 左メニューから「APIとサービス」→「OAuth同意画面」
2. ユーザータイプ: **「外部」を選択**（社内のみなら「内部」でもOK）
3. 「作成」をクリック

#### アプリ情報の入力
```
アプリ名: 社労士事務所タスク管理システム
ユーザーサポートメール: あなたのメールアドレス
アプリのロゴ: （スキップOK）
```

#### スコープの設定
「スコープを追加または削除」をクリックして以下を選択：
- ✅ `.../auth/userinfo.email` （メールアドレス取得）
- ✅ `.../auth/userinfo.profile` （プロフィール情報取得）
- ✅ `.../auth/gmail.send` （Gmail送信・オプション）
- ✅ `.../auth/calendar.events` （Calendar連携・オプション）

#### テストユーザー
「ADD USERS」をクリックして、利用予定のメールアドレスを追加
（例：事務所のスタッフ全員のGmailアドレス）

### Step 4: OAuth 2.0 クライアントIDの作成
1. 左メニュー「APIとサービス」→「認証情報」
2. 上部の「認証情報を作成」→「OAuth クライアント ID」
3. アプリケーションの種類: **「ウェブアプリケーション」**
4. 名前: `Sharoushi Task Manager Web Client`

#### 重要：承認済みのリダイレクトURI
以下のURIを**全て**追加してください：

**開発環境用（テスト用）:**
```
http://localhost:3000/auth/callback
http://localhost:3000/api/auth/callback
```

**本番環境用（Cloudflare Pages）:**
```
https://atsunari-task-manager.pages.dev/auth/callback
https://atsunari-task-manager.pages.dev/api/auth/callback
https://あなたのプロジェクト名.pages.dev/auth/callback
https://あなたのプロジェクト名.pages.dev/api/auth/callback
```

**カスタムドメイン（もしあれば）:**
```
https://task.your-domain.com/auth/callback
https://task.your-domain.com/api/auth/callback
```

5. 「作成」をクリック

### Step 5: 認証情報を保存
作成後、以下が表示されます：
```
クライアントID: xxxxxxxxxxxxx.apps.googleusercontent.com
クライアントシークレット: GOCSPX-xxxxxxxxxxxxx
```

**⚠️ これらを安全な場所にコピー・保存してください！**

---

## 2️⃣ Gemini API キーの取得【オプション・5分】

AIタスク自動生成機能を使う場合のみ必要です。

### Step 1: Google AI Studio にアクセス
1. https://makersuite.google.com/app/apikey にアクセス
2. Googleアカウントでログイン

### Step 2: APIキーを作成
1. 「Create API Key」をクリック
2. 既存のGoogle Cloudプロジェクトを選択 or 新規作成
3. APIキーが表示されるのでコピー

**無料枠**: 60リクエスト/分まで無料！

---

## 3️⃣ Gmail/Calendar API の有効化【オプション・5分】

Gmail送信やCalendar連携を使う場合のみ必要です。

### Step 1: APIライブラリにアクセス
1. Google Cloud Console の「APIとサービス」→「ライブラリ」

### Step 2: Gmail APIを有効化
1. 検索バーに「Gmail」と入力
2. 「Gmail API」をクリック
3. 「有効にする」をクリック

### Step 3: Google Calendar APIを有効化
1. 検索バーに「Calendar」と入力
2. 「Google Calendar API」をクリック
3. 「有効にする」をクリック

---

## 📝 取得した情報の整理

以下の情報をメモしておいてください：

```env
# 必須
GOOGLE_CLIENT_ID=xxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx

# オプション（AI機能を使う場合）
GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxx

# 自動生成（32文字以上のランダム文字列）
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-chars
```

---

## 🚨 よくあるトラブルと解決法

### Q: 「このアプリは確認されていません」と表示される
**A**: 開発中は正常です。「詳細」→「安全でないページに移動」でOK

### Q: リダイレクトエラーが出る
**A**: リダイレクトURIが正確に設定されているか確認
- 末尾のスラッシュ（/）の有無に注意
- httpとhttpsの違いに注意
- 本番URLが正しいか確認

### Q: 認証後、アプリにリダイレクトされない
**A**: Cloudflare Pages の環境変数設定を確認
```
GOOGLE_CLIENT_ID が正しく設定されているか
GOOGLE_CLIENT_SECRET が正しく設定されているか
REDIRECT_URI が OAuth設定と一致しているか
```

---

## ✅ 設定完了チェックリスト

- [ ] Google Cloud プロジェクト作成
- [ ] OAuth同意画面の設定
- [ ] OAuth 2.0 クライアントID作成
- [ ] リダイレクトURI設定（本番URL含む）
- [ ] クライアントID・シークレット保存
- [ ] Gemini API キー取得（オプション）
- [ ] Gmail/Calendar API有効化（オプション）

---

## 🎯 次のステップ

1. **Cloudflare Pages で環境変数を設定**
   - 取得したクライアントID、シークレットを入力

2. **デプロイ実行**
   - 自動的にアプリケーションが起動

3. **動作確認**
   - https://your-app.pages.dev にアクセス
   - Googleログインをテスト

---

## 📞 サポート

設定で困ったら、以下の情報を確認：
- Google Cloud Console: https://console.cloud.google.com
- エラーメッセージの詳細
- ブラウザの開発者ツール（F12）のConsoleタブ
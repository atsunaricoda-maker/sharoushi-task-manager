# 本番環境構築チェックリスト

## 🚨 重要：本番環境構築前の必須準備項目

### 1. ✅ 環境変数とシークレットの設定
**現在の状況:**
- [x] JWT_SECRET: 設定済み（ランダム生成済み）
- [x] GEMINI_API_KEY: 設定済み
- [ ] SENDGRID_API_KEY: **要設定** - メール通知に必要
- [ ] GOOGLE_CLIENT_ID/SECRET: **本番用に再設定が必要**

**必要なアクション:**
```bash
# 本番環境用のシークレット設定コマンド
npx wrangler pages secret put JWT_SECRET --project-name <project-name>
npx wrangler pages secret put GEMINI_API_KEY --project-name <project-name>
npx wrangler pages secret put SENDGRID_API_KEY --project-name <project-name>
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name <project-name>
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name <project-name>
```

### 2. 🗄️ Cloudflare D1データベースの本番設定
**必要なアクション:**
1. 本番用D1データベースの作成
```bash
npx wrangler d1 create sharoushi-db-production
```

2. wrangler.jsoncのdatabase_id更新
```json
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "sharoushi-db-production",
      "database_id": "実際のID" // ← ここを更新
    }
  ]
}
```

3. マイグレーションの実行
```bash
npx wrangler d1 migrations apply sharoushi-db-production
```

### 3. 🔐 Google OAuth設定の本番用更新
**重要:** 現在の設定はlocalhost/sandboxのみ対応

**必要なアクション:**
1. Google Cloud Consoleで本番URLを追加
   - 承認済みのJavaScriptオリジン: `https://your-app.pages.dev`
   - 承認済みのリダイレクトURI: `https://your-app.pages.dev/auth/callback`

2. 環境変数の更新
   - APP_URL: `https://your-app.pages.dev`
   - REDIRECT_URI: `https://your-app.pages.dev/auth/callback`

### 4. 📧 SendGrid設定（メール通知）
**必要なアクション:**
1. SendGridアカウント作成: https://sendgrid.com/
2. APIキー取得
3. 送信者認証（Sender Authentication）設定
4. APIキーをwranglerで設定

### 5. 🛡️ セキュリティ強化
**確認項目:**
- [ ] CORS設定の本番URL限定化
- [ ] Rate limiting設定
- [ ] CSRFトークン実装
- [ ] XSS対策の確認
- [ ] SQLインジェクション対策の確認

**現在のCORS設定を修正:**
```typescript
// src/index.tsx
app.use('/api/*', cors({
  origin: ['https://your-app.pages.dev'], // 本番URLのみに限定
  credentials: true
}))
```

### 6. 🚀 デプロイ前の最終確認
- [ ] 全マイグレーションファイルの確認
- [ ] テストデータの削除
- [ ] console.logの削除/production環境での無効化
- [ ] エラーメッセージの本番用修正（詳細なエラーを隠す）
- [ ] パフォーマンス最適化（不要なインポート削除等）

### 7. 📊 モニタリング設定
**推奨設定:**
- Cloudflare Analytics有効化
- Sentry等のエラートラッキング設定
- アラート設定（ダウンタイム、エラー率等）

### 8. 🔄 バックアップ・リカバリ計画
- [ ] D1データベースの定期バックアップ設定
- [ ] ロールバック手順の文書化
- [ ] 障害時の連絡体制確立

### 9. 📝 ドキュメント整備
- [ ] 管理者向け運用マニュアル
- [ ] ユーザー向け使用マニュアル
- [ ] APIドキュメント（内部用）

## 🎯 本番環境デプロイの推奨手順

1. **ステージング環境での確認**
   ```bash
   # preview branchにデプロイしてテスト
   npx wrangler pages deploy dist --project-name sharoushi-staging --branch preview
   ```

2. **段階的リリース**
   - まず社内の限定ユーザーでテスト
   - 問題なければ全ユーザーに公開

3. **ロールバック準備**
   - 前のバージョンのビルドを保存
   - ロールバック手順を明確化

## ⚠️ 注意事項

### 現在公開されている機密情報
**重要:** 以下の情報が.dev.varsに含まれています
- GOOGLE_CLIENT_SECRET
- GEMINI_API_KEY
- JWT_SECRET

**対策:**
1. 本番環境では新しいキーを生成
2. 現在のキーは開発環境専用として制限
3. GitHubにpushする前に.gitignoreで除外確認

### データ移行について
- 開発環境のテストデータは本番に移行しない
- 必要な初期データのみを用意
- ユーザーアカウントは本番で新規作成

## 次のステップ

1. **優先度高:**
   - [ ] SendGrid APIキーの取得と設定
   - [ ] Google OAuth本番URL設定
   - [ ] Cloudflare D1本番データベース作成

2. **優先度中:**
   - [ ] セキュリティ設定の強化
   - [ ] エラーハンドリングの改善
   - [ ] パフォーマンス最適化

3. **優先度低:**
   - [ ] ドキュメント整備
   - [ ] モニタリング設定

---
最終更新: 2025-09-19
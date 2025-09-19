# 複数組織向けデプロイガイド

## 🎯 なぜ組織ごとのデプロイが必要？

### セキュリティ面
- **データの完全分離**: 他の事務所のデータにアクセスできない
- **認証の独立性**: 各事務所で独自のGoogleアカウント管理
- **コンプライアンス**: 社労士の守秘義務を確実に守れる

### 運用面
- **カスタマイズ性**: 事務所ごとの要望に個別対応可能
- **料金請求**: 使用量に応じた個別課金が可能
- **障害分離**: 1つの事務所で問題が起きても他に影響しない

## 🚀 セットアップ手順

### 1. 新規組織のデプロイ

```bash
# デプロイスクリプトを実行
chmod +x deploy-new-org.sh
./deploy-new-org.sh <組織名> <管理者メール>

# 例：田中社労士事務所の場合
./deploy-new-org.sh tanaka-office admin@tanaka-office.jp
```

### 2. Google OAuth認証の設定

各組織で個別にGoogle Cloud Consoleで設定が必要：

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新規プロジェクト作成 or 既存プロジェクト選択
3. 「APIとサービス」→「認証情報」
4. 「認証情報を作成」→「OAuth 2.0 クライアントID」
5. 承認済みリダイレクトURIに追加：
   ```
   https://<組織名>-task-manager.pages.dev/auth/callback
   ```

### 3. 環境変数の設定

`.env.<組織名>` ファイルを編集：

```env
# Google OAuth設定
GOOGLE_CLIENT_ID="取得したクライアントID"
GOOGLE_CLIENT_SECRET="取得したシークレット"

# Gemini API（AIタスク生成用）
GEMINI_API_KEY="AIタスク生成を使う場合は設定"

# SendGrid（メール通知用）
SENDGRID_API_KEY="メール通知を使う場合は設定"
```

### 4. 環境変数をCloudflareに反映

```bash
# 各環境変数を設定
npx wrangler pages secret put GOOGLE_CLIENT_ID --project-name <組織名>-task-manager
npx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name <組織名>-task-manager
npx wrangler pages secret put GEMINI_API_KEY --project-name <組織名>-task-manager
npx wrangler pages secret put SENDGRID_API_KEY --project-name <組織名>-task-manager
npx wrangler pages secret put JWT_SECRET --project-name <組織名>-task-manager
```

## 💰 料金体系

### Cloudflare Pages（無料プラン）
- **月間リクエスト**: 100,000回まで無料
- **ビルド時間**: 500分/月まで無料
- **同時実行**: 1ビルドまで

### Cloudflare Pages（有料プラン: $20/月）
- **月間リクエスト**: 無制限
- **ビルド時間**: 5,000分/月
- **同時実行**: 5ビルドまで

### D1 Database
- **無料枠**: 
  - 5GB ストレージ
  - 500万行の読み取り/日
  - 10万行の書き込み/日

**7名程度の事務所なら無料プランで十分運用可能です！**

## 🔧 運用管理

### 組織一覧の管理

`organizations.json` で管理：

```json
{
  "organizations": [
    {
      "name": "tanaka-office",
      "display_name": "田中社労士事務所",
      "admin_email": "admin@tanaka-office.jp",
      "url": "https://tanaka-office-task-manager.pages.dev",
      "created_at": "2024-01-15",
      "plan": "free",
      "users": 7
    },
    {
      "name": "yamada-office",
      "display_name": "山田社労士法人",
      "admin_email": "admin@yamada-office.jp",
      "url": "https://yamada-office-task-manager.pages.dev",
      "created_at": "2024-01-20",
      "plan": "free",
      "users": 5
    }
  ]
}
```

### 一括アップデート

全組織のシステムを一括更新する場合：

```bash
#!/bin/bash
# update-all-orgs.sh

# organizations.jsonから組織名を取得
for org in $(jq -r '.organizations[].name' organizations.json); do
    echo "Updating ${org}..."
    npx wrangler pages deploy dist --project-name ${org}-task-manager
done
```

## 🏢 マルチテナント化への移行パス

将来的に規模が大きくなった場合の移行計画：

### Phase 1: 個別デプロイ（現在）
- 10組織まで: 個別デプロイで運用
- セキュリティ最優先

### Phase 2: 半統合（10-50組織）
- 共通コードベースを維持
- デプロイは組織ごと
- 管理画面の統合

### Phase 3: 完全マルチテナント（50組織以上）
- 1つのシステムで全組織対応
- Row Level Security実装
- 専用管理ポータル

## 📞 サポート

### トラブルシューティング

#### Q: デプロイが失敗する
A: Cloudflare API Tokenが正しく設定されているか確認

#### Q: Google認証が動作しない
A: リダイレクトURIが正確に設定されているか確認

#### Q: データベースエラーが出る
A: マイグレーションを実行：
```bash
npx wrangler d1 migrations apply <組織名>-task-manager-db
```

## 🎯 まとめ

**7名規模の社労士事務所なら：**
- ✅ 組織ごとの個別デプロイが最適
- ✅ 無料プランで十分運用可能
- ✅ セキュリティとプライバシーを確保
- ✅ 必要に応じて個別カスタマイズ可能

組織が増えても、デプロイスクリプトで簡単に追加できます！
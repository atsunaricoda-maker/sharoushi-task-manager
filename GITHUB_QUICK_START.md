# 🚀 GitHub連携クイックスタートガイド

## atsunariさん専用のGitHub連携手順

### ステップ1: GitHubリポジトリを作成

1. [GitHub](https://github.com) にログイン
2. 右上の「+」→「New repository」をクリック
3. 以下を設定：
   - Repository name: `sharoushi-task-manager`
   - Description: `社労士事務所タスク管理システム（自動スケジュール調整機能付き）`
   - Private repository を選択（重要！）
   - **"Initialize this repository with:"のチェックは全て外す**
4. 「Create repository」をクリック

### ステップ2: ローカルリポジトリをGitHubに接続

作成したリポジトリページで表示されるコマンドをコピーして実行：

```bash
# サンドボックス内で実行
cd /home/user/webapp

# GitHubリポジトリと接続（URLはあなたのものに置き換え）
git remote add origin https://github.com/<あなたのユーザー名>/sharoushi-task-manager.git

# mainブランチに切り替え
git branch -M main

# GitHubにプッシュ
git push -u origin main
```

### ステップ3: GitHub Secretsの設定

1. GitHubリポジトリページで「Settings」タブをクリック
2. 左メニューから「Secrets and variables」→「Actions」
3. 「New repository secret」をクリック
4. 以下のSecretを追加：

| Secret名 | 値 | 取得方法 |
|---------|-----|---------|
| `CLOUDFLARE_API_TOKEN` | （あなたのトークン） | Cloudflare → My Profile → API Tokens → Create Token |
| `CLOUDFLARE_ACCOUNT_ID` | （あなたのアカウントID） | Cloudflare Dashboard 右上に表示 |

### ステップ4: Cloudflare Pages と GitHub を連携

#### 方法A: Cloudflare Dashboard から（推奨・簡単）

1. [Cloudflare Dashboard](https://dash.cloudflare.com) にログイン
2. 左メニューから「Workers & Pages」
3. 「Create application」→「Pages」→「Connect to Git」
4. GitHubアカウントを連携
5. `sharoushi-task-manager` リポジトリを選択
6. 以下を設定：
   - Project name: `atsunari-task-manager`
   - Production branch: `main`
   - Build command: `npm run build`
   - Build output directory: `dist`
7. 環境変数を設定（Environment variables）：
   - `GEMINI_API_KEY`: （あなたのAPIキー）
   - `SENDGRID_API_KEY`: （必要な場合）
   - その他必要な環境変数
8. 「Save and Deploy」

#### 方法B: GitHub Actions 経由（自動化）

`.github/workflows/deploy.yml` が既に設定済みなので、
GitHub Secretsを設定後、mainブランチにpushすると自動デプロイされます。

### ステップ5: 動作確認

```bash
# 何か小さな変更を加えてテスト
echo "# Last updated: $(date)" >> README.md

# コミット＆プッシュ
git add .
git commit -m "test: 自動デプロイのテスト"
git push origin main
```

### 🎉 完了！

これで以下が実現されました：
- ✅ コード変更が自動的にCloudflare Pagesにデプロイ
- ✅ GitHubでバージョン管理
- ✅ Pull Requestでコードレビュー可能
- ✅ バックアップも自動化

### 📝 今後の開発フロー

```bash
# 1. 新機能の開発
git checkout -b feature/新機能名
# ... コード編集 ...

# 2. コミット
git add .
git commit -m "feat: 新機能の説明"

# 3. プッシュ
git push origin feature/新機能名

# 4. GitHubでPull Requestを作成
# 5. レビュー後、mainにマージ → 自動デプロイ！
```

### 🆘 トラブルシューティング

**Q: Permission deniedエラーが出る**
A: GitHubの認証設定が必要です：
```bash
git config --global user.name "あなたの名前"
git config --global user.email "あなたのメール"
```

**Q: デプロイが失敗する**
A: GitHub Actions のログを確認：
- GitHubリポジトリ → Actions タブ
- 失敗したワークフローをクリックしてログ確認

**Q: Cloudflare Pagesで404エラー**
A: ビルド設定を確認：
- Build command: `npm run build`
- Output directory: `dist`

---

## 🎯 次のアクション

1. **GitHub リポジトリ作成** ← まずはこれ！
2. **git remote add** でリポジトリ接続
3. **git push** でコードアップロード
4. **Cloudflare連携** で自動デプロイ設定

準備ができたら教えてください。一緒に設定を進めましょう！
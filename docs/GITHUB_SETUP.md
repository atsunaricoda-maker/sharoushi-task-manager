# GitHub連携セットアップガイド

## 🎯 GitHub連携の目的

1. **バージョン管理**: すべての変更履歴を追跡
2. **自動デプロイ**: pushするだけで本番環境に反映
3. **コードレビュー**: Pull Requestで品質管理
4. **バックアップ**: コードの安全な保管
5. **チーム開発**: 複数人での開発が可能に

## 🚀 初期セットアップ

### 1. GitHubリポジトリの作成

```bash
# GitHubで新しいリポジトリを作成
# リポジトリ名: sharoushi-task-manager

# ローカルでGitを初期化（既に完了済み）
git init
git add .
git commit -m "Initial commit: 社労士事務所タスク管理システム"

# GitHubリポジトリと連携
git remote add origin https://github.com/<あなたのユーザー名>/sharoushi-task-manager.git
git branch -M main
git push -u origin main
```

### 2. GitHub Secrets の設定

GitHubリポジトリの Settings → Secrets and variables → Actions で以下を設定：

| Secret名 | 値の取得方法 |
|---------|------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare Dashboard → My Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard → 右上のアカウントID |
| `GEMINI_API_KEY` | Google AI Studio から取得 |
| `SENDGRID_API_KEY` | SendGrid Dashboard から取得 |

### 3. Cloudflare Pages との連携

#### 方法A: GitHub Actions経由（推奨）
`.github/workflows/deploy.yml` を使用して自動デプロイ

#### 方法B: Cloudflare Pages直接連携
1. Cloudflare Dashboard → Pages
2. 「Create a project」→「Connect to Git」
3. GitHubアカウントを連携
4. リポジトリを選択
5. ビルド設定：
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variables: 上記のSecretsと同じ値を設定

## 📝 開発フロー

### 基本的な開発フロー

```bash
# 1. 機能ブランチを作成
git checkout -b feature/new-feature

# 2. 開発・コミット
git add .
git commit -m "feat: 新機能の追加"

# 3. GitHubにpush
git push origin feature/new-feature

# 4. Pull Requestを作成（GitHub上で）

# 5. レビュー後、mainにマージ
# → 自動的にCloudflare Pagesにデプロイされる
```

### コミットメッセージの規約

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードスタイルの変更
refactor: リファクタリング
test: テストの追加・修正
chore: ビルドプロセスや補助ツールの変更
```

## 🔄 複数組織への展開

### 組織別ブランチ戦略

```
main → メインの開発ブランチ
├── deploy/atsunari-office → atsunari事務所用
├── deploy/tanaka-office → 田中事務所用
└── deploy/yamada-office → 山田事務所用
```

### 組織別デプロイ設定

`.github/workflows/deploy-org.yml`:

```yaml
name: Deploy to Organization

on:
  push:
    branches:
      - 'deploy/*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Extract org name
        run: |
          BRANCH=${GITHUB_REF#refs/heads/deploy/}
          echo "ORG_NAME=$BRANCH" >> $GITHUB_ENV
      
      - name: Build and Deploy
        run: |
          npm ci
          npm run build
          npx wrangler pages deploy dist \
            --project-name ${{ env.ORG_NAME }}-task-manager
```

## 🛡️ セキュリティ対策

### 1. .gitignore の確認

```gitignore
# 環境変数
.env*
.dev.vars

# ビルド成果物
dist/
.wrangler/

# 依存関係
node_modules/

# ログ
*.log

# IDE設定
.vscode/
.idea/
```

### 2. セキュリティスキャン

GitHub Actions で自動セキュリティチェック：
- Dependabot: 依存関係の脆弱性チェック
- CodeQL: コードの脆弱性分析
- npm audit: パッケージの脆弱性チェック

## 📊 モニタリング

### GitHub Insights の活用

- **Actions**: デプロイ状況の確認
- **Pull Requests**: コードレビューの状況
- **Issues**: バグや機能要望の管理
- **Projects**: タスク管理

## 🔧 トラブルシューティング

### デプロイが失敗する場合

1. GitHub Secrets が正しく設定されているか確認
2. Cloudflare API Token の権限を確認
3. ビルドログでエラーメッセージを確認

### Permission denied エラー

```bash
# Git認証情報をリセット
git config --global --unset credential.helper
git config --global credential.helper store
```

## 🚀 次のステップ

1. **GitHub リポジトリ作成**: まず公開/プライベートリポジトリを作成
2. **Secrets 設定**: Cloudflare APIトークンなどを設定
3. **初回push**: コードをGitHubにアップロード
4. **自動デプロイ確認**: GitHub Actions が正常に動作することを確認

これで、コード変更がすぐに本番環境に反映される環境が整います！
#!/bin/bash

# GitHub連携スクリプト
# 使い方: ./github-push.sh <GitHubユーザー名>

GITHUB_USER=$1

if [ -z "$GITHUB_USER" ]; then
    echo "❌ エラー: GitHubユーザー名を指定してください"
    echo "使い方: ./github-push.sh <あなたのGitHubユーザー名>"
    echo "例: ./github-push.sh atsunari"
    exit 1
fi

echo "🚀 GitHub連携を開始します..."
echo "ユーザー名: $GITHUB_USER"
echo "リポジトリ: sharoushi-task-manager"
echo ""

# 現在のディレクトリを確認
if [ ! -f "package.json" ]; then
    echo "❌ エラー: package.jsonが見つかりません"
    echo "正しいディレクトリで実行してください"
    exit 1
fi

# Git設定
echo "📝 Gitユーザー情報を設定中..."
git config --global user.name "$GITHUB_USER"
git config --global user.email "$GITHUB_USER@users.noreply.github.com"

# リモートリポジトリの設定
echo "🔗 GitHubリポジトリと接続中..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/$GITHUB_USER/sharoushi-task-manager.git"

# ブランチ名をmainに変更
echo "🌿 ブランチをmainに設定中..."
git branch -M main

# GitHubにプッシュ
echo "📤 コードをGitHubにアップロード中..."
echo ""
echo "⚠️  GitHubの認証情報が必要です："
echo "1. ユーザー名: $GITHUB_USER"
echo "2. パスワード: Personal Access Token（パスワードではありません）"
echo ""
echo "Personal Access Tokenの作成方法："
echo "1. GitHub.com → Settings → Developer settings → Personal access tokens"
echo "2. 'Generate new token (classic)' をクリック"
echo "3. 必要な権限: repo（全てチェック）"
echo "4. Generate token → トークンをコピー"
echo ""
read -p "準備ができたらEnterキーを押してください..."

git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 成功！GitHubへのアップロードが完了しました！"
    echo ""
    echo "🌐 あなたのリポジトリURL:"
    echo "   https://github.com/$GITHUB_USER/sharoushi-task-manager"
    echo ""
    echo "📝 次のステップ:"
    echo "1. 上記URLにアクセスして、コードが表示されることを確認"
    echo "2. Cloudflare Pagesと連携（自動デプロイ設定）"
    echo "3. 開発開始！"
else
    echo ""
    echo "❌ エラーが発生しました"
    echo ""
    echo "よくある原因:"
    echo "1. Personal Access Tokenが正しくない"
    echo "2. リポジトリがまだ作成されていない"
    echo "3. ネットワークの問題"
    echo ""
    echo "解決方法:"
    echo "1. GitHubでリポジトリ 'sharoushi-task-manager' が作成されているか確認"
    echo "2. Personal Access Tokenを再生成して試す"
fi
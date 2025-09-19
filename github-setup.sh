#!/bin/bash

# GitHub連携スクリプト
echo "🚀 GitHub連携を開始します..."

# GitHubのユーザー名を入力
read -p "GitHubのユーザー名を入力してください: " GITHUB_USERNAME

# リポジトリ名の確認
read -p "リポジトリ名を入力してください (デフォルト: sharoushi-task-manager): " REPO_NAME
REPO_NAME=${REPO_NAME:-sharoushi-task-manager}

# リモートリポジトリを追加
echo "📎 GitHubリポジトリと接続中..."
git remote add origin https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git

# 確認
echo "✅ 接続設定完了！"
git remote -v

# ブランチ名をmainに変更
echo "🔄 ブランチ名をmainに設定..."
git branch -M main

# プッシュ
echo "📤 GitHubにコードをアップロード中..."
echo "※ GitHubのユーザー名とパスワード（またはトークン）を求められます"
git push -u origin main

echo "🎉 完了！GitHubにコードがアップロードされました！"
echo "📌 次のURLでコードを確認できます:"
echo "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"
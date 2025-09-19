# 📋 Google OAuth設定の更新方法

## Google Cloud Consoleで取得したら、以下のコマンドを実行：

### 1. .dev.varsファイルを編集
```bash
# ファイルを開いて編集
nano .dev.vars
```

### 2. 以下の部分を更新
```
GOOGLE_CLIENT_ID=取得したクライアントID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-取得したシークレット
```

### 3. 保存して終了
- Ctrl + X → Y → Enter

### 4. サービス再起動
```bash
pm2 restart sharoushi-task-manager
```

### 5. ログイン画面にアクセス
```
https://3000-ivn6amwip8uhxdg63ar73-6532622b.e2b.dev/login
```

## ✅ 動作確認
- Googleログインボタンをクリック
- Googleアカウント選択画面が出れば成功！
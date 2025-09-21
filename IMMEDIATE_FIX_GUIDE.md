# 🚨 IMMEDIATE PRODUCTION FIX GUIDE

## 🎯 Current Issue
Production is still showing 500 errors because the database migrations haven't been applied yet.

## ⚡ QUICK FIX - Execute Now

### Option 1: Command Line (Recommended)

1. **Open Terminal/Command Prompt on your local machine**

2. **Navigate to project directory:**
```bash
cd /path/to/sharoushi-task-manager
git pull origin main
```

3. **Authenticate with Cloudflare:**
```bash
# Option A: Login via browser
npx wrangler login

# Option B: Use API token (if you have one)
export CLOUDFLARE_API_TOKEN="your-api-token-here"
```

4. **Apply the database fix immediately:**
```bash
# Run the automated fix script
chmod +x deploy-database-fix.sh
./deploy-database-fix.sh
```

OR manually:

```bash
# Apply complete schema
npx wrangler d1 execute sharoushi-task-manager-db \
  --file=./migrations/production_complete_schema.sql \
  --remote

# Add sample data
npx wrangler d1 execute sharoushi-task-manager-db \
  --file=./migrations/production_sample_data.sql \
  --remote

# Verify the fix
npx wrangler d1 execute sharoushi-task-manager-db \
  --remote \
  --command="PRAGMA table_info(subsidy_applications);"
```

### Option 2: GitHub Actions (Automated)

1. **Go to GitHub repository:** https://github.com/atsunaricoda-maker/sharoushi-task-manager

2. **Set up Cloudflare API Token:**
   - Go to Repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `CLOUDFLARE_API_TOKEN`
   - Value: Your Cloudflare API token

3. **Run the automated deployment:**
   - Go to Actions tab
   - Click "Deploy Database Schema to Production"
   - Click "Run workflow"
   - Select options and run

### Option 3: Cloudflare Dashboard (Manual)

1. **Go to Cloudflare Dashboard:**
   - https://dash.cloudflare.com/
   - Navigate to D1 → sharoushi-task-manager-db

2. **Execute SQL manually:**
   - Open the "Console" tab
   - Copy and paste the content from `migrations/production_complete_schema.sql`
   - Execute the SQL

## 🔍 After Fix - Verification

### Test these URLs:
- **Main App:** https://sharoushi-task-manager.pages.dev
- **Subsidies:** https://sharoushi-task-manager.pages.dev/subsidies

### Check for success:
- ✅ No more 500 errors
- ✅ 助成金一覧が表示される
- ✅ "厚労省から更新" ボタンが動作する
- ✅ "全ソース一括更新" ボタンが動作する
- ✅ エラーメッセージが消える

## 📊 Expected Results

After applying the fix, you should see:

1. **助成金情報管理** section working properly
2. **厚生労働省** data fetch working (green checkmark)
3. **全ソース統合** working without 500 errors
4. Console errors cleared

## 🚨 If Still Not Working

If you continue to see errors after applying the database migration:

### Check D1 Binding in Cloudflare Pages:

1. Go to **Cloudflare Dashboard** → **Pages**
2. Select **sharoushi-task-manager** project
3. Go to **Settings** → **Functions**
4. Check **D1 database bindings**:
   - Variable name: `DB`
   - D1 database: `sharoushi-task-manager-db`

### Verify Database ID:

```bash
# Check your database ID matches wrangler.jsonc
npx wrangler d1 list
```

Make sure the database ID in `wrangler.jsonc` matches your actual D1 database.

## ⏰ Time Estimate
- **Command line fix:** 2-3 minutes
- **GitHub Actions:** 5 minutes (includes setup)
- **Manual dashboard:** 10 minutes

The fix should be immediate once the database migrations are applied! 🚀

---

## 📞 Still Need Help?

If you're having trouble with any of these steps:

1. **Check Cloudflare API Token:** Make sure it has D1 edit permissions
2. **Verify Database Name:** Ensure `sharoushi-task-manager-db` exists in your Cloudflare account
3. **Check wrangler.jsonc:** Verify the database ID matches your actual D1 database

The database schema is ready - we just need to apply it to production! 💪
export function getSettingsPage(userName: string): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>設定 - 社労士事務所タスク管理</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        .toggle-switch {
            position: relative;
            display: inline-block;
            width: 60px;
            height: 28px;
        }
        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: 0.4s;
            border-radius: 28px;
        }
        .slider:before {
            position: absolute;
            content: "";
            height: 20px;
            width: 20px;
            left: 4px;
            bottom: 4px;
            background-color: white;
            transition: 0.4s;
            border-radius: 50%;
        }
        input:checked + .slider {
            background-color: #0066cc;
        }
        input:checked + .slider:before {
            transform: translateX(32px);
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center space-x-8">
                    <h1 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-cog mr-2 text-blue-600"></i>
                        設定
                    </h1>
                    <nav class="flex space-x-4">
                        <a href="/" class="px-3 py-2 text-gray-700 hover:text-gray-900">
                            <i class="fas fa-home mr-1"></i>ダッシュボード
                        </a>
                        <a href="/clients" class="px-3 py-2 text-gray-700 hover:text-gray-900">
                            <i class="fas fa-building mr-1"></i>顧問先
                        </a>
                        <a href="/reports" class="px-3 py-2 text-gray-700 hover:text-gray-900">
                            <i class="fas fa-chart-bar mr-1"></i>レポート
                        </a>
                        <a href="/settings" class="px-3 py-2 text-blue-600 font-medium">
                            <i class="fas fa-cog mr-1"></i>設定
                        </a>
                    </nav>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-600">
                        <i class="fas fa-user-circle mr-1"></i>${userName}
                    </span>
                    <button onclick="window.location.href='/auth/logout'" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- 左側メニュー -->
            <div class="lg:col-span-1">
                <div class="bg-white rounded-lg shadow">
                    <nav class="space-y-1 p-4">
                        <button onclick="showSection('notification')" class="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center section-btn active" data-section="notification">
                            <i class="fas fa-bell mr-3 text-gray-600"></i>
                            <span>通知設定</span>
                        </button>
                        <button onclick="showSection('profile')" class="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center section-btn" data-section="profile">
                            <i class="fas fa-user mr-3 text-gray-600"></i>
                            <span>プロフィール</span>
                        </button>
                        <button onclick="showSection('integration')" class="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center section-btn" data-section="integration">
                            <i class="fas fa-plug mr-3 text-gray-600"></i>
                            <span>連携設定</span>
                        </button>
                        <button onclick="showSection('security')" class="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 flex items-center section-btn" data-section="security">
                            <i class="fas fa-shield-alt mr-3 text-gray-600"></i>
                            <span>セキュリティ</span>
                        </button>
                    </nav>
                </div>
            </div>

            <!-- 右側コンテンツ -->
            <div class="lg:col-span-2">
                <!-- 通知設定 -->
                <div id="notification-section" class="settings-section bg-white rounded-lg shadow p-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-6">
                        <i class="fas fa-bell mr-2 text-blue-600"></i>
                        通知設定
                    </h2>
                    
                    <div class="space-y-6">
                        <!-- メール通知 -->
                        <div class="border-b pb-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">メール通知</h3>
                            <div class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="font-medium text-gray-700">タスクリマインダー</p>
                                        <p class="text-sm text-gray-500">期限前にメールでお知らせ</p>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="email-reminder" checked>
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="font-medium text-gray-700">日次サマリー</p>
                                        <p class="text-sm text-gray-500">毎朝9時に当日のタスク一覧を送信</p>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="email-daily" checked>
                                        <span class="slider"></span>
                                    </label>
                                </div>
                                
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="font-medium text-gray-700">週次レポート</p>
                                        <p class="text-sm text-gray-500">毎週月曜日に先週の実績を送信</p>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="email-weekly" checked>
                                        <span class="slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <!-- リマインダー設定 -->
                        <div class="border-b pb-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">リマインダー設定</h3>
                            <div class="space-y-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        タスク期限の何日前に通知するか
                                    </label>
                                    <select id="reminder-days" class="w-full max-w-xs rounded-lg border-gray-300 focus:border-blue-500">
                                        <option value="1">1日前</option>
                                        <option value="2">2日前</option>
                                        <option value="3" selected>3日前</option>
                                        <option value="5">5日前</option>
                                        <option value="7">7日前</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <!-- ブラウザ通知 -->
                        <div class="border-b pb-6">
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">ブラウザ通知</h3>
                            <div class="space-y-4">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p class="font-medium text-gray-700">デスクトップ通知</p>
                                        <p class="text-sm text-gray-500">ブラウザのプッシュ通知を有効化</p>
                                    </div>
                                    <label class="toggle-switch">
                                        <input type="checkbox" id="browser-notification">
                                        <span class="slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 保存ボタン -->
                        <div class="flex justify-end">
                            <button onclick="saveNotificationSettings()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                                <i class="fas fa-save mr-2"></i>設定を保存
                            </button>
                        </div>
                    </div>
                </div>

                <!-- プロフィール設定 -->
                <div id="profile-section" class="settings-section bg-white rounded-lg shadow p-6 hidden">
                    <h2 class="text-xl font-bold text-gray-900 mb-6">
                        <i class="fas fa-user mr-2 text-blue-600"></i>
                        プロフィール設定
                    </h2>
                    
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">名前</label>
                            <input type="text" id="profile-name" value="${userName}" class="w-full rounded-lg border-gray-300 focus:border-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">メールアドレス</label>
                            <input type="email" id="profile-email" readonly class="w-full rounded-lg border-gray-300 bg-gray-50">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">役職</label>
                            <input type="text" id="profile-role" value="社労士" class="w-full rounded-lg border-gray-300 focus:border-blue-500">
                        </div>
                    </div>
                </div>

                <!-- 連携設定 -->
                <div id="integration-section" class="settings-section bg-white rounded-lg shadow p-6 hidden">
                    <h2 class="text-xl font-bold text-gray-900 mb-6">
                        <i class="fas fa-plug mr-2 text-blue-600"></i>
                        外部サービス連携
                    </h2>
                    
                    <div class="space-y-6">
                        <div class="border rounded-lg p-4">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center">
                                    <img src="https://www.gstatic.com/images/branding/product/1x/gmail_48dp.png" alt="Gmail" class="w-8 h-8 mr-3">
                                    <div>
                                        <p class="font-medium">Gmail</p>
                                        <p class="text-sm text-green-600">連携済み</p>
                                    </div>
                                </div>
                                <button class="text-gray-500 hover:text-gray-700">
                                    <i class="fas fa-cog"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="border rounded-lg p-4">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center">
                                    <img src="https://www.gstatic.com/images/branding/product/1x/calendar_48dp.png" alt="Calendar" class="w-8 h-8 mr-3">
                                    <div>
                                        <p class="font-medium">Google Calendar</p>
                                        <p class="text-sm text-gray-500">未連携</p>
                                    </div>
                                </div>
                                <button class="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700">
                                    連携する
                                </button>
                            </div>
                        </div>
                        
                        <div class="border rounded-lg p-4">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center">
                                    <img src="https://www.gstatic.com/images/branding/product/1x/drive_48dp.png" alt="Drive" class="w-8 h-8 mr-3">
                                    <div>
                                        <p class="font-medium">Google Drive</p>
                                        <p class="text-sm text-gray-500">未連携</p>
                                    </div>
                                </div>
                                <button class="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700">
                                    連携する
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- セキュリティ設定 -->
                <div id="security-section" class="settings-section bg-white rounded-lg shadow p-6 hidden">
                    <h2 class="text-xl font-bold text-gray-900 mb-6">
                        <i class="fas fa-shield-alt mr-2 text-blue-600"></i>
                        セキュリティ設定
                    </h2>
                    
                    <div class="space-y-6">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800 mb-4">ログイン履歴</h3>
                            <div class="space-y-2">
                                <div class="border rounded-lg p-3">
                                    <div class="flex justify-between items-center">
                                        <div>
                                            <p class="font-medium">Chrome - Windows</p>
                                            <p class="text-sm text-gray-500">2025-09-19 10:30</p>
                                        </div>
                                        <span class="text-green-600 text-sm">現在のセッション</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        // 設定セクションの切り替え
        function showSection(section) {
            // すべてのセクションを非表示
            document.querySelectorAll('.settings-section').forEach(el => {
                el.classList.add('hidden');
            });
            
            // すべてのボタンからアクティブクラスを削除
            document.querySelectorAll('.section-btn').forEach(btn => {
                btn.classList.remove('bg-blue-50', 'border-l-4', 'border-blue-600');
            });
            
            // 選択されたセクションを表示
            document.getElementById(section + '-section').classList.remove('hidden');
            
            // アクティブなボタンにスタイルを適用
            const activeBtn = document.querySelector(\`[data-section="\${section}"]\`);
            activeBtn.classList.add('bg-blue-50', 'border-l-4', 'border-blue-600');
        }
        
        // 通知設定を読み込み
        async function loadNotificationSettings() {
            try {
                const res = await axios.get('/api/notifications/settings');
                const settings = res.data.settings;
                
                document.getElementById('email-reminder').checked = settings.email;
                document.getElementById('email-daily').checked = settings.daily_summary;
                document.getElementById('email-weekly').checked = settings.weekly_report;
                document.getElementById('browser-notification').checked = settings.browser;
                document.getElementById('reminder-days').value = settings.reminderDays || 3;
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        }
        
        // 通知設定を保存
        async function saveNotificationSettings() {
            try {
                const settings = {
                    email: document.getElementById('email-reminder').checked,
                    daily_summary: document.getElementById('email-daily').checked,
                    weekly_report: document.getElementById('email-weekly').checked,
                    browser: document.getElementById('browser-notification').checked,
                    reminderDays: parseInt(document.getElementById('reminder-days').value)
                };
                
                await axios.put('/api/notifications/settings', settings);
                alert('設定を保存しました');
            } catch (error) {
                alert('設定の保存に失敗しました');
            }
        }
        
        // ブラウザ通知の権限をリクエスト
        document.getElementById('browser-notification')?.addEventListener('change', async (e) => {
            if (e.target.checked && 'Notification' in window) {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    e.target.checked = false;
                    alert('ブラウザ通知を有効にするには、ブラウザの設定で通知を許可してください');
                }
            }
        });
        
        // 初期設定読み込み
        document.addEventListener('DOMContentLoaded', loadNotificationSettings);
    </script>
</body>
</html>
  `
}
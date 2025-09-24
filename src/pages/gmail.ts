/**
 * Gmail Page
 * Gmail連携の管理画面
 */

export function getGmailPage(userName: string): string {
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gmail連携 - 労務管理タスクシステム</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <!-- ナビゲーション -->
        <nav class="bg-white shadow-sm border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex">
                        <div class="flex-shrink-0 flex items-center">
                            <h1 class="text-xl font-bold text-gray-800">労務管理タスクシステム</h1>
                        </div>
                        <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <a href="/" class="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                <i class="fas fa-home mr-1"></i> ダッシュボード
                            </a>
                            <a href="/clients" class="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                <i class="fas fa-building mr-1"></i> 顧客管理
                            </a>
                            <a href="/reports" class="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                <i class="fas fa-file-alt mr-1"></i> レポート
                            </a>
                            <a href="/gmail" class="border-b-2 border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                <i class="fas fa-envelope mr-1"></i> Gmail連携
                            </a>
                            <a href="/settings" class="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                <i class="fas fa-cog mr-1"></i> 設定
                            </a>
                        </div>
                    </div>
                    <div class="flex items-center">
                        <span class="text-gray-700 mr-4">
                            <i class="fas fa-user mr-1"></i> ${userName}
                        </span>
                        <button onclick="logout()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-sign-out-alt"></i> ログアウト
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <div class="max-w-7xl mx-auto px-4 py-8">
            <!-- タブナビゲーション -->
            <div class="border-b border-gray-200 mb-6">
                <nav class="-mb-px flex space-x-8">
                    <button onclick="switchTab('inbox')" class="tab-btn active" data-tab="inbox">
                        <i class="fas fa-inbox mr-2"></i>
                        受信トレイ
                    </button>
                    <button onclick="switchTab('compose')" class="tab-btn" data-tab="compose">
                        <i class="fas fa-pen mr-2"></i>
                        メール作成
                    </button>
                    <button onclick="switchTab('automation')" class="tab-btn" data-tab="automation">
                        <i class="fas fa-robot mr-2"></i>
                        自動処理
                    </button>
                    <button onclick="switchTab('templates')" class="tab-btn" data-tab="templates">
                        <i class="fas fa-file-lines mr-2"></i>
                        テンプレート
                    </button>
                </nav>
            </div>

            <!-- 受信トレイタブ -->
            <div id="inbox-tab" class="tab-content">
                <div class="bg-white rounded-lg shadow">
                    <!-- 検索バー -->
                    <div class="border-b border-gray-200 px-6 py-4">
                        <div class="flex items-center space-x-4">
                            <div class="flex-1">
                                <input type="text" id="emailSearchInput" placeholder="メールを検索..." 
                                    class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            </div>
                            <button onclick="refreshEmails()" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                <i class="fas fa-sync mr-2"></i>更新
                            </button>
                            <button onclick="processClientEmails()" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                                <i class="fas fa-magic mr-2"></i>タスク自動生成
                            </button>
                        </div>
                    </div>
                    
                    <!-- メールリスト -->
                    <div id="emailList" class="divide-y divide-gray-200">
                        <div class="px-6 py-4 text-center text-gray-500">
                            メールを読み込み中...
                        </div>
                    </div>
                </div>
            </div>

            <!-- メール作成タブ -->
            <div id="compose-tab" class="tab-content hidden">
                <div class="bg-white rounded-lg shadow p-6">
                    <form onsubmit="sendEmail(event)">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">宛先</label>
                                <input type="email" id="emailTo" required multiple
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="example@gmail.com">
                                <small class="text-gray-500">複数の場合はカンマ区切り</small>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700">CC</label>
                                <input type="email" id="emailCc" multiple
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700">件名</label>
                                <input type="text" id="emailSubject" required
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700">本文</label>
                                <textarea id="emailBody" rows="10" required
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"></textarea>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">テンプレート選択</label>
                                <select onchange="loadTemplate(this.value)" 
                                    class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                    <option value="">-- テンプレートを選択 --</option>
                                    <option value="progress">進捗報告</option>
                                    <option value="reminder">リマインダー</option>
                                    <option value="completion">完了報告</option>
                                    <option value="inquiry">お問い合わせ</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="mt-6 flex justify-end space-x-3">
                            <button type="button" onclick="clearCompose()" 
                                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                                クリア
                            </button>
                            <button type="submit" 
                                class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                <i class="fas fa-paper-plane mr-2"></i>送信
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- 自動処理タブ -->
            <div id="automation-tab" class="tab-content hidden">
                <div class="bg-white rounded-lg shadow">
                    <div class="p-6">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">自動処理設定</h3>
                        
                        <div class="space-y-4">
                            <!-- クライアントメール自動処理 -->
                            <div class="border rounded-lg p-4">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h4 class="font-medium text-gray-900">クライアントメールからタスク自動生成</h4>
                                        <p class="text-sm text-gray-500 mt-1">
                                            登録済みクライアントからの未読メールを自動的にタスク化します
                                        </p>
                                    </div>
                                    <button onclick="processClientEmails()" 
                                        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                        <i class="fas fa-play mr-2"></i>実行
                                    </button>
                                </div>
                            </div>
                            
                            <!-- 進捗報告自動送信 -->
                            <div class="border rounded-lg p-4">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h4 class="font-medium text-gray-900">進捗報告の自動送信</h4>
                                        <p class="text-sm text-gray-500 mt-1">
                                            クライアントごとに進捗状況を自動でメール送信します
                                        </p>
                                    </div>
                                    <div class="flex items-center space-x-2">
                                        <select id="clientSelectForReport" 
                                            class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                            <option value="">クライアント選択</option>
                                        </select>
                                        <button onclick="sendProgressReport()" 
                                            class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                                            <i class="fas fa-envelope mr-2"></i>送信
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- テンプレートタブ -->
            <div id="templates-tab" class="tab-content hidden">
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">メールテンプレート</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="border rounded-lg p-4">
                            <h4 class="font-medium text-gray-900">進捗報告</h4>
                            <p class="text-sm text-gray-500 mt-1">タスクの進捗状況を報告するテンプレート</p>
                            <button onclick="useTemplate('progress')" class="mt-2 text-blue-600 hover:text-blue-800">
                                <i class="fas fa-arrow-right mr-1"></i>使用する
                            </button>
                        </div>
                        
                        <div class="border rounded-lg p-4">
                            <h4 class="font-medium text-gray-900">リマインダー</h4>
                            <p class="text-sm text-gray-500 mt-1">期限のリマインドを送るテンプレート</p>
                            <button onclick="useTemplate('reminder')" class="mt-2 text-blue-600 hover:text-blue-800">
                                <i class="fas fa-arrow-right mr-1"></i>使用する
                            </button>
                        </div>
                        
                        <div class="border rounded-lg p-4">
                            <h4 class="font-medium text-gray-900">完了報告</h4>
                            <p class="text-sm text-gray-500 mt-1">タスク完了を報告するテンプレート</p>
                            <button onclick="useTemplate('completion')" class="mt-2 text-blue-600 hover:text-blue-800">
                                <i class="fas fa-arrow-right mr-1"></i>使用する
                            </button>
                        </div>
                        
                        <div class="border rounded-lg p-4">
                            <h4 class="font-medium text-gray-900">お問い合わせ</h4>
                            <p class="text-sm text-gray-500 mt-1">情報確認のお問い合わせテンプレート</p>
                            <button onclick="useTemplate('inquiry')" class="mt-2 text-blue-600 hover:text-blue-800">
                                <i class="fas fa-arrow-right mr-1"></i>使用する
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .tab-btn {
                @apply py-2 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300;
            }
            .tab-btn.active {
                @apply border-blue-500 text-blue-600;
            }
        </style>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // タブ切り替え
            function switchTab(tabName) {
                // タブボタンの状態更新
                document.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.tab === tabName) {
                        btn.classList.add('active');
                    }
                });
                
                // タブコンテンツの表示切り替え
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.add('hidden');
                });
                document.getElementById(tabName + '-tab').classList.remove('hidden');
                
                // タブに応じたデータ読み込み
                if (tabName === 'inbox') {
                    loadEmails();
                } else if (tabName === 'automation') {
                    loadClients();
                }
            }
            
            // メール一覧読み込み
            async function loadEmails() {
                try {
                    const response = await axios.get('/api/gmail/messages?maxResults=20');
                    const messages = response.data.messages;
                    
                    const emailList = document.getElementById('emailList');
                    if (messages.length === 0) {
                        emailList.innerHTML = '<div class="px-6 py-4 text-center text-gray-500">メールがありません</div>';
                        return;
                    }
                    
                    emailList.innerHTML = messages.map(msg => \`
                        <div class="px-6 py-4 hover:bg-gray-50 cursor-pointer">
                            <div class="flex items-start">
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        \${msg.isUnread ? '<span class="w-2 h-2 bg-blue-600 rounded-full mr-2"></span>' : ''}
                                        <span class="font-medium text-gray-900">\${escapeHtml(msg.from)}</span>
                                        <span class="ml-auto text-sm text-gray-500">\${formatDate(msg.date)}</span>
                                    </div>
                                    <div class="mt-1">
                                        <span class="text-sm font-medium text-gray-900">\${escapeHtml(msg.subject)}</span>
                                    </div>
                                    <div class="mt-1 text-sm text-gray-600">
                                        \${escapeHtml(msg.snippet)}
                                    </div>
                                    <div class="mt-2 flex items-center space-x-2">
                                        <button onclick="markAsRead('\${msg.id}')" class="text-xs text-blue-600 hover:text-blue-800">
                                            <i class="fas fa-check mr-1"></i>既読にする
                                        </button>
                                        <button onclick="createTaskFromEmail('\${msg.id}')" class="text-xs text-green-600 hover:text-green-800">
                                            <i class="fas fa-plus mr-1"></i>タスク作成
                                        </button>
                                        <button onclick="archiveEmail('\${msg.id}')" class="text-xs text-gray-600 hover:text-gray-800">
                                            <i class="fas fa-archive mr-1"></i>アーカイブ
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    \`).join('');
                } catch (error) {
                    console.error('Failed to load emails:', error);
                    if (error.response?.status === 401) {
                        alert('Googleアカウントの再認証が必要です。設定画面から再度ログインしてください。');
                    }
                }
            }
            
            // メール送信
            async function sendEmail(event) {
                event.preventDefault();
                
                try {
                    const to = document.getElementById('emailTo').value.split(',').map(e => e.trim());
                    const cc = document.getElementById('emailCc').value ? 
                        document.getElementById('emailCc').value.split(',').map(e => e.trim()) : [];
                    
                    const response = await axios.post('/api/gmail/send', {
                        to,
                        cc,
                        subject: document.getElementById('emailSubject').value,
                        body: document.getElementById('emailBody').value
                    });
                    
                    alert('メールを送信しました');
                    clearCompose();
                } catch (error) {
                    console.error('Failed to send email:', error);
                    alert('メール送信に失敗しました: ' + (error.response?.data?.message || error.message));
                }
            }
            
            // クライアントメール処理
            async function processClientEmails() {
                if (!confirm('クライアントからのメールを自動処理してタスクを作成しますか？')) return;
                
                try {
                    const response = await axios.post('/api/gmail/process-client-emails');
                    alert(\`\${response.data.tasksCreated}件のタスクを作成しました\`);
                } catch (error) {
                    console.error('Failed to process emails:', error);
                    alert('処理に失敗しました: ' + (error.response?.data?.message || error.message));
                }
            }
            
            // 進捗報告送信
            async function sendProgressReport() {
                const clientId = document.getElementById('clientSelectForReport').value;
                if (!clientId) {
                    alert('クライアントを選択してください');
                    return;
                }
                
                if (!confirm('選択したクライアントに進捗報告を送信しますか？')) return;
                
                try {
                    await axios.post(\`/api/gmail/send-progress-report/\${clientId}\`);
                    alert('進捗報告を送信しました');
                } catch (error) {
                    console.error('Failed to send report:', error);
                    alert('送信に失敗しました: ' + (error.response?.data?.message || error.message));
                }
            }
            
            // クライアント一覧読み込み
            async function loadClients() {
                try {
                    const response = await axios.get('/api/clients');
                    const clients = response.data.clients;
                    
                    const select = document.getElementById('clientSelectForReport');
                    select.innerHTML = '<option value="">クライアント選択</option>' +
                        clients.map(c => \`<option value="\${c.id}">\${c.name}</option>\`).join('');
                } catch (error) {
                    console.error('Failed to load clients:', error);
                }
            }
            
            // テンプレート読み込み
            function loadTemplate(templateType) {
                const templates = {
                    progress: {
                        subject: '【進捗報告】案件の進捗状況について',
                        body: \`お世話になっております。

現在お預かりしている案件の進捗状況をご報告いたします。

[詳細をここに記入]

ご不明な点がございましたら、お気軽にお問い合わせください。

今後ともよろしくお願いいたします。\`
                    },
                    reminder: {
                        subject: '【リマインド】期限のお知らせ',
                        body: \`お世話になっております。

[案件名]の期限が近づいておりますので、ご連絡いたしました。

期限：[日付]

必要な書類等がございましたら、お早めにご提出をお願いいたします。

よろしくお願いいたします。\`
                    }
                };
                
                if (templates[templateType]) {
                    const element = document.getElementById('emailSubject');
            if (element) element.value = templates[templateType].subject;
                    const element = document.getElementById('emailBody');
            if (element) element.value = templates[templateType].body;
                }
            }
            
            // テンプレート使用
            function useTemplate(templateType) {
                switchTab('compose');
                loadTemplate(templateType);
            }
            
            // 作成フォームクリア
            function clearCompose() {
                const element = document.getElementById('emailTo');
            if (element) element.value = '';
                const element = document.getElementById('emailCc');
            if (element) element.value = '';
                const element = document.getElementById('emailSubject');
            if (element) element.value = '';
                const element = document.getElementById('emailBody');
            if (element) element.value = '';
            }
            
            // ユーティリティ関数
            function escapeHtml(text) {
                const map = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#039;'
                };
                return text.replace(/[&<>"']/g, m => map[m]);
            }
            
            function formatDate(dateStr) {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                return date.toLocaleDateString('ja-JP') + ' ' + date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            }
            
            function logout() {
                if (confirm('ログアウトしますか？')) {
                    window.location.href = '/logout';
                }
            }
            
            // 初期化
            document.addEventListener('DOMContentLoaded', () => {
                loadEmails();
            });
        </script>
    </body>
    </html>
  `
}
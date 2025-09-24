export function getSimplifiedClientsPage(userName: string): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>顧問先管理 - 社労士事務所タスク管理</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        .client-card {
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .client-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        /* Toast notifications */
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1050;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(400px);
            transition: transform 0.3s ease;
        }
        .toast.show { transform: translateX(0); }
        .toast.success { background-color: #10b981; }
        .toast.error { background-color: #ef4444; }
        .toast.info { background-color: #3b82f6; }
        .toast.warning { background-color: #f59e0b; }
        
        /* Contact history items */
        .contact-item {
            border-left: 3px solid #3b82f6;
            transition: all 0.2s ease;
        }
        
        .contact-item:hover {
            border-left-color: #1d4ed8;
            background-color: #f8fafc;
        }
        
        /* Modal */
        .modal { 
            display: none; 
            position: fixed; 
            z-index: 1000; 
            left: 0; 
            top: 0; 
            width: 100%; 
            height: 100%; 
            background-color: rgba(0,0,0,0.5); 
        }
        .modal.active { 
            display: flex; 
            align-items: center; 
            justify-content: center; 
        }
        
        /* Tabs */
        .tab-button {
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .tab-button.active {
            color: #2563eb;
            border-bottom-color: #2563eb;
        }
        .tab-button:not(.active) {
            border-bottom: 2px solid transparent;
        }
        
        /* Task Items */
        .task-item {
            border-left: 3px solid #6b7280;
            transition: all 0.2s ease;
        }
        .task-item.pending {
            border-left-color: #f59e0b;
        }
        .task-item.in_progress {
            border-left-color: #3b82f6;
        }
        .task-item.completed {
            border-left-color: #10b981;
        }
        .task-item.overdue {
            border-left-color: #ef4444;
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center space-x-4">
                    <button onclick="window.location.href='/'" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h1 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-address-book mr-2 text-blue-600"></i>
                        顧問先管理
                    </h1>
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
        <!-- Quick Overview -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-lg p-6 text-center">
                <div class="text-3xl font-bold text-blue-600" id="totalClients">0</div>
                <div class="text-gray-600 mt-1">総顧問先数</div>
            </div>
            
            <div class="bg-white rounded-lg shadow-lg p-6 text-center">
                <div class="text-3xl font-bold text-green-600" id="recentContacts">0</div>
                <div class="text-gray-600 mt-1">今月の連絡件数</div>
            </div>
            
            <div class="bg-white rounded-lg shadow-lg p-6 text-center">
                <div class="text-3xl font-bold text-purple-600" id="activeTasks">0</div>
                <div class="text-gray-600 mt-1">進行中の業務</div>
            </div>
        </div>

        <!-- Search and Add -->
        <div class="bg-white rounded-lg shadow mb-6 p-6">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div class="flex-1 max-w-md">
                    <div class="relative">
                        <input type="text" id="searchInput" placeholder="顧問先名で検索..." 
                               class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                               oninput="filterClients()">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i class="fas fa-search text-gray-400"></i>
                        </div>
                    </div>
                </div>
                <div class="flex space-x-3">
                    <button onclick="openAddClientModal()" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-plus mr-2"></i>新規顧問先
                    </button>
                </div>
            </div>
        </div>

        <!-- Client Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="clientsGrid">
            <!-- Loading state -->
            <div class="col-span-full text-center py-12">
                <i class="fas fa-spinner fa-spin text-3xl text-gray-400"></i>
                <p class="mt-4 text-gray-600">顧問先情報を読み込み中...</p>
            </div>
        </div>
    </main>

    <!-- Client Detail Modal -->
    <div id="clientDetailModal" class="modal">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
            <div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 class="text-xl font-semibold" id="clientDetailTitle">顧問先詳細</h2>
                <button onclick="closeClientDetail()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="flex">
                <!-- Left Panel: Client Info -->
                <div class="w-1/3 p-6 border-r bg-gray-50">
                    <div id="clientInfoPanel">
                        <!-- Client info will be loaded here -->
                    </div>
                </div>
                
                <!-- Right Panel: Tabbed Content -->
                <div class="w-2/3 p-6">
                    <!-- Tab Headers -->
                    <div class="flex border-b border-gray-200 mb-4">
                        <button onclick="switchTab('contacts')" id="contactsTab" class="tab-button px-4 py-2 font-medium text-blue-600 border-b-2 border-blue-600">
                            <i class="fas fa-comments mr-2"></i>連絡履歴
                        </button>
                        <button onclick="switchTab('tasks')" id="tasksTab" class="tab-button px-4 py-2 font-medium text-gray-500 hover:text-gray-700">
                            <i class="fas fa-tasks mr-2"></i>タスク管理
                        </button>
                    </div>
                    
                    <!-- Contacts Tab Content -->
                    <div id="contactsTabContent" class="tab-content">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold">連絡履歴</h3>
                            <div class="flex space-x-2">
                                <button onclick="initializeDatabase()" class="bg-orange-600 text-white px-2 py-1 rounded text-xs hover:bg-orange-700" title="データベーステーブルを初期化">
                                    <i class="fas fa-database mr-1"></i>DB初期化
                                </button>
                                <button onclick="openAddContactModal()" class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                                    <i class="fas fa-plus mr-1"></i>連絡記録を追加
                                </button>
                            </div>
                        </div>
                        <div id="contactHistoryPanel" class="max-h-96 overflow-y-auto">
                            <!-- Contact history will be loaded here -->
                        </div>
                    </div>
                    
                    <!-- Tasks Tab Content -->
                    <div id="tasksTabContent" class="tab-content hidden">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold">タスク管理</h3>
                            <div class="flex space-x-2">
                                <button onclick="openAddTaskModal()" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                                    <i class="fas fa-plus mr-1"></i>新しいタスク
                                </button>
                            </div>
                        </div>
                        <div id="clientTasksPanel" class="max-h-96 overflow-y-auto">
                            <!-- Client tasks will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Add Client Modal -->
    <div id="addClientModal" class="modal">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div class="px-6 py-4 border-b flex justify-between items-center">
                <h3 class="text-lg font-semibold">新規顧問先登録</h3>
                <button onclick="closeAddClientModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="addClientForm" class="p-6 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">顧問先名 *</label>
                        <input type="text" name="name" required class="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">会社名</label>
                        <input type="text" name="company_name" class="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">電話番号 *</label>
                        <input type="tel" name="phone" required class="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
                        <input type="email" name="email" class="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">住所</label>
                    <input type="text" name="address" class="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">従業員数</label>
                        <input type="number" name="employee_count" min="1" class="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">契約プラン</label>
                        <select name="contract_plan" class="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500">
                            <option value="">選択してください</option>
                            <option value="ライトプラン">ライトプラン</option>
                            <option value="スタンダードプラン">スタンダードプラン</option>
                            <option value="プレミアムプラン">プレミアムプラン</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">備考</label>
                    <textarea name="notes" rows="3" class="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" onclick="closeAddClientModal()" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                        キャンセル
                    </button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        登録
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Add Contact Modal -->
    <div id="addContactModal" class="modal">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div class="px-6 py-4 border-b flex justify-between items-center">
                <h3 class="text-lg font-semibold">連絡記録を追加</h3>
                <button onclick="closeAddContactModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="addContactForm" class="p-6 space-y-4">
                <input type="hidden" id="contactClientId">
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">連絡方法 *</label>
                    <select name="contact_type" required class="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500">
                        <option value="phone">電話</option>
                        <option value="email">メール</option>
                        <option value="meeting">面談</option>
                        <option value="visit">訪問</option>
                        <option value="other">その他</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">件名・タイトル *</label>
                    <input type="text" name="subject" required class="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">内容・メモ *</label>
                    <textarea name="notes" rows="4" required class="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">連絡日時</label>
                    <input type="datetime-local" name="contact_date" class="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" onclick="closeAddContactModal()" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                        キャンセル
                    </button>
                    <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        記録
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        let allClients = [];
        let filteredClients = [];
        let currentClientId = null;

        // Toast notification system
        function showToast(message, type = 'info', duration = 3000) {
            const toast = document.createElement('div');
            toast.className = \`toast \${type}\`;
            toast.innerHTML = \`
                <div class="flex items-center justify-between">
                    <span>\${message}</span>
                    <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            \`;
            
            document.body.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 100);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        // Initialize page
        document.addEventListener('DOMContentLoaded', async () => {
            await loadClients();
            setDefaultContactDate();
        });

        // Load all clients
        async function loadClients() {
            try {
                const response = await axios.get('/api/clients');
                allClients = response.data.clients || [];
                filteredClients = [...allClients];
                
                updateStats();
                renderClientsGrid();
            } catch (error) {
                console.error('Failed to load clients:', error);
                
                // If it's an auth error, try to get emergency auth token
                if (error.response && error.response.status === 401) {
                    console.log('Auth error detected, trying emergency auth...');
                    try {
                        await fetch('/api/emergency-auth', { credentials: 'include' });
                        // Retry loading clients
                        const retryResponse = await axios.get('/api/clients');
                        allClients = retryResponse.data.clients || [];
                        filteredClients = [...allClients];
                        updateStats();
                        renderClientsGrid();
                        showToast('認証を修復しました', 'success');
                    } catch (retryError) {
                        console.error('Retry failed:', retryError);
                        showToast('顧問先の読み込みに失敗しました。ページを再読み込みしてください。', 'error');
                    }
                } else {
                    showToast('顧問先の読み込みに失敗しました', 'error');
                }
            }
        }

        // Update statistics
        function updateStats() {
            document.getElementById('totalClients').textContent = allClients.length;
            
            // Calculate recent contacts and active tasks
            const recentContacts = allClients.reduce((sum, client) => {
                return sum + (client.recent_contacts || 0);
            }, 0);
            
            const activeTasks = allClients.reduce((sum, client) => {
                return sum + (client.active_tasks || 0);
            }, 0);
            
            document.getElementById('recentContacts').textContent = recentContacts;
            document.getElementById('activeTasks').textContent = activeTasks;
        }

        // Render clients grid
        function renderClientsGrid() {
            const grid = document.getElementById('clientsGrid');
            
            if (filteredClients.length === 0) {
                grid.innerHTML = \`
                    <div class="col-span-full text-center py-12">
                        <i class="fas fa-search text-3xl text-gray-300 mb-4"></i>
                        <p class="text-gray-600">該当する顧問先が見つかりません</p>
                        <button onclick="document.getElementById('searchInput').focus()" class="mt-2 text-blue-600 hover:text-blue-800">
                            検索条件を変更
                        </button>
                    </div>
                \`;
                return;
            }
            
            grid.innerHTML = filteredClients.map(client => {
                const lastContact = client.last_contact_date ? 
                    new Date(client.last_contact_date).toLocaleDateString('ja-JP') : '未記録';
                
                return \`
                    <div class="client-card bg-white rounded-lg shadow-lg p-6" onclick="showClientDetail(\${client.id})">
                        <div class="flex items-start justify-between mb-4">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">\${client.name}</h3>
                                \${client.company_name ? \`<p class="text-gray-600 text-sm">\${client.company_name}</p>\` : ''}
                            </div>
                            <div class="text-right">
                                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium \${client.active_tasks > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                                    <i class="fas fa-tasks mr-1"></i>\${client.active_tasks || 0}
                                </span>
                            </div>
                        </div>
                        
                        <div class="space-y-2 text-sm text-gray-600">
                            <div class="flex items-center">
                                <i class="fas fa-phone w-4 text-gray-400 mr-2"></i>
                                <span>\${client.phone || '未登録'}</span>
                            </div>
                            \${client.email ? \`
                                <div class="flex items-center">
                                    <i class="fas fa-envelope w-4 text-gray-400 mr-2"></i>
                                    <span>\${client.email}</span>
                                </div>
                            \` : ''}
                            <div class="flex items-center">
                                <i class="fas fa-calendar w-4 text-gray-400 mr-2"></i>
                                <span>最終連絡: \${lastContact}</span>
                            </div>
                        </div>
                        
                        \${client.contract_plan ? \`
                            <div class="mt-4">
                                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    \${client.contract_plan}
                                </span>
                            </div>
                        \` : ''}
                    </div>
                \`;
            }).join('');
        }

        // Filter clients
        function filterClients() {
            const searchText = document.getElementById('searchInput').value.toLowerCase();
            
            filteredClients = allClients.filter(client => {
                return !searchText || 
                    client.name.toLowerCase().includes(searchText) ||
                    (client.company_name && client.company_name.toLowerCase().includes(searchText));
            });
            
            renderClientsGrid();
        }

        // Show client detail modal
        async function showClientDetail(clientId) {
            try {
                currentClientId = clientId;
                
                // Load client details first
                const clientRes = await axios.get(\`/api/clients/\${clientId}\`);
                const client = clientRes.data.client;
                
                // Try to load contact history, but don't fail if it doesn't work
                let contacts = [];
                try {
                    const contactsRes = await axios.get(\`/api/clients/\${clientId}/contacts\`);
                    contacts = contactsRes.data.contacts || [];
                } catch (contactError) {
                    console.warn('Failed to load contact history:', contactError);
                    // Continue with empty contacts array - graceful degradation
                }
                
                // Update modal title
                document.getElementById('clientDetailTitle').textContent = client.name + ' - 詳細';
                
                // Render client info
                document.getElementById('clientInfoPanel').innerHTML = \`
                    <div class="space-y-4">
                        <div>
                            <h4 class="font-semibold text-gray-900 mb-2">\${client.name}</h4>
                            \${client.company_name ? \`<p class="text-gray-600">\${client.company_name}</p>\` : ''}
                        </div>
                        
                        <div class="space-y-2 text-sm">
                            <div class="flex items-center">
                                <i class="fas fa-phone w-4 text-gray-400 mr-2"></i>
                                <span>\${client.phone || '未登録'}</span>
                            </div>
                            \${client.email ? \`
                                <div class="flex items-center">
                                    <i class="fas fa-envelope w-4 text-gray-400 mr-2"></i>
                                    <span>\${client.email}</span>
                                </div>
                            \` : ''}
                            \${client.address ? \`
                                <div class="flex items-start">
                                    <i class="fas fa-map-marker-alt w-4 text-gray-400 mr-2 mt-1"></i>
                                    <span>\${client.address}</span>
                                </div>
                            \` : ''}
                        </div>
                        
                        \${client.contract_plan || client.employee_count ? \`
                            <div class="border-t pt-4 space-y-2">
                                \${client.contract_plan ? \`
                                    <div class="flex justify-between">
                                        <span class="text-gray-500">契約プラン:</span>
                                        <span class="font-medium">\${client.contract_plan}</span>
                                    </div>
                                \` : ''}
                                \${client.employee_count ? \`
                                    <div class="flex justify-between">
                                        <span class="text-gray-500">従業員数:</span>
                                        <span class="font-medium">\${client.employee_count}名</span>
                                    </div>
                                \` : ''}
                            </div>
                        \` : ''}
                        
                        \${client.notes ? \`
                            <div class="border-t pt-4">
                                <h5 class="text-sm font-medium text-gray-700 mb-1">備考</h5>
                                <p class="text-sm text-gray-600">\${client.notes}</p>
                            </div>
                        \` : ''}
                        
                        <div class="border-t pt-4 space-y-2">
                            <button onclick="editClient(\${client.id})" class="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                <i class="fas fa-edit mr-2"></i>編集
                            </button>
                            <button onclick="showClientTasks(\${client.id})" class="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                <i class="fas fa-tasks mr-2"></i>タスク管理
                            </button>
                        </div>
                    </div>
                \`;
                
                // Render contact history
                renderContactHistory(contacts);
                
                // Show modal
                document.getElementById('clientDetailModal').classList.add('active');
                
            } catch (error) {
                console.error('Failed to load client details:', error);
                showToast('顧問先詳細の読み込みに失敗しました', 'error');
            }
        }

        // Render contact history
        function renderContactHistory(contacts) {
            const panel = document.getElementById('contactHistoryPanel');
            
            if (contacts.length === 0) {
                panel.innerHTML = \`
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-comments text-2xl mb-2"></i>
                        <p>連絡履歴がありません</p>
                        <button onclick="openAddContactModal()" class="mt-2 text-blue-600 hover:text-blue-800">
                            最初の連絡記録を追加
                        </button>
                    </div>
                \`;
                return;
            }
            
            panel.innerHTML = contacts.map(contact => {
                const contactDate = new Date(contact.contact_date).toLocaleString('ja-JP');
                const contactTypeIcons = {
                    phone: 'fa-phone',
                    email: 'fa-envelope',
                    meeting: 'fa-handshake',
                    visit: 'fa-map-marker-alt',
                    other: 'fa-comment'
                };
                
                const contactTypeLabels = {
                    phone: '電話',
                    email: 'メール',
                    meeting: '面談',
                    visit: '訪問',
                    other: 'その他'
                };
                
                return \`
                    <div class="contact-item bg-white rounded-lg p-4 mb-3 pl-4">
                        <div class="flex items-start justify-between mb-2">
                            <div class="flex items-center">
                                <i class="fas \${contactTypeIcons[contact.contact_type] || 'fa-comment'} text-blue-600 mr-2"></i>
                                <span class="font-medium text-gray-900">\${contact.subject}</span>
                            </div>
                            <span class="text-xs text-gray-500">\${contactDate}</span>
                        </div>
                        <div class="flex items-center mb-2">
                            <span class="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                \${contactTypeLabels[contact.contact_type] || contact.contact_type}
                            </span>
                        </div>
                        <p class="text-sm text-gray-700">\${contact.notes}</p>
                    </div>
                \`;
            }).join('');
        }

        // Close client detail
        function closeClientDetail() {
            document.getElementById('clientDetailModal').classList.remove('active');
            currentClientId = null;
        }

        // Modal functions
        function openAddClientModal() {
            document.getElementById('addClientModal').classList.add('active');
        }

        function closeAddClientModal() {
            document.getElementById('addClientModal').classList.remove('active');
            document.getElementById('addClientForm').reset();
        }

        function openAddContactModal() {
            if (!currentClientId) return;
            document.getElementById('contactClientId').value = currentClientId;
            document.getElementById('addContactModal').classList.add('active');
        }

        function closeAddContactModal() {
            document.getElementById('addContactModal').classList.remove('active');
            document.getElementById('addContactForm').reset();
            setDefaultContactDate();
        }

        // Set default contact date to now
        function setDefaultContactDate() {
            const now = new Date();
            const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
            const contactDateInput = document.querySelector('input[name="contact_date"]');
            if (contactDateInput) {
                contactDateInput.value = localDateTime;
            }
        }

        // Form submissions
        document.getElementById('addClientForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const formData = new FormData(e.target);
                const clientData = Object.fromEntries(formData);
                
                await axios.post('/api/clients', clientData);
                closeAddClientModal();
                await loadClients();
                showToast('顧問先を登録しました', 'success');
            } catch (error) {
                console.error('Failed to create client:', error);
                showToast('顧問先の登録に失敗しました', 'error');
            }
        });

        document.getElementById('addContactForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const formData = new FormData(e.target);
                const contactData = Object.fromEntries(formData);
                contactData.client_id = document.getElementById('contactClientId').value;
                
                await axios.post('/api/contacts', contactData);
                closeAddContactModal();
                
                // Refresh contact history (graceful degradation if it fails)
                try {
                    const contactsRes = await axios.get(\`/api/clients/\${currentClientId}/contacts\`);
                    renderContactHistory(contactsRes.data.contacts || []);
                } catch (refreshError) {
                    console.warn('Failed to refresh contact history:', refreshError);
                    renderContactHistory([]); // Show empty state if refresh fails
                }
                
                showToast('連絡記録を追加しました', 'success');
            } catch (error) {
                console.error('Failed to add contact:', error);
                
                // Check if it's a database table error
                if (error.response && error.response.status === 500) {
                    const errorMessage = error.response.data?.details || error.response.data?.error || '';
                    if (errorMessage.includes('no such table') || errorMessage.includes('client_contacts')) {
                        showToast('データベーステーブルが存在しません。管理者にお問い合わせください。', 'error');
                    } else {
                        showToast('連絡記録の追加に失敗しました: ' + errorMessage, 'error');
                    }
                } else {
                    showToast('連絡記録の追加に失敗しました', 'error');
                }
            }
        });

        // Database initialization function
        async function initializeDatabase() {
            try {
                showToast('データベースを初期化中...', 'info');
                
                const response = await axios.post('/api/public/init-db');
                
                if (response.data.success) {
                    showToast('データベースの初期化が完了しました', 'success');
                } else {
                    showToast('データベース初期化に失敗しました', 'error');
                }
            } catch (error) {
                console.error('Database initialization failed:', error);
                showToast('データベース初期化中にエラーが発生しました', 'error');
            }
        }

        // Edit client (simplified - just redirect to business page for now)
        function editClient(clientId) {
            showToast('編集機能は業務管理画面で利用できます', 'info');
            closeClientDetail();
        }

        // Tab switching functionality
        function switchTab(tabName) {
            // Update tab buttons
            document.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active', 'text-blue-600', 'border-blue-600');
                btn.classList.add('text-gray-500');
            });
            
            // Update tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            
            // Activate selected tab
            const selectedTab = document.getElementById(tabName + 'Tab');
            const selectedContent = document.getElementById(tabName + 'TabContent');
            
            if (selectedTab && selectedContent) {
                selectedTab.classList.add('active', 'text-blue-600', 'border-blue-600');
                selectedTab.classList.remove('text-gray-500');
                selectedContent.classList.remove('hidden');
            }
            
            // Load content if needed
            if (tabName === 'tasks' && currentClientId) {
                loadClientTasks(currentClientId);
            }
        }
        
        // Load client tasks
        async function loadClientTasks(clientId) {
            try {
                const response = await axios.get(\`/api/clients/\${clientId}/tasks\`);
                renderClientTasks(response.data.tasks || []);
            } catch (error) {
                console.error('Failed to load client tasks:', error);
                renderClientTasks([]);
            }
        }
        
        // Render client tasks
        function renderClientTasks(tasks) {
            const panel = document.getElementById('clientTasksPanel');
            
            if (tasks.length === 0) {
                panel.innerHTML = \`
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-tasks text-2xl mb-2"></i>
                        <p>タスクがありません</p>
                        <button onclick="openAddTaskModal()" class="mt-2 text-blue-600 hover:text-blue-800">
                            最初のタスクを追加
                        </button>
                    </div>
                \`;
                return;
            }
            
            panel.innerHTML = tasks.map(task => {
                const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('ja-JP') : '未設定';
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
                const statusClass = isOverdue ? 'overdue' : task.status;
                
                const statusLabels = {
                    pending: '未開始',
                    in_progress: '進行中', 
                    completed: '完了',
                    overdue: '期限超過'
                };
                
                const priorityLabels = {
                    urgent: '緊急',
                    high: '高',
                    medium: '中',
                    low: '低'
                };
                
                const priorityColors = {
                    urgent: 'bg-red-100 text-red-800',
                    high: 'bg-orange-100 text-orange-800',
                    medium: 'bg-yellow-100 text-yellow-800', 
                    low: 'bg-green-100 text-green-800'
                };
                
                return \`
                    <div class="task-item \${statusClass} bg-white rounded-lg p-4 mb-3 pl-4">
                        <div class="flex items-start justify-between mb-2">
                            <div class="flex-1">
                                <h4 class="font-medium text-gray-900 mb-1">\${task.title}</h4>
                                \${task.description ? \`<p class="text-sm text-gray-600 mb-2">\${task.description}</p>\` : ''}
                            </div>
                            <div class="flex space-x-1 ml-4">
                                <button onclick="updateTaskProgress(\${task.id}, '\${task.status}')" class="text-blue-600 hover:text-blue-800 text-sm" title="進捗更新">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteTask(\${task.id})" class="text-red-600 hover:text-red-800 text-sm" title="削除">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        
                        <div class="flex items-center justify-between text-sm">
                            <div class="flex space-x-3">
                                <span class="px-2 py-1 rounded-full text-xs font-medium \${priorityColors[task.priority] || priorityColors.medium}">
                                    \${priorityLabels[task.priority] || '中'}
                                </span>
                                <span class="text-gray-500">期限: \${dueDate}</span>
                                \${task.progress !== null ? \`<span class="text-gray-500">進捗: \${task.progress}%</span>\` : ''}
                            </div>
                            <span class="px-2 py-1 rounded text-xs \${statusClass === 'completed' ? 'bg-green-100 text-green-800' : statusClass === 'overdue' ? 'bg-red-100 text-red-800' : statusClass === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">
                                \${statusLabels[task.status] || task.status}
                            </span>
                        </div>
                    </div>
                \`;
            }).join('');
        }
        
        // Update task progress
        async function updateTaskProgress(taskId, currentStatus) {
            // Simple progress update - cycle through statuses
            const statusFlow = {
                'pending': 'in_progress',
                'in_progress': 'completed',
                'completed': 'pending'
            };
            
            const newStatus = statusFlow[currentStatus] || 'in_progress';
            const newProgress = newStatus === 'completed' ? 100 : newStatus === 'in_progress' ? 50 : 0;
            
            try {
                await axios.put(\`/api/tasks/\${taskId}\`, {
                    status: newStatus,
                    progress: newProgress
                });
                
                showToast('タスクの進捗を更新しました', 'success');
                
                // Refresh task list
                if (currentClientId) {
                    loadClientTasks(currentClientId);
                }
                
                // Also refresh main client grid to update task counts
                await loadClients();
                
            } catch (error) {
                console.error('Failed to update task:', error);
                showToast('タスクの更新に失敗しました', 'error');
            }
        }
        
        // Delete task
        async function deleteTask(taskId) {
            if (!confirm('このタスクを削除しますか？')) {
                return;
            }
            
            try {
                await axios.delete(\`/api/tasks/\${taskId}\`);
                showToast('タスクを削除しました', 'success');
                
                // Refresh task list
                if (currentClientId) {
                    loadClientTasks(currentClientId);
                }
                
                // Also refresh main client grid to update task counts
                await loadClients();
                
            } catch (error) {
                console.error('Failed to delete task:', error);
                showToast('タスクの削除に失敗しました', 'error');
            }
        }
        
        // Open add task modal (placeholder for now)
        function openAddTaskModal() {
            showToast('タスク追加機能は準備中です。タスク管理ページをご利用ください。', 'info');
        }
        
        // Show client tasks (called from button)
        function showClientTasks(clientId) {
            // Switch to tasks tab when button is clicked
            switchTab('tasks');
        }

        // Auth error handling
        axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response && error.response.status === 401) {
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    </script>
</body>
</html>
  `;
}
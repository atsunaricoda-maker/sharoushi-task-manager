export function getClientsPage(userName: string): string {
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
        .modal { display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); }
        .modal.active { display: flex; align-items: center; justify-content: center; }
        .slide-panel { transform: translateX(100%); transition: transform 0.3s ease; }
        .slide-panel.active { transform: translateX(0); }
        
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
        
        /* Loading spinner */
        .loading-spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #ffffff;
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center space-x-8">
                    <h1 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-building mr-2 text-blue-600"></i>
                        顧問先管理
                    </h1>
                    <nav class="flex space-x-4">
                        <a href="/" class="px-3 py-2 text-gray-700 hover:text-gray-900">
                            <i class="fas fa-home mr-1"></i>ダッシュボード
                        </a>
                        <a href="/clients" class="px-3 py-2 text-blue-600 font-medium">
                            <i class="fas fa-building mr-1"></i>顧問先
                        </a>
                        <a href="/reports" class="px-3 py-2 text-gray-700 hover:text-gray-900">
                            <i class="fas fa-chart-bar mr-1"></i>レポート
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
        <!-- Stats Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">総顧問先数</p>
                        <p class="text-3xl font-bold text-gray-900" id="totalClients">-</p>
                    </div>
                    <div class="bg-blue-100 p-3 rounded-full">
                        <i class="fas fa-building text-blue-600 text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">アクティブタスク</p>
                        <p class="text-3xl font-bold text-green-600" id="activeTasks">-</p>
                    </div>
                    <div class="bg-green-100 p-3 rounded-full">
                        <i class="fas fa-tasks text-green-600 text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">月額顧問料合計</p>
                        <p class="text-2xl font-bold text-gray-900" id="totalRevenue">-</p>
                    </div>
                    <div class="bg-yellow-100 p-3 rounded-full">
                        <i class="fas fa-yen-sign text-yellow-600 text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">平均従業員数</p>
                        <p class="text-3xl font-bold text-gray-900" id="avgEmployees">-</p>
                    </div>
                    <div class="bg-purple-100 p-3 rounded-full">
                        <i class="fas fa-users text-purple-600 text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Search and Filter Section -->
        <div class="bg-white rounded-lg shadow mb-6">
            <div class="px-6 py-4 border-b">
                <h3 class="text-md font-semibold text-gray-900 mb-4">検索・絞り込み</h3>
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">顧問先名検索</label>
                        <input type="text" id="searchInput" placeholder="顧問先名または会社名で検索" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                               oninput="filterClients()">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">契約プラン</label>
                        <select id="contractPlanFilter" onchange="filterClients()" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">すべて</option>
                            <option value="ライトプラン">ライトプラン</option>
                            <option value="スタンダードプラン">スタンダードプラン</option>
                            <option value="プレミアムプラン">プレミアムプラン</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">従業員数</label>
                        <select id="employeeCountFilter" onchange="filterClients()" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">すべて</option>
                            <option value="1-10">1-10人</option>
                            <option value="11-50">11-50人</option>
                            <option value="51-100">51-100人</option>
                            <option value="101+">101人以上</option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <button onclick="clearFilters()" 
                                class="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg">
                            <i class="fas fa-eraser mr-2"></i>フィルタークリア
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Client List -->
        <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b flex justify-between items-center">
                <div class="flex items-center space-x-4">
                    <h2 class="text-lg font-semibold text-gray-900">顧問先一覧</h2>
                    <span id="clientCount" class="text-sm text-gray-500">（0件）</span>
                </div>
                <div class="flex space-x-2">
                    <button onclick="openNewClientModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>新規顧問先
                    </button>
                    <button onclick="exportClients()" class="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">
                        <i class="fas fa-download mr-2"></i>エクスポート
                    </button>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">顧問先名</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">契約プラン</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">従業員数</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">月額顧問料</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">アクティブタスク</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                        </tr>
                    </thead>
                    <tbody id="clientTableBody" class="bg-white divide-y divide-gray-200">
                        <!-- Client rows will be inserted here -->
                    </tbody>
                </table>
            </div>
        </div>
    </main>

    <!-- Client Detail Panel (Slide from right) -->
    <div id="clientDetailPanel" class="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 slide-panel">
        <div class="p-6 h-full overflow-y-auto">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-gray-900">顧問先詳細</h3>
                <button onclick="closeClientDetail()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <div id="clientDetailContent">
                <!-- Client details will be loaded here -->
            </div>
        </div>
    </div>

    <!-- New Client Modal -->
    <div id="newClientModal" class="modal">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div class="px-6 py-4 border-b flex justify-between items-center">
                <h3 class="text-lg font-semibold">新規顧問先登録</h3>
                <button onclick="closeNewClientModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="p-6">
                <form id="newClientForm" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">顧問先名 <span class="text-red-500">*</span></label>
                            <input type="text" name="name" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">会社名</label>
                            <input type="text" name="company_name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700">住所</label>
                        <input type="text" name="address" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">メールアドレス</label>
                            <input type="email" name="email" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">電話番号</label>
                            <input type="tel" name="phone" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">従業員数</label>
                            <input type="number" name="employee_count" min="1" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">月額顧問料</label>
                            <input type="number" name="monthly_fee" min="0" step="1000" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">契約プラン</label>
                            <select name="contract_plan" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                <option value="">選択してください</option>
                                <option value="ライトプラン">ライトプラン</option>
                                <option value="スタンダードプラン">スタンダードプラン</option>
                                <option value="プレミアムプラン">プレミアムプラン</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700">備考</label>
                        <textarea name="notes" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
                    </div>
                    
                    <div class="flex justify-end space-x-3 pt-4">
                        <button type="button" onclick="closeNewClientModal()" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                            キャンセル
                        </button>
                        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            登録
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        let allClients = [];
        let filteredClients = [];
        
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
            
            // Show animation
            setTimeout(() => toast.classList.add('show'), 100);
            
            // Auto remove
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
        
        // Loading state helper
        function setLoading(element, isLoading) {
            if (isLoading) {
                element.disabled = true;
                element.innerHTML = '<span class="loading-spinner"></span> 処理中...';
            } else {
                element.disabled = false;
                // Restore original content (will be handled by caller)
            }
        }
        
        // Load clients on page load
        async function loadClients() {
            try {
                const res = await axios.get('/api/clients');
                allClients = res.data.clients;
                filteredClients = [...allClients];
                
                updateStats();
                renderClientsTable();
                updateClientCount();
                
            } catch (error) {
                console.error('Failed to load clients:', error);
                showToast('顧問先の読み込みに失敗しました', 'error');
            }
        }
        
        // Update statistics
        function updateStats() {
            const clients = filteredClients;
            document.getElementById('totalClients').textContent = clients.length;
            document.getElementById('activeTasks').textContent = clients.reduce((sum, c) => sum + (c.active_tasks || 0), 0);
            document.getElementById('totalRevenue').textContent = '¥' + clients.reduce((sum, c) => sum + (c.monthly_fee || 0), 0).toLocaleString();
            const totalEmployees = clients.reduce((sum, c) => sum + (c.employee_count || 0), 0);
            document.getElementById('avgEmployees').textContent = clients.length > 0 ? Math.round(totalEmployees / clients.length) : 0;
        }
        
        // Render clients table
        function renderClientsTable() {
            const tbody = document.getElementById('clientTableBody');
            
            if (filteredClients.length === 0) {
                tbody.innerHTML = \`
                    <tr>
                        <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                            <i class="fas fa-search mb-2 text-2xl"></i>
                            <div>該当する顧問先が見つかりません</div>
                            <div class="text-sm">検索条件を変更してください</div>
                        </td>
                    </tr>
                \`;
                return;
            }
            
            tbody.innerHTML = filteredClients.map(client => \`
                <tr class="hover:bg-gray-50 cursor-pointer" onclick="showClientDetail(\${client.id})">
                    <td class="px-6 py-4">
                        <div class="text-sm font-medium text-gray-900">\${client.name}</div>
                        <div class="text-sm text-gray-500">\${client.company_name || '-'}</div>
                    </td>
                    <td class="px-6 py-4">
                        <span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                            \${client.contract_plan || '未設定'}
                        </span>
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-900">\${client.employee_count || 0}名</td>
                    <td class="px-6 py-4 text-sm text-gray-900">¥\${(client.monthly_fee || 0).toLocaleString()}</td>
                    <td class="px-6 py-4">
                        <span class="text-sm font-medium \${client.active_tasks > 0 ? 'text-green-600' : 'text-gray-500'}">
                            \${client.active_tasks || 0}件
                        </span>
                    </td>
                    <td class="px-6 py-4">
                        <button onclick="event.stopPropagation(); editClient(\${client.id})" 
                                class="text-blue-600 hover:text-blue-900 mr-2" title="編集">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="event.stopPropagation(); generateTasksForClient(\${client.id})" 
                                class="text-purple-600 hover:text-purple-900 mr-2" title="タスク生成">
                            <i class="fas fa-magic"></i>
                        </button>
                        <button onclick="event.stopPropagation(); deleteClient(\${client.id}, '\${client.name.replace(/'/g, "\\'")}')" 
                                class="text-red-600 hover:text-red-900" title="削除">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            \`).join('');
        }
        
        // Update client count display
        function updateClientCount() {
            document.getElementById('clientCount').textContent = \`（\${filteredClients.length}件）\`;
        }
        
        // Filter clients based on search and filter inputs
        function filterClients() {
            const searchText = document.getElementById('searchInput').value.toLowerCase();
            const contractPlan = document.getElementById('contractPlanFilter').value;
            const employeeRange = document.getElementById('employeeCountFilter').value;
            
            filteredClients = allClients.filter(client => {
                // Search filter
                const matchesSearch = !searchText || 
                    client.name.toLowerCase().includes(searchText) ||
                    (client.company_name && client.company_name.toLowerCase().includes(searchText));
                
                // Contract plan filter
                const matchesContract = !contractPlan || client.contract_plan === contractPlan;
                
                // Employee count filter
                let matchesEmployeeCount = true;
                if (employeeRange) {
                    const empCount = client.employee_count || 0;
                    switch(employeeRange) {
                        case '1-10': matchesEmployeeCount = empCount >= 1 && empCount <= 10; break;
                        case '11-50': matchesEmployeeCount = empCount >= 11 && empCount <= 50; break;
                        case '51-100': matchesEmployeeCount = empCount >= 51 && empCount <= 100; break;
                        case '101+': matchesEmployeeCount = empCount > 100; break;
                    }
                }
                
                return matchesSearch && matchesContract && matchesEmployeeCount;
            });
            
            updateStats();
            renderClientsTable();
            updateClientCount();
        }
        
        // Clear all filters
        function clearFilters() {
            document.getElementById('searchInput').value = '';
            document.getElementById('contractPlanFilter').value = '';
            document.getElementById('employeeCountFilter').value = '';
            filteredClients = [...allClients];
            updateStats();
            renderClientsTable();
            updateClientCount();
        }
        
        async function showClientDetail(clientId) {
            try {
                const res = await axios.get(\`/api/clients/\${clientId}\`);
                const data = res.data;
                
                document.getElementById('clientDetailContent').innerHTML = \`
                    <div class="space-y-6">
                        <div>
                            <h4 class="text-lg font-semibold mb-3">\${data.client.name}</h4>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-500">契約プラン:</span>
                                    <span class="font-medium">\${data.client.contract_plan || '-'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">従業員数:</span>
                                    <span class="font-medium">\${data.client.employee_count || 0}名</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">月額顧問料:</span>
                                    <span class="font-medium">¥\${(data.client.monthly_fee || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h4 class="text-sm font-semibold text-gray-700 mb-2">統計情報</h4>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="bg-gray-50 p-3 rounded">
                                    <p class="text-xs text-gray-500">総タスク</p>
                                    <p class="text-lg font-bold">\${data.statistics.total_tasks || 0}</p>
                                </div>
                                <div class="bg-green-50 p-3 rounded">
                                    <p class="text-xs text-gray-500">完了</p>
                                    <p class="text-lg font-bold text-green-600">\${data.statistics.completed_tasks || 0}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h4 class="text-sm font-semibold text-gray-700 mb-2">アクティブタスク</h4>
                            <div class="space-y-2">
                                \${data.activeTasks.slice(0, 5).map(task => \`
                                    <div class="border-l-2 border-\${task.priority === 'urgent' ? 'red' : task.priority === 'high' ? 'orange' : 'blue'}-500 pl-3 py-1">
                                        <p class="text-sm font-medium">\${task.title}</p>
                                        <p class="text-xs text-gray-500">\${task.due_date} - \${task.assignee_name}</p>
                                    </div>
                                \`).join('') || '<p class="text-sm text-gray-500">アクティブなタスクはありません</p>'}
                            </div>
                        </div>
                    </div>
                \`;
                
                document.getElementById('clientDetailPanel').classList.add('active');
            } catch (error) {
                console.error('Failed to load client details:', error);
            }
        }
        
        function closeClientDetail() {
            document.getElementById('clientDetailPanel').classList.remove('active');
        }
        
        function openNewClientModal() {
            document.getElementById('newClientModal').classList.add('active');
        }
        
        function closeNewClientModal() {
            document.getElementById('newClientModal').classList.remove('active');
            document.getElementById('newClientForm').reset();
            resetFormToCreateMode();
        }
        
        document.getElementById('newClientForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = e.target.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            
            setLoading(submitButton, true);
            
            const formData = new FormData(e.target);
            const clientData = Object.fromEntries(formData);
            
            try {
                await axios.post('/api/clients', clientData);
                closeNewClientModal();
                await loadClients();
                showToast('顧問先を登録しました', 'success');
            } catch (error) {
                console.error('Error creating client:', error);
                showToast(error.response?.data?.error || '顧問先の登録に失敗しました', 'error');
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        });
        
        // Delete client function
        async function deleteClient(clientId, clientName) {
            if (!confirm(\`顧問先「\${clientName}」を削除してもよろしいですか？\\n\\nこの操作は取り消せません。\`)) {
                return;
            }
            
            try {
                const response = await axios.delete(\`/api/clients/\${clientId}\`);
                await loadClients();
                showToast(response.data.message || '顧問先を削除しました', 'success');
            } catch (error) {
                console.error('Error deleting client:', error);
                const errorMsg = error.response?.data?.error || '顧問先の削除に失敗しました';
                
                if (error.response?.data?.activeTaskCount > 0) {
                    showToast(\`削除できません：アクティブなタスクが\${error.response.data.activeTaskCount}件あります\`, 'warning', 5000);
                } else if (error.response?.data?.futureScheduleCount > 0) {
                    showToast(\`削除できません：将来のスケジュールが\${error.response.data.futureScheduleCount}件あります\`, 'warning', 5000);
                } else {
                    showToast(errorMsg, 'error');
                }
            }
        }
        
        // Export clients to CSV
        function exportClients() {
            const csvContent = [
                ['顧問先名', '会社名', 'メールアドレス', '電話番号', '住所', '契約プラン', '従業員数', '月額顧問料', 'アクティブタスク', '備考'].join(','),
                ...filteredClients.map(client => [
                    \`"\${client.name || ''}"\`,
                    \`"\${client.company_name || ''}"\`,
                    \`"\${client.email || ''}"\`,
                    \`"\${client.phone || ''}"\`,
                    \`"\${client.address || ''}"\`,
                    \`"\${client.contract_plan || ''}"\`,
                    client.employee_count || 0,
                    client.monthly_fee || 0,
                    client.active_tasks || 0,
                    \`"\${client.notes || ''}"\`
                ].join(','))
            ].join('\\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', \`顧問先一覧_\${new Date().toLocaleDateString('ja-JP').replace(/\\//g, '')}.csv\`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showToast('CSVファイルをダウンロードしました', 'success');
        }
        
        async function editClient(clientId) {
            try {
                const res = await axios.get(\`/api/clients/\${clientId}\`);
                const client = res.data.client;
                
                // Populate the form with existing data
                document.querySelector('input[name="name"]').value = client.name || '';
                document.querySelector('input[name="company_name"]').value = client.company_name || '';
                document.querySelector('input[name="email"]').value = client.email || '';
                document.querySelector('input[name="phone"]').value = client.phone || '';
                document.querySelector('input[name="address"]').value = client.address || '';
                document.querySelector('input[name="employee_count"]').value = client.employee_count || '';
                document.querySelector('input[name="monthly_fee"]').value = client.monthly_fee || '';
                document.querySelector('select[name="contract_plan"]').value = client.contract_plan || '';
                document.querySelector('textarea[name="notes"]').value = client.notes || '';
                
                // Change form submission behavior for editing
                const form = document.getElementById('newClientForm');
                form.onsubmit = async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const clientData = Object.fromEntries(formData);
                    
                    try {
                        await axios.put(\`/api/clients/\${clientId}\`, clientData);
                        closeNewClientModal();
                        await loadClients();
                        showToast('顧問先情報を更新しました', 'success');
                        
                        // Reset form to original create behavior
                        resetFormToCreateMode();
                    } catch (error) {
                        console.error('Failed to update client:', error);
                        showToast('顧問先の更新に失敗しました', 'error');
                    }
                };
                
                // Change modal title and button text
                document.querySelector('#newClientModal h3').textContent = '顧問先情報編集';
                document.querySelector('#newClientForm button[type="submit"]').textContent = '更新';
                
                openNewClientModal();
            } catch (error) {
                console.error('Failed to load client for editing:', error);
                showToast('顧問先情報の取得に失敗しました', 'error');
            }
        }
        
        function resetFormToCreateMode() {
            document.querySelector('#newClientModal h3').textContent = '新規顧問先登録';
            document.querySelector('#newClientForm button[type="submit"]').textContent = '登録';
            
            // Reset form submission to original create behavior
            const form = document.getElementById('newClientForm');
            form.onsubmit = async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const clientData = Object.fromEntries(formData);
                
                try {
                    await axios.post('/api/clients', clientData);
                    closeNewClientModal();
                    await loadClients();
                    showToast('顧問先を登録しました', 'success');
                } catch (error) {
                    showToast('顧問先の登録に失敗しました', 'error');
                }
            };
        }

        async function generateTasksForClient(clientId) {
            const month = new Date().toISOString().slice(0, 7);
            if (confirm(\`\${month}のタスクを自動生成しますか？\`)) {
                try {
                    const res = await axios.post('/api/ai/generate-tasks', {
                        client_id: clientId,
                        month: month
                    });
                    showToast(res.data.message || 'タスクを生成しました', 'success');
                } catch (error) {
                    console.error('Error generating tasks:', error);
                    showToast('タスク生成に失敗しました', 'error');
                }
            }
        }
        
        // Add axios interceptor for authentication errors
        axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response && error.response.status === 401) {
                    console.log('Authentication required, redirecting to login');
                    window.location.href = '/login';
                    return Promise.reject(error);
                }
                return Promise.reject(error);
            }
        );

        // Load clients on page load
        document.addEventListener('DOMContentLoaded', loadClients);
    </script>
</body>
</html>
  `
}
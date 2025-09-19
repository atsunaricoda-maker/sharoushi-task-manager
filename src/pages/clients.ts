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

        <!-- Client List -->
        <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b flex justify-between items-center">
                <h2 class="text-lg font-semibold text-gray-900">顧問先一覧</h2>
                <div class="flex space-x-2">
                    <button onclick="openNewClientModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>新規顧問先
                    </button>
                    <button class="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">
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
                            <label class="block text-sm font-medium text-gray-700">会社名 <span class="text-red-500">*</span></label>
                            <input type="text" name="name" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">会社名（カナ）</label>
                            <input type="text" name="name_kana" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700">住所</label>
                        <input type="text" name="address" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">連絡先メール</label>
                            <input type="email" name="contact_email" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">電話番号</label>
                            <input type="tel" name="contact_phone" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">従業員数</label>
                            <input type="number" name="employee_count" min="1" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">健康保険</label>
                            <select name="health_insurance_type" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                <option value="">選択してください</option>
                                <option value="協会けんぽ">協会けんぽ</option>
                                <option value="健保組合">健保組合</option>
                                <option value="その他">その他</option>
                            </select>
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
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">担当者名</label>
                            <input type="text" name="primary_contact_name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">月額顧問料</label>
                            <input type="number" name="monthly_fee" min="0" step="1000" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        </div>
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
        // Load clients on page load
        async function loadClients() {
            try {
                const res = await axios.get('/api/clients');
                const clients = res.data.clients;
                
                // Update stats
                document.getElementById('totalClients').textContent = clients.length;
                document.getElementById('activeTasks').textContent = clients.reduce((sum, c) => sum + (c.active_tasks || 0), 0);
                document.getElementById('totalRevenue').textContent = '¥' + clients.reduce((sum, c) => sum + (c.monthly_fee || 0), 0).toLocaleString();
                document.getElementById('avgEmployees').textContent = Math.round(clients.reduce((sum, c) => sum + (c.employee_count || 0), 0) / clients.length) || 0;
                
                // Render client table
                const tbody = document.getElementById('clientTableBody');
                tbody.innerHTML = clients.map(client => \`
                    <tr class="hover:bg-gray-50 cursor-pointer" onclick="showClientDetail(\${client.id})">
                        <td class="px-6 py-4">
                            <div class="text-sm font-medium text-gray-900">\${client.name}</div>
                            <div class="text-sm text-gray-500">\${client.primary_contact_name || '-'}</div>
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
                            <button onclick="event.stopPropagation(); editClient(\${client.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="event.stopPropagation(); generateTasksForClient(\${client.id})" class="text-purple-600 hover:text-purple-900">
                                <i class="fas fa-magic"></i>
                            </button>
                        </td>
                    </tr>
                \`).join('');
            } catch (error) {
                console.error('Failed to load clients:', error);
            }
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
        }
        
        document.getElementById('newClientForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const clientData = Object.fromEntries(formData);
            
            try {
                await axios.post('/api/clients', clientData);
                closeNewClientModal();
                await loadClients();
                alert('顧問先を登録しました');
            } catch (error) {
                alert('顧問先の登録に失敗しました');
            }
        });
        
        async function generateTasksForClient(clientId) {
            const month = new Date().toISOString().slice(0, 7);
            if (confirm(\`\${month}のタスクを自動生成しますか？\`)) {
                try {
                    const res = await axios.post('/api/ai/generate-tasks', {
                        client_id: clientId,
                        month: month
                    });
                    alert(res.data.message);
                } catch (error) {
                    alert('タスク生成に失敗しました');
                }
            }
        }
        
        // Load clients on page load
        document.addEventListener('DOMContentLoaded', loadClients);
    </script>
</body>
</html>
  `
}
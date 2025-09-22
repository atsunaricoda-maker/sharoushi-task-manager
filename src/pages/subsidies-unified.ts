export function getUnifiedSubsidiesPage(userName: string): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>助成金管理 - 社労士事務所タスク管理</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        .subsidy-card {
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .subsidy-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .application-status-preparing { border-left: 4px solid #f59e0b; }
        .application-status-submitted { border-left: 4px solid #3b82f6; }
        .application-status-approved { border-left: 4px solid #10b981; }
        .application-status-rejected { border-left: 4px solid #ef4444; }
        
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
        
        /* Tab styling */
        .tab-button {
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }
        
        .tab-button.active {
            border-bottom-color: #3b82f6;
            color: #3b82f6;
            font-weight: 600;
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
                        <i class="fas fa-coins mr-2 text-yellow-600"></i>
                        助成金管理
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
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-lg p-6 text-center">
                <div class="text-3xl font-bold text-orange-600" id="preparingCount">0</div>
                <div class="text-gray-600 mt-1">準備中</div>
            </div>
            
            <div class="bg-white rounded-lg shadow-lg p-6 text-center">
                <div class="text-3xl font-bold text-blue-600" id="submittedCount">0</div>
                <div class="text-gray-600 mt-1">申請済み</div>
            </div>
            
            <div class="bg-white rounded-lg shadow-lg p-6 text-center">
                <div class="text-3xl font-bold text-green-600" id="approvedCount">0</div>
                <div class="text-gray-600 mt-1">承認済み</div>
            </div>
            
            <div class="bg-white rounded-lg shadow-lg p-6 text-center">
                <div class="text-3xl font-bold text-purple-600" id="totalAmountCount">0</div>
                <div class="text-gray-600 mt-1">予想受給額(万円)</div>
            </div>
        </div>

        <!-- Simple Tab Navigation -->
        <div class="bg-white rounded-lg shadow mb-6">
            <div class="border-b border-gray-200">
                <nav class="-mb-px flex">
                    <button onclick="switchTab('applications')" id="tab-applications" class="tab-button active px-6 py-3 text-sm font-medium">
                        <i class="fas fa-clipboard-list mr-2"></i>申請管理
                    </button>
                    <button onclick="switchTab('search')" id="tab-search" class="tab-button px-6 py-3 text-sm font-medium">
                        <i class="fas fa-search mr-2"></i>助成金検索
                    </button>
                    <button onclick="switchTab('deadlines')" id="tab-deadlines" class="tab-button px-6 py-3 text-sm font-medium">
                        <i class="fas fa-calendar-alt mr-2"></i>期限確認
                    </button>
                </nav>
            </div>
        </div>

        <!-- Tab Contents -->
        
        <!-- Applications Tab -->
        <div id="content-applications" class="tab-content">
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b flex justify-between items-center">
                    <h2 class="text-lg font-semibold text-gray-900">申請プロジェクト</h2>
                    <button onclick="openNewApplicationModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>新規申請
                    </button>
                </div>
                
                <div id="applicationsList" class="p-6 space-y-4">
                    <!-- Applications will be loaded here -->
                </div>
            </div>
        </div>
        
        <!-- Search Tab -->
        <div id="content-search" class="tab-content hidden">
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b">
                    <h2 class="text-lg font-semibold text-gray-900">助成金検索</h2>
                </div>
                
                <!-- Search Filters -->
                <div class="p-6 border-b bg-gray-50">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">キーワード</label>
                            <input type="text" id="searchKeyword" placeholder="助成金名で検索" 
                                   class="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"
                                   oninput="searchSubsidies()">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">カテゴリ</label>
                            <select id="searchCategory" onchange="searchSubsidies()" class="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500">
                                <option value="">すべて</option>
                                <option value="雇用系">雇用系</option>
                                <option value="育成系">育成系</option>
                                <option value="福祉系">福祉系</option>
                                <option value="その他">その他</option>
                            </select>
                        </div>
                        <div class="flex items-end">
                            <button onclick="clearSearch()" class="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md">
                                <i class="fas fa-eraser mr-2"></i>クリア
                            </button>
                        </div>
                    </div>
                </div>
                
                <div id="subsidySearchResults" class="p-6">
                    <!-- Search results will be loaded here -->
                </div>
            </div>
        </div>
        
        <!-- Deadlines Tab -->
        <div id="content-deadlines" class="tab-content hidden">
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b">
                    <h2 class="text-lg font-semibold text-gray-900">申請期限・重要日程</h2>
                </div>
                
                <div id="deadlinesList" class="p-6 space-y-4">
                    <!-- Deadlines will be loaded here -->
                </div>
            </div>
        </div>
    </main>

    <!-- New Application Modal -->
    <div id="newApplicationModal" class="modal">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div class="px-6 py-4 border-b flex justify-between items-center">
                <h3 class="text-lg font-semibold">新規申請プロジェクト</h3>
                <button onclick="closeNewApplicationModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="newApplicationForm" class="p-6 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">助成金名 *</label>
                        <input type="text" name="subsidy_name" required class="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">顧問先 *</label>
                        <select name="client_id" required class="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500">
                            <option value="">選択してください</option>
                        </select>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">申請予定日</label>
                        <input type="date" name="application_date" class="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">申請期限</label>
                        <input type="date" name="deadline_date" class="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">予想受給額（円）</label>
                        <input type="number" name="expected_amount" min="0" step="10000" class="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                        <select name="status" class="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500">
                            <option value="preparing">準備中</option>
                            <option value="submitted">申請済み</option>
                            <option value="approved">承認済み</option>
                            <option value="rejected">却下</option>
                        </select>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">メモ・備考</label>
                    <textarea name="notes" rows="3" class="w-full rounded-md border-gray-300 focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
                
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" onclick="closeNewApplicationModal()" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                        キャンセル
                    </button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        作成
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        let applications = [];
        let subsidies = [];
        let clients = [];
        let currentTab = 'applications';

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
            await loadAllData();
            renderCurrentTab();
        });

        // Load all data
        async function loadAllData() {
            try {
                await Promise.all([
                    loadApplications(),
                    loadSubsidies(),
                    loadClients()
                ]);
            } catch (error) {
                console.error('Failed to load data:', error);
                showToast('データの読み込みに失敗しました', 'error');
            }
        }

        // Load applications
        async function loadApplications() {
            try {
                const response = await axios.get('/api/subsidies/applications');
                applications = response.data.applications || [];
                updateStats();
            } catch (error) {
                console.error('Failed to load applications:', error);
                applications = [];
            }
        }

        // Load subsidies for search
        async function loadSubsidies() {
            try {
                const response = await axios.get('/api/subsidies');
                subsidies = response.data.subsidies || [];
            } catch (error) {
                console.error('Failed to load subsidies:', error);
                subsidies = [];
            }
        }

        // Load clients
        async function loadClients() {
            try {
                const response = await axios.get('/api/clients');
                clients = response.data.clients || [];
                
                // Populate client dropdown
                const clientSelect = document.querySelector('select[name="client_id"]');
                clientSelect.innerHTML = '<option value="">選択してください</option>';
                clients.forEach(client => {
                    const option = document.createElement('option');
                    option.value = client.id;
                    option.textContent = client.name || client.company_name;
                    clientSelect.appendChild(option);
                });
            } catch (error) {
                console.error('Failed to load clients:', error);
                clients = [];
            }
        }

        // Update statistics
        function updateStats() {
            const preparing = applications.filter(a => a.status === 'preparing').length;
            const submitted = applications.filter(a => a.status === 'submitted').length;
            const approved = applications.filter(a => a.status === 'approved').length;
            const totalAmount = applications
                .filter(a => a.status === 'approved' && a.expected_amount)
                .reduce((sum, a) => sum + (a.expected_amount || 0), 0);
            
            document.getElementById('preparingCount').textContent = preparing;
            document.getElementById('submittedCount').textContent = submitted;
            document.getElementById('approvedCount').textContent = approved;
            document.getElementById('totalAmountCount').textContent = Math.round(totalAmount / 10000);
        }

        // Tab switching
        function switchTab(tabName) {
            // Update tab buttons
            document.querySelectorAll('.tab-button').forEach(tab => {
                tab.classList.remove('active');
            });
            document.getElementById(\`tab-\${tabName}\`).classList.add('active');
            
            // Update content
            document.querySelectorAll('[id^="content-"]').forEach(content => {
                content.classList.add('hidden');
            });
            document.getElementById(\`content-\${tabName}\`).classList.remove('hidden');
            
            currentTab = tabName;
            renderCurrentTab();
        }

        // Render current tab content
        function renderCurrentTab() {
            switch(currentTab) {
                case 'applications':
                    renderApplications();
                    break;
                case 'search':
                    renderSubsidySearch();
                    break;
                case 'deadlines':
                    renderDeadlines();
                    break;
            }
        }

        // Render applications
        function renderApplications() {
            const container = document.getElementById('applicationsList');
            
            if (applications.length === 0) {
                container.innerHTML = \`
                    <div class="text-center py-12">
                        <i class="fas fa-clipboard-list text-3xl text-gray-300 mb-4"></i>
                        <p class="text-gray-600">申請プロジェクトがありません</p>
                        <button onclick="openNewApplicationModal()" class="mt-4 text-blue-600 hover:text-blue-800">
                            最初の申請を作成
                        </button>
                    </div>
                \`;
                return;
            }
            
            const statusLabels = {
                preparing: '準備中',
                submitted: '申請済み',
                approved: '承認済み',
                rejected: '却下'
            };
            
            const statusColors = {
                preparing: 'bg-orange-100 text-orange-800',
                submitted: 'bg-blue-100 text-blue-800',
                approved: 'bg-green-100 text-green-800',
                rejected: 'bg-red-100 text-red-800'
            };
            
            container.innerHTML = applications.map(app => {
                const client = clients.find(c => c.id === app.client_id);
                const clientName = client ? client.name || client.company_name : '未設定';
                const deadlineDate = app.deadline_date ? new Date(app.deadline_date).toLocaleDateString('ja-JP') : '未設定';
                const amount = app.expected_amount ? \`¥\${app.expected_amount.toLocaleString()}\` : '未設定';
                
                return \`
                    <div class="subsidy-card bg-white border rounded-lg p-6 application-status-\${app.status}" onclick="editApplication(\${app.id})">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">\${app.subsidy_name}</h3>
                                <p class="text-gray-600">\${clientName}</p>
                            </div>
                            <span class="px-2 py-1 rounded-full text-xs font-medium \${statusColors[app.status]}">
                                \${statusLabels[app.status]}
                            </span>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                                <i class="fas fa-calendar mr-1"></i>
                                期限: \${deadlineDate}
                            </div>
                            <div>
                                <i class="fas fa-yen-sign mr-1"></i>
                                予想額: \${amount}
                            </div>
                        </div>
                        
                        \${app.notes ? \`
                            <div class="mt-4 text-sm text-gray-600">
                                <i class="fas fa-sticky-note mr-1"></i>
                                \${app.notes.length > 60 ? app.notes.substring(0, 60) + '...' : app.notes}
                            </div>
                        \` : ''}
                    </div>
                \`;
            }).join('');
        }

        // Render subsidy search results
        function renderSubsidySearch() {
            const container = document.getElementById('subsidySearchResults');
            
            if (subsidies.length === 0) {
                container.innerHTML = \`
                    <div class="text-center py-12">
                        <i class="fas fa-search text-3xl text-gray-300 mb-4"></i>
                        <p class="text-gray-600">助成金情報を読み込み中...</p>
                    </div>
                \`;
                return;
            }
            
            const filteredSubsidies = getFilteredSubsidies();
            
            if (filteredSubsidies.length === 0) {
                container.innerHTML = \`
                    <div class="text-center py-12">
                        <i class="fas fa-search text-3xl text-gray-300 mb-4"></i>
                        <p class="text-gray-600">該当する助成金が見つかりません</p>
                        <button onclick="clearSearch()" class="mt-2 text-blue-600 hover:text-blue-800">
                            検索条件をクリア
                        </button>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = \`
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    \${filteredSubsidies.map(subsidy => \`
                        <div class="subsidy-card border rounded-lg p-4">
                            <h4 class="font-semibold text-gray-900 mb-2">\${subsidy.name}</h4>
                            <p class="text-sm text-gray-600 mb-3">\${subsidy.description || '詳細な説明はありません'}</p>
                            <div class="flex justify-between items-center text-xs text-gray-500">
                                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded">\${subsidy.category || 'その他'}</span>
                                \${subsidy.max_amount ? \`<span>最大 ¥\${subsidy.max_amount.toLocaleString()}</span>\` : ''}
                            </div>
                            <div class="mt-3">
                                <button onclick="createApplicationFromSubsidy(\${subsidy.id})" class="w-full bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                                    この助成金で申請作成
                                </button>
                            </div>
                        </div>
                    \`).join('')}
                </div>
            \`;
        }

        // Render deadlines
        function renderDeadlines() {
            const container = document.getElementById('deadlinesList');
            
            // Get applications with deadlines in the next 30 days
            const today = new Date();
            const thirtyDaysLater = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
            
            const upcomingDeadlines = applications.filter(app => {
                if (!app.deadline_date) return false;
                const deadline = new Date(app.deadline_date);
                return deadline >= today && deadline <= thirtyDaysLater;
            }).sort((a, b) => new Date(a.deadline_date) - new Date(b.deadline_date));
            
            if (upcomingDeadlines.length === 0) {
                container.innerHTML = \`
                    <div class="text-center py-12">
                        <i class="fas fa-calendar-check text-3xl text-green-400 mb-4"></i>
                        <p class="text-gray-600">今後30日以内の申請期限はありません</p>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = upcomingDeadlines.map(app => {
                const client = clients.find(c => c.id === app.client_id);
                const clientName = client ? client.name || client.company_name : '未設定';
                const deadline = new Date(app.deadline_date);
                const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
                
                let urgencyClass = 'border-blue-500';
                let urgencyIcon = 'fa-info-circle';
                if (daysUntil <= 3) {
                    urgencyClass = 'border-red-500';
                    urgencyIcon = 'fa-exclamation-triangle';
                } else if (daysUntil <= 7) {
                    urgencyClass = 'border-yellow-500';
                    urgencyIcon = 'fa-exclamation';
                }
                
                return \`
                    <div class="border-l-4 \${urgencyClass} bg-white rounded-r-lg p-4">
                        <div class="flex items-start justify-between">
                            <div>
                                <h4 class="font-semibold text-gray-900">\${app.subsidy_name}</h4>
                                <p class="text-gray-600">\${clientName}</p>
                                <div class="flex items-center mt-2 text-sm text-gray-500">
                                    <i class="fas \${urgencyIcon} mr-2"></i>
                                    期限: \${deadline.toLocaleDateString('ja-JP')} (あと\${daysUntil}日)
                                </div>
                            </div>
                            <button onclick="editApplication(\${app.id})" class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    </div>
                \`;
            }).join('');
        }

        // Search functions
        function getFilteredSubsidies() {
            const keyword = document.getElementById('searchKeyword').value.toLowerCase();
            const category = document.getElementById('searchCategory').value;
            
            return subsidies.filter(subsidy => {
                const matchesKeyword = !keyword || subsidy.name.toLowerCase().includes(keyword);
                const matchesCategory = !category || subsidy.category === category;
                return matchesKeyword && matchesCategory;
            });
        }

        function searchSubsidies() {
            if (currentTab === 'search') {
                renderSubsidySearch();
            }
        }

        function clearSearch() {
            document.getElementById('searchKeyword').value = '';
            document.getElementById('searchCategory').value = '';
            searchSubsidies();
        }

        // Modal functions
        function openNewApplicationModal() {
            document.getElementById('newApplicationModal').classList.add('active');
        }

        function closeNewApplicationModal() {
            document.getElementById('newApplicationModal').classList.remove('active');
            document.getElementById('newApplicationForm').reset();
        }

        // Create application from subsidy
        function createApplicationFromSubsidy(subsidyId) {
            const subsidy = subsidies.find(s => s.id === subsidyId);
            if (subsidy) {
                document.querySelector('input[name="subsidy_name"]').value = subsidy.name;
                openNewApplicationModal();
            }
        }

        // Edit application (simplified)
        function editApplication(applicationId) {
            showToast('編集機能は業務管理画面で利用できます', 'info');
        }

        // Form submission
        document.getElementById('newApplicationForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const formData = new FormData(e.target);
                const applicationData = Object.fromEntries(formData);
                
                await axios.post('/api/subsidies/applications', applicationData);
                closeNewApplicationModal();
                await loadApplications();
                renderCurrentTab();
                showToast('申請プロジェクトを作成しました', 'success');
            } catch (error) {
                console.error('Failed to create application:', error);
                showToast('申請プロジェクトの作成に失敗しました', 'error');
            }
        });

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
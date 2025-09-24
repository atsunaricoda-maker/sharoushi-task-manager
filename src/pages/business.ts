export function getBusinessManagementPage(user: any) {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>業務管理 - 社労士事務所タスク管理</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/locale/ja.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/plugin/relativeTime.js"></script>
    <style>
        /* Unified styling for tasks and calendar */
        .business-card {
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .business-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .status-pending { 
            background-color: #f3f4f6; 
            color: #6b7280;
        }
        .status-in_progress { 
            background-color: #dbeafe; 
            color: #1e40af;
        }
        .status-completed { 
            background-color: #d1fae5; 
            color: #065f46;
        }
        .status-cancelled { 
            background-color: #fee2e2; 
            color: #991b1b;
        }
        
        .priority-low { border-left: 4px solid #6b7280; }
        .priority-medium { border-left: 4px solid #3b82f6; }
        .priority-high { border-left: 4px solid #f59e0b; }
        .priority-urgent { border-left: 4px solid #ef4444; }
        
        /* Mini calendar styles */
        .mini-calendar {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 2px;
            font-size: 11px;
        }
        
        .mini-day {
            padding: 4px 2px;
            text-align: center;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .mini-day:hover {
            background-color: #e5e7eb;
        }
        
        .mini-day.today {
            background-color: #3b82f6;
            color: white;
        }
        
        .mini-day.has-events {
            background-color: #dbeafe;
            font-weight: 600;
        }
        
        .mini-day.weekend {
            color: #ef4444;
        }
        
        .mini-day.other-month {
            color: #9ca3af;
        }
        
        /* Tab switching */
        .tab-active {
            border-bottom: 2px solid #3b82f6;
            color: #3b82f6;
            font-weight: 600;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        /* Event indicators */
        .event-indicator {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            margin: 1px;
            display: inline-block;
        }
        
        .event-meeting { background-color: #10b981; }
        .event-deadline { background-color: #ef4444; }
        .event-visit { background-color: #8b5cf6; }
        .event-other { background-color: #3b82f6; }
        
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
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center space-x-4">
                    <button onclick="window.location.href='/'" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h1 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-briefcase mr-2 text-blue-600"></i>
                        業務管理
                    </h1>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-600">
                        <i class="fas fa-user-circle mr-1"></i>
                        ${user.name}
                    </span>
                    <button onclick="window.location.href='/auth/logout'" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Quick Overview Dashboard -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <!-- Today's Schedule -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">今日の予定</h3>
                    <i class="fas fa-calendar-day text-blue-600"></i>
                </div>
                <div class="text-3xl font-bold text-blue-800" id="todayScheduleCount">0</div>
                <p class="text-sm text-gray-600 mt-1">件の予定</p>
            </div>
            
            <!-- Active Tasks -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">進行中タスク</h3>
                    <i class="fas fa-tasks text-green-600"></i>
                </div>
                <div class="text-3xl font-bold text-green-800" id="activeTasksCount">0</div>
                <p class="text-sm text-gray-600 mt-1">件のタスク</p>
            </div>
            
            <!-- Upcoming Deadlines -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">今週の期限</h3>
                    <i class="fas fa-exclamation-triangle text-orange-600"></i>
                </div>
                <div class="text-3xl font-bold text-orange-800" id="upcomingDeadlinesCount">0</div>
                <p class="text-sm text-gray-600 mt-1">件の期限</p>
            </div>
            
            <!-- Client Meetings -->
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-900">今週の面談</h3>
                    <i class="fas fa-handshake text-purple-600"></i>
                </div>
                <div class="text-3xl font-bold text-purple-800" id="weekMeetingsCount">0</div>
                <p class="text-sm text-gray-600 mt-1">件の面談</p>
            </div>
        </div>

        <!-- Main Business Interface -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Left Column: Mini Calendar & Quick Actions -->
            <div class="space-y-6">
                <!-- Mini Calendar -->
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">カレンダー</h3>
                        <div class="flex space-x-2">
                            <button onclick="previousMonth()" class="p-1 text-gray-500 hover:text-gray-700">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <button onclick="nextMonth()" class="p-1 text-gray-500 hover:text-gray-700">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                    <div class="text-center mb-4">
                        <div id="miniCalendarMonth" class="text-lg font-semibold"></div>
                    </div>
                    <div class="mini-calendar mb-2">
                        <div class="mini-day font-semibold text-gray-600">日</div>
                        <div class="mini-day font-semibold text-gray-600">月</div>
                        <div class="mini-day font-semibold text-gray-600">火</div>
                        <div class="mini-day font-semibold text-gray-600">水</div>
                        <div class="mini-day font-semibold text-gray-600">木</div>
                        <div class="mini-day font-semibold text-gray-600">金</div>
                        <div class="mini-day font-semibold text-gray-600">土</div>
                    </div>
                    <div id="miniCalendarGrid" class="mini-calendar">
                        <!-- Calendar days will be generated here -->
                    </div>
                    <div class="mt-4 text-center">
                        <button onclick="switchToCalendarView()" class="text-blue-600 hover:text-blue-800 text-sm">
                            詳細カレンダーを開く
                        </button>
                    </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">クイックアクション</h3>
                    <div class="space-y-3">
                        <button onclick="openCreateTaskModal()" class="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-plus mr-2"></i>新規タスク作成
                        </button>
                        <button onclick="openCreateScheduleModal()" class="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <i class="fas fa-calendar-plus mr-2"></i>予定を追加
                        </button>
                        <button onclick="switchToClientView()" class="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                            <i class="fas fa-building mr-2"></i>顧問先管理
                        </button>
                    </div>
                </div>

                <!-- Today's Priority Items -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">今日の優先事項</h3>
                    <div id="todayPriorityItems" class="space-y-2">
                        <!-- Priority items will be loaded here -->
                    </div>
                </div>
            </div>

            <!-- Center Column: Main Content Area -->
            <div class="lg:col-span-2">
                <!-- Tab Navigation -->
                <div class="bg-white rounded-lg shadow mb-6">
                    <div class="border-b border-gray-200">
                        <nav class="-mb-px flex">
                            <button onclick="switchTab('overview')" id="tab-overview" class="tab-active px-6 py-3 text-sm font-medium border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300">
                                概要
                            </button>
                            <button onclick="switchTab('tasks')" id="tab-tasks" class="px-6 py-3 text-sm font-medium border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300">
                                タスク
                            </button>
                            <button onclick="switchTab('schedule')" id="tab-schedule" class="px-6 py-3 text-sm font-medium border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300">
                                スケジュール
                            </button>
                            <button onclick="switchTab('timeline')" id="tab-timeline" class="px-6 py-3 text-sm font-medium border-b-2 border-transparent hover:text-gray-700 hover:border-gray-300">
                                タイムライン
                            </button>
                        </nav>
                    </div>
                </div>

                <!-- Tab Content Areas -->
                <div class="space-y-6">
                    <!-- Overview Tab -->
                    <div id="content-overview" class="tab-content active">
                        <!-- Unified Task & Schedule View -->
                        <div class="bg-white rounded-lg shadow p-6">
                            <div class="flex justify-between items-center mb-6">
                                <h3 class="text-lg font-semibold text-gray-900">今週の業務概要</h3>
                                <div class="flex space-x-2">
                                    <select id="overviewFilter" onchange="filterOverviewItems()" class="text-sm rounded-md border-gray-300">
                                        <option value="all">すべて</option>
                                        <option value="tasks">タスクのみ</option>
                                        <option value="schedules">予定のみ</option>
                                        <option value="urgent">緊急のみ</option>
                                    </select>
                                </div>
                            </div>
                            <div id="overviewContent" class="space-y-4">
                                <!-- Unified items will be displayed here -->
                            </div>
                        </div>
                    </div>

                    <!-- Tasks Tab -->
                    <div id="content-tasks" class="tab-content">
                        <div class="bg-white rounded-lg shadow p-6">
                            <div class="flex justify-between items-center mb-6">
                                <h3 class="text-lg font-semibold text-gray-900">タスク管理</h3>
                                <div class="flex space-x-2">
                                    <select id="taskStatusFilter" onchange="filterTasks()" class="text-sm rounded-md border-gray-300">
                                        <option value="">すべてのステータス</option>
                                        <option value="pending">未着手</option>
                                        <option value="in_progress">進行中</option>
                                        <option value="completed">完了</option>
                                    </select>
                                    <select id="taskPriorityFilter" onchange="filterTasks()" class="text-sm rounded-md border-gray-300">
                                        <option value="">すべての優先度</option>
                                        <option value="urgent">緊急</option>
                                        <option value="high">高</option>
                                        <option value="medium">中</option>
                                        <option value="low">低</option>
                                    </select>
                                </div>
                            </div>
                            <div id="tasksList" class="space-y-4">
                                <!-- Tasks will be loaded here -->
                            </div>
                        </div>
                    </div>

                    <!-- Schedule Tab -->
                    <div id="content-schedule" class="tab-content">
                        <div class="bg-white rounded-lg shadow p-6">
                            <div class="flex justify-between items-center mb-6">
                                <h3 class="text-lg font-semibold text-gray-900">スケジュール管理</h3>
                                <div class="flex space-x-2">
                                    <select id="scheduleTypeFilter" onchange="filterSchedule()" class="text-sm rounded-md border-gray-300">
                                        <option value="">すべてのタイプ</option>
                                        <option value="meeting">面談</option>
                                        <option value="visit">訪問</option>
                                        <option value="deadline">期限</option>
                                        <option value="other">その他</option>
                                    </select>
                                </div>
                            </div>
                            <div id="scheduleList" class="space-y-4">
                                <!-- Schedule items will be loaded here -->
                            </div>
                        </div>
                    </div>

                    <!-- Timeline Tab -->
                    <div id="content-timeline" class="tab-content">
                        <div class="bg-white rounded-lg shadow p-6">
                            <div class="flex justify-between items-center mb-6">
                                <h3 class="text-lg font-semibold text-gray-900">業務タイムライン</h3>
                                <div class="flex space-x-2">
                                    <select id="timelineRange" onchange="filterTimeline()" class="text-sm rounded-md border-gray-300">
                                        <option value="today">今日</option>
                                        <option value="week" selected>今週</option>
                                        <option value="month">今月</option>
                                    </select>
                                </div>
                            </div>
                            <div id="timelineContent" class="space-y-6">
                                <!-- Timeline will be displayed here -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Create Task Modal -->
    <div id="createTaskModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white rounded-lg max-w-2xl w-full mx-4">
            <div class="border-b px-6 py-4 flex justify-between items-center">
                <h2 class="text-xl font-semibold">新規タスク作成</h2>
                <button onclick="closeCreateTaskModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="createTaskForm" class="p-6 space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">タイトル *</label>
                    <input type="text" name="title" required class="w-full rounded-md border-gray-300">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">説明</label>
                    <textarea name="description" rows="3" class="w-full rounded-md border-gray-300"></textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">顧客</label>
                        <select name="client_id" class="w-full rounded-md border-gray-300">
                            <option value="">選択してください</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">優先度</label>
                        <select name="priority" class="w-full rounded-md border-gray-300">
                            <option value="low">低</option>
                            <option value="medium" selected>中</option>
                            <option value="high">高</option>
                            <option value="urgent">緊急</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">期限</label>
                    <input type="date" name="due_date" class="w-full rounded-md border-gray-300">
                </div>
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" onclick="closeCreateTaskModal()" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                        キャンセル
                    </button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        作成
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Create Schedule Modal -->
    <div id="createScheduleModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white rounded-lg max-w-2xl w-full mx-4">
            <div class="border-b px-6 py-4 flex justify-between items-center">
                <h2 class="text-xl font-semibold">新規予定登録</h2>
                <button onclick="closeCreateScheduleModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="createScheduleForm" class="p-6 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">予定名 *</label>
                        <input type="text" name="title" required class="w-full rounded-md border-gray-300">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">予定タイプ</label>
                        <select name="entry_type" class="w-full rounded-md border-gray-300">
                            <option value="meeting">顧問先面談</option>
                            <option value="visit">顧問先訪問</option>
                            <option value="deadline">手続き期限</option>
                            <option value="other">その他</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">顧問先</label>
                    <select name="client_id" class="w-full rounded-md border-gray-300">
                        <option value="">選択してください</option>
                    </select>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">開始日時 *</label>
                        <input type="datetime-local" name="start_time" required class="w-full rounded-md border-gray-300">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">終了日時</label>
                        <input type="datetime-local" name="end_time" class="w-full rounded-md border-gray-300">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">場所</label>
                    <input type="text" name="location" class="w-full rounded-md border-gray-300">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">詳細</label>
                    <textarea name="description" rows="3" class="w-full rounded-md border-gray-300"></textarea>
                </div>
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" onclick="closeCreateScheduleModal()" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                        キャンセル
                    </button>
                    <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        登録
                    </button>
                </div>
            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        dayjs.locale('ja');
        dayjs.extend(window.dayjs_plugin_relativeTime);

        // Global state
        let currentDate = dayjs();
        let tasks = [];
        let scheduleEvents = [];
        let clients = [];
        let currentTab = 'overview';

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

        // Global error handler for null reference errors
        window.addEventListener('error', function(e) {
            if (e.message.includes('Cannot set properties of null') || 
                e.message.includes('Cannot read properties of null')) {
                console.error('🚫 Null reference error caught:', e.message);
                console.error('🚫 Error location:', e.filename, 'line', e.lineno);
                console.error('🚫 Stack:', e.error?.stack);
                
                // Show user-friendly error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
                errorDiv.innerHTML = '<strong>ページ読み込みエラー</strong><br>一部の機能が正常に動作しない可能性があります。<br><button onclick="this.parentElement.remove()" class="text-red-900 underline">閉じる</button>';
                document.body.appendChild(errorDiv);
                
                // Auto-remove after 10 seconds
                setTimeout(() => {
                    if (errorDiv.parentElement) {
                        errorDiv.remove();
                    }
                }, 10000);
                
                return true; // Prevent default error handling
            }
        });

        // Initialize
        document.addEventListener('DOMContentLoaded', async () => {
            await loadAllData();
            renderInterface();
        });

        // Load all data
        async function loadAllData() {
            try {
                await Promise.all([
                    loadTasks(),
                    loadScheduleEvents(),
                    loadClients()
                ]);
            } catch (error) {
                console.error('Failed to load data:', error);
                showToast('データの読み込みに失敗しました', 'error');
            }
        }

        // Load tasks
        async function loadTasks() {
            try {
                const response = await axios.get('/api/tasks');
                tasks = response.data.tasks || response.data || [];
            } catch (error) {
                console.error('Failed to load tasks:', error);
                tasks = [];
            }
        }

        // Load schedule events
        async function loadScheduleEvents() {
            try {
                const startOfMonth = currentDate.startOf('month').format('YYYY-MM-DD');
                const endOfMonth = currentDate.endOf('month').format('YYYY-MM-DD');
                
                const response = await axios.get(\`/api/schedule?start_date=\${startOfMonth}&end_date=\${endOfMonth}\`);
                scheduleEvents = response.data || [];
            } catch (error) {
                console.error('Failed to load schedule:', error);
                scheduleEvents = [];
            }
        }

        // Load clients
        async function loadClients() {
            try {
                const response = await axios.get('/api/clients');
                clients = response.data.clients || response.data || [];
                
                // Populate client dropdowns
                const clientSelects = document.querySelectorAll('select[name="client_id"]');
                clientSelects.forEach(select => {
                    select.innerHTML = '<option value="">選択してください</option>';
                    clients.forEach(client => {
                        const option = document.createElement('option');
                        option.value = client.id;
                        option.textContent = client.name || client.company_name;
                        select.appendChild(option);
                    });
                });
            } catch (error) {
                console.error('Failed to load clients:', error);
                clients = [];
            }
        }

        // Render main interface
        function renderInterface() {
            updateDashboardStats();
            renderMiniCalendar();
            renderTodayPriorityItems();
            renderTabContent();
        }

        // Update dashboard statistics
        function updateDashboardStats() {
            const today = dayjs();
            
            // Today's schedule count
            const todayEvents = scheduleEvents.filter(e => dayjs(e.start_time).isSame(today, 'day'));
            const todayScheduleCountEl = document.getElementById('todayScheduleCount');
            if (todayScheduleCountEl) {
                todayScheduleCountEl.textContent = todayEvents.length;
            } else {
                console.warn('todayScheduleCount element not found');
            }
            
            // Active tasks count
            const activeTasks = tasks.filter(t => t.status === 'in_progress' || t.status === 'pending');
            const activeTasksCountEl = document.getElementById('activeTasksCount');
            if (activeTasksCountEl) {
                activeTasksCountEl.textContent = activeTasks.length;
            } else {
                console.warn('activeTasksCount element not found');
            }
            
            // Upcoming deadlines (this week)
            const weekStart = today.startOf('week');
            const weekEnd = today.endOf('week');
            const weekDeadlines = scheduleEvents.filter(e => {
                const eventDate = dayjs(e.start_time);
                return eventDate.isAfter(weekStart) && eventDate.isBefore(weekEnd) && e.entry_type === 'deadline';
            });
            const upcomingDeadlinesCountEl = document.getElementById('upcomingDeadlinesCount');
            if (upcomingDeadlinesCountEl) {
                upcomingDeadlinesCountEl.textContent = weekDeadlines.length;
            } else {
                console.warn('upcomingDeadlinesCount element not found');
            }
            
            // Week meetings count
            const weekMeetings = scheduleEvents.filter(e => {
                const eventDate = dayjs(e.start_time);
                return eventDate.isAfter(weekStart) && eventDate.isBefore(weekEnd) && 
                       (e.entry_type === 'meeting' || e.entry_type === 'visit');
            });
            const weekMeetingsCountEl = document.getElementById('weekMeetingsCount');
            if (weekMeetingsCountEl) {
                weekMeetingsCountEl.textContent = weekMeetings.length;
            } else {
                console.warn('weekMeetingsCount element not found');
            }
        }

        // Render mini calendar
        function renderMiniCalendar() {
            const monthDisplay = document.getElementById('miniCalendarMonth');
            const calendarGrid = document.getElementById('miniCalendarGrid');
            
            monthDisplay.textContent = currentDate.format('YYYY年MM月');
            
            const startOfMonth = currentDate.startOf('month');
            const endOfMonth = currentDate.endOf('month');
            const startOfCalendar = startOfMonth.startOf('week');
            const endOfCalendar = endOfMonth.endOf('week');
            
            calendarGrid.innerHTML = '';
            
            let date = startOfCalendar;
            
            while (date.isBefore(endOfCalendar) || date.isSame(endOfCalendar, 'day')) {
                const isCurrentMonth = date.isSame(currentDate, 'month');
                const isToday = date.isSame(dayjs(), 'day');
                const isWeekend = date.day() === 0 || date.day() === 6;
                const dayEvents = getDayEvents(date);
                
                let dayClass = 'mini-day';
                if (!isCurrentMonth) dayClass += ' other-month';
                if (isToday) dayClass += ' today';
                if (isWeekend) dayClass += ' weekend';
                if (dayEvents.length > 0) dayClass += ' has-events';
                
                const dayDiv = document.createElement('div');
                dayDiv.className = dayClass;
                dayDiv.textContent = date.format('D');
                dayDiv.onclick = () => selectCalendarDate(date.format('YYYY-MM-DD'));
                
                // Add event indicators
                if (dayEvents.length > 0) {
                    const indicators = document.createElement('div');
                    indicators.className = 'flex justify-center mt-1';
                    dayEvents.slice(0, 3).forEach(event => {
                        const indicator = document.createElement('div');
                        indicator.className = \`event-indicator event-\${event.entry_type || 'other'}\`;
                        indicators.appendChild(indicator);
                    });
                    dayDiv.appendChild(indicators);
                }
                
                calendarGrid.appendChild(dayDiv);
                date = date.add(1, 'day');
            }
        }

        // Get events for a specific day
        function getDayEvents(date) {
            return scheduleEvents.filter(event => {
                const eventDate = dayjs(event.start_time);
                return eventDate.isSame(date, 'day');
            });
        }

        // Render today's priority items
        function renderTodayPriorityItems() {
            const container = document.getElementById('todayPriorityItems');
            const today = dayjs();
            
            // Get today's urgent tasks and events
            const todayTasks = tasks.filter(t => {
                if (t.due_date) {
                    return dayjs(t.due_date).isSame(today, 'day') || 
                           (dayjs(t.due_date).isBefore(today) && t.status !== 'completed');
                }
                return t.priority === 'urgent' && t.status !== 'completed';
            }).slice(0, 3);
            
            const todayEvents = scheduleEvents.filter(e => 
                dayjs(e.start_time).isSame(today, 'day')
            ).slice(0, 3);
            
            const priorityItems = [...todayTasks, ...todayEvents]
                .sort((a, b) => {
                    const timeA = dayjs(a.start_time || a.due_date);
                    const timeB = dayjs(b.start_time || b.due_date);
                    return timeA.diff(timeB);
                })
                .slice(0, 4);
            
            if (priorityItems.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-sm">優先事項はありません</p>';
                return;
            }
            
            container.innerHTML = priorityItems.map(item => {
                const isTask = item.hasOwnProperty('status');
                const time = isTask ? 
                    (item.due_date ? dayjs(item.due_date).format('HH:mm') : '期限なし') :
                    dayjs(item.start_time).format('HH:mm');
                
                return \`
                    <div class="flex items-center justify-between p-2 bg-gray-50 rounded-md text-sm">
                        <div class="flex-1">
                            <div class="font-medium">\${item.title}</div>
                            <div class="text-gray-500">\${time} • \${isTask ? 'タスク' : '予定'}</div>
                        </div>
                        <div class="text-xs">
                            \${isTask ? 
                                \`<span class="status-badge status-\${item.status}">\${getStatusLabel(item.status)}</span>\` :
                                \`<span class="px-2 py-1 bg-blue-100 text-blue-800 rounded">\${getEventTypeLabel(item.entry_type)}</span>\`
                            }
                        </div>
                    </div>
                \`;
            }).join('');
        }

        // Tab switching
        function switchTab(tabName) {
            // Update tab buttons
            document.querySelectorAll('[id^="tab-"]').forEach(tab => {
                tab.classList.remove('tab-active');
            });
            document.getElementById(\`tab-\${tabName}\`).classList.add('tab-active');
            
            // Update content
            document.querySelectorAll('[id^="content-"]').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(\`content-\${tabName}\`).classList.add('active');
            
            currentTab = tabName;
            renderTabContent();
        }

        // Render tab content
        function renderTabContent() {
            switch(currentTab) {
                case 'overview':
                    renderOverviewContent();
                    break;
                case 'tasks':
                    renderTasksContent();
                    break;
                case 'schedule':
                    renderScheduleContent();
                    break;
                case 'timeline':
                    renderTimelineContent();
                    break;
            }
        }

        // Render overview content
        function renderOverviewContent() {
            const container = document.getElementById('overviewContent');
            const filterEl = document.getElementById('overviewFilter');
            
            if (!container) {
                console.error('overviewContent container not found');
                return;
            }
            
            if (!filterEl) {
                console.error('overviewFilter element not found');
                return;
            }
            
            const filter = filterEl.value;
            
            const today = dayjs();
            const weekStart = today.startOf('week');
            const weekEnd = today.endOf('week');
            
            let items = [];
            
            // Add tasks
            if (filter === 'all' || filter === 'tasks' || filter === 'urgent') {
                const filteredTasks = tasks.filter(t => {
                    if (filter === 'urgent') return t.priority === 'urgent' || t.priority === 'high';
                    return t.status !== 'completed';
                }).map(t => ({...t, type: 'task'}));
                items.push(...filteredTasks);
            }
            
            // Add schedule events
            if (filter === 'all' || filter === 'schedules' || filter === 'urgent') {
                const filteredEvents = scheduleEvents.filter(e => {
                    const eventDate = dayjs(e.start_time);
                    if (filter === 'urgent') return e.entry_type === 'deadline';
                    return eventDate.isAfter(weekStart) && eventDate.isBefore(weekEnd);
                }).map(e => ({...e, type: 'schedule'}));
                items.push(...filteredEvents);
            }
            
            // Sort by date/priority
            items.sort((a, b) => {
                const dateA = dayjs(a.start_time || a.due_date || a.created_at);
                const dateB = dayjs(b.start_time || b.due_date || b.created_at);
                return dateA.diff(dateB);
            });
            
            if (items.length === 0) {
                container.innerHTML = '<p class="text-center text-gray-500 py-8">表示する項目がありません</p>';
                return;
            }
            
            container.innerHTML = items.slice(0, 10).map(item => {
                const isTask = item.type === 'task';
                const date = dayjs(item.start_time || item.due_date);
                const isOverdue = date.isBefore(today) && (!isTask || item.status !== 'completed');
                
                return \`
                    <div class="business-card bg-gray-50 rounded-lg p-4 \${isTask ? 'priority-' + (item.priority || 'medium') : ''}">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <div class="flex items-center space-x-2 mb-2">
                                    <i class="fas fa-\${isTask ? 'tasks' : 'calendar'} text-\${isTask ? 'blue' : 'green'}-600"></i>
                                    <h4 class="font-semibold text-gray-900">\${item.title}</h4>
                                    <span class="px-2 py-1 text-xs rounded-full \${isTask ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
                                        \${isTask ? 'タスク' : '予定'}
                                    </span>
                                </div>
                                \${item.description ? \`<p class="text-gray-600 text-sm mb-2">\${item.description}</p>\` : ''}
                                <div class="flex items-center text-xs text-gray-500 space-x-4">
                                    <span><i class="fas fa-clock mr-1"></i>\${date.format('MM/DD HH:mm')}</span>
                                    \${item.client_name ? \`<span><i class="fas fa-building mr-1"></i>\${item.client_name}</span>\` : ''}
                                    \${isOverdue ? '<span class="text-red-600"><i class="fas fa-exclamation-triangle mr-1"></i>期限超過</span>' : ''}
                                </div>
                            </div>
                            <div class="flex flex-col items-end space-y-1">
                                \${isTask ? 
                                    \`<span class="status-badge status-\${item.status}">\${getStatusLabel(item.status)}</span>\` :
                                    \`<span class="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">\${getEventTypeLabel(item.entry_type)}</span>\`
                                }
                                \${isTask && item.priority ? 
                                    \`<span class="text-xs font-semibold text-gray-600">優先度: \${getPriorityLabel(item.priority)}</span>\` : ''
                                }
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');
        }

        // Render tasks content
        function renderTasksContent() {
            const container = document.getElementById('tasksList');
            const statusFilterEl = document.getElementById('taskStatusFilter');
            const priorityFilterEl = document.getElementById('taskPriorityFilter');
            
            if (!container) {
                console.error('tasksList container not found');
                return;
            }
            
            if (!statusFilterEl || !priorityFilterEl) {
                console.error('Task filter elements not found', {
                    statusFilter: !!statusFilterEl,
                    priorityFilter: !!priorityFilterEl
                });
                return;
            }
            
            const statusFilter = statusFilterEl.value;
            const priorityFilter = priorityFilterEl.value;
            
            let filteredTasks = tasks.filter(task => {
                if (statusFilter && task.status !== statusFilter) return false;
                if (priorityFilter && task.priority !== priorityFilter) return false;
                return true;
            });
            
            if (filteredTasks.length === 0) {
                container.innerHTML = '<p class="text-center text-gray-500 py-8">タスクがありません</p>';
                return;
            }
            
            container.innerHTML = filteredTasks.map(task => \`
                <div class="business-card bg-white rounded-lg p-4 border priority-\${task.priority || 'medium'}" onclick="editTask(\${task.id})">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-900 mb-2">\${task.title}</h4>
                            \${task.description ? \`<p class="text-gray-600 text-sm mb-2">\${task.description}</p>\` : ''}
                            <div class="flex items-center text-xs text-gray-500 space-x-4">
                                <span><i class="fas fa-building mr-1"></i>\${task.client_name || '未割当'}</span>
                                <span><i class="fas fa-user mr-1"></i>\${task.assignee_name || '未割当'}</span>
                                <span><i class="fas fa-calendar mr-1"></i>\${task.due_date ? dayjs(task.due_date).format('MM/DD') : '期限なし'}</span>
                            </div>
                        </div>
                        <div class="flex flex-col items-end space-y-1">
                            <span class="status-badge status-\${task.status}">\${getStatusLabel(task.status)}</span>
                            <span class="text-xs font-semibold text-gray-600">優先度: \${getPriorityLabel(task.priority)}</span>
                        </div>
                    </div>
                </div>
            \`).join('');
        }

        // Render schedule content
        function renderScheduleContent() {
            const container = document.getElementById('scheduleList');
            const typeFilterEl = document.getElementById('scheduleTypeFilter');
            
            if (!container) {
                console.error('scheduleList container not found');
                return;
            }
            
            if (!typeFilterEl) {
                console.error('scheduleTypeFilter element not found');
                return;
            }
            
            const typeFilter = typeFilterEl.value;
            
            let filteredEvents = scheduleEvents.filter(event => {
                if (typeFilter && event.entry_type !== typeFilter) return false;
                return true;
            });
            
            // Sort by start time
            filteredEvents.sort((a, b) => dayjs(a.start_time).diff(dayjs(b.start_time)));
            
            if (filteredEvents.length === 0) {
                container.innerHTML = '<p class="text-center text-gray-500 py-8">予定がありません</p>';
                return;
            }
            
            container.innerHTML = filteredEvents.map(event => \`
                <div class="business-card bg-white rounded-lg p-4 border" onclick="editSchedule(\${event.id})">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-900 mb-2">\${event.title}</h4>
                            \${event.description ? \`<p class="text-gray-600 text-sm mb-2">\${event.description}</p>\` : ''}
                            <div class="flex items-center text-xs text-gray-500 space-x-4">
                                <span><i class="fas fa-clock mr-1"></i>\${dayjs(event.start_time).format('MM/DD HH:mm')}\${event.end_time ? ' - ' + dayjs(event.end_time).format('HH:mm') : ''}</span>
                                \${event.client_name ? \`<span><i class="fas fa-building mr-1"></i>\${event.client_name}</span>\` : ''}
                                \${event.location ? \`<span><i class="fas fa-map-marker-alt mr-1"></i>\${event.location}</span>\` : ''}
                            </div>
                        </div>
                        <div>
                            <span class="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded">\${getEventTypeLabel(event.entry_type)}</span>
                        </div>
                    </div>
                </div>
            \`).join('');
        }

        // Render timeline content
        function renderTimelineContent() {
            const container = document.getElementById('timelineContent');
            const timelineRangeEl = document.getElementById('timelineRange');
            
            if (!container) {
                console.error('timelineContent container not found');
                return;
            }
            
            if (!timelineRangeEl) {
                console.error('timelineRange element not found');
                return;
            }
            
            const range = timelineRangeEl.value;
            
            let startDate, endDate;
            const today = dayjs();
            
            switch(range) {
                case 'today':
                    startDate = today.startOf('day');
                    endDate = today.endOf('day');
                    break;
                case 'week':
                    startDate = today.startOf('week');
                    endDate = today.endOf('week');
                    break;
                case 'month':
                    startDate = today.startOf('month');
                    endDate = today.endOf('month');
                    break;
            }
            
            // Combine tasks and events
            let timelineItems = [];
            
            // Add tasks
            tasks.filter(t => {
                if (t.due_date) {
                    const dueDate = dayjs(t.due_date);
                    return dueDate.isAfter(startDate) && dueDate.isBefore(endDate);
                }
                return false;
            }).forEach(task => {
                timelineItems.push({
                    ...task,
                    type: 'task',
                    datetime: dayjs(task.due_date)
                });
            });
            
            // Add events
            scheduleEvents.filter(e => {
                const eventDate = dayjs(e.start_time);
                return eventDate.isAfter(startDate) && eventDate.isBefore(endDate);
            }).forEach(event => {
                timelineItems.push({
                    ...event,
                    type: 'schedule',
                    datetime: dayjs(event.start_time)
                });
            });
            
            // Sort by datetime
            timelineItems.sort((a, b) => a.datetime.diff(b.datetime));
            
            if (timelineItems.length === 0) {
                container.innerHTML = '<p class="text-center text-gray-500 py-8">該当期間にアイテムがありません</p>';
                return;
            }
            
            // Group by date
            const groupedItems = {};
            timelineItems.forEach(item => {
                const dateKey = item.datetime.format('YYYY-MM-DD');
                if (!groupedItems[dateKey]) {
                    groupedItems[dateKey] = [];
                }
                groupedItems[dateKey].push(item);
            });
            
            container.innerHTML = Object.entries(groupedItems).map(([date, items]) => \`
                <div class="timeline-day">
                    <div class="flex items-center mb-4">
                        <div class="w-3 h-3 bg-blue-600 rounded-full mr-3"></div>
                        <h3 class="text-lg font-semibold text-gray-900">\${dayjs(date).format('MM月DD日 (ddd)')}</h3>
                    </div>
                    <div class="ml-6 border-l-2 border-gray-200 pl-4 space-y-3">
                        \${items.map(item => \`
                            <div class="flex items-center space-x-3">
                                <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
                                <div class="flex-1 flex items-center justify-between">
                                    <div>
                                        <span class="font-medium">\${item.datetime.format('HH:mm')}</span>
                                        <span class="ml-2">\${item.title}</span>
                                        <span class="ml-2 px-2 py-1 text-xs rounded \${item.type === 'task' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}">
                                            \${item.type === 'task' ? 'タスク' : '予定'}
                                        </span>
                                    </div>
                                    \${item.client_name ? \`<span class="text-xs text-gray-500">\${item.client_name}</span>\` : ''}
                                </div>
                            </div>
                        \`).join('')}
                    </div>
                </div>
            \`).join('');
        }

        // Helper functions
        function getStatusLabel(status) {
            const labels = {
                pending: '未着手',
                in_progress: '進行中',
                completed: '完了',
                cancelled: 'キャンセル'
            };
            return labels[status] || status;
        }

        function getPriorityLabel(priority) {
            const labels = {
                urgent: '緊急',
                high: '高',
                medium: '中',
                low: '低'
            };
            return labels[priority] || priority;
        }

        function getEventTypeLabel(type) {
            const labels = {
                meeting: '面談',
                visit: '訪問',
                deadline: '期限',
                other: 'その他'
            };
            return labels[type] || type;
        }

        // Navigation functions
        function previousMonth() {
            currentDate = currentDate.subtract(1, 'month');
            loadScheduleEvents().then(() => {
                renderMiniCalendar();
                if (currentTab === 'schedule' || currentTab === 'timeline') {
                    renderTabContent();
                }
            });
        }

        function nextMonth() {
            currentDate = currentDate.add(1, 'month');
            loadScheduleEvents().then(() => {
                renderMiniCalendar();
                if (currentTab === 'schedule' || currentTab === 'timeline') {
                    renderTabContent();
                }
            });
        }

        function selectCalendarDate(dateString) {
            const selectedDate = dayjs(dateString);
            const startTimeInput = document.querySelector('#createScheduleModal input[name="start_time"]');
            const endTimeInput = document.querySelector('#createScheduleModal input[name="end_time"]');
            
            if (startTimeInput) {
                startTimeInput.value = selectedDate.format('YYYY-MM-DDTHH:mm');
            }
            if (endTimeInput) {
                endTimeInput.value = selectedDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm');
            }
            openCreateScheduleModal();
        }

        // Filter functions
        function filterOverviewItems() {
            renderOverviewContent();
        }

        function filterTasks() {
            renderTasksContent();
        }

        function filterSchedule() {
            renderScheduleContent();
        }

        function filterTimeline() {
            renderTimelineContent();
        }

        // Modal functions
        function openCreateTaskModal() {
            const modal = document.getElementById('createTaskModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            } else {
                console.error('createTaskModal element not found');
            }
        }

        function closeCreateTaskModal() {
            const modal = document.getElementById('createTaskModal');
            const form = document.getElementById('createTaskForm');
            
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            } else {
                console.error('createTaskModal element not found');
            }
            
            if (form) {
                form.reset();
            } else {
                console.error('createTaskForm element not found');
            }
        }

        function openCreateScheduleModal() {
            const modal = document.getElementById('createScheduleModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            } else {
                console.error('createScheduleModal element not found');
            }
        }

        function closeCreateScheduleModal() {
            const modal = document.getElementById('createScheduleModal');
            const form = document.getElementById('createScheduleForm');
            
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            } else {
                console.error('createScheduleModal element not found');
            }
            
            if (form) {
                form.reset();
            } else {
                console.error('createScheduleForm element not found');
            }
        }

        // Navigation to other views
        function switchToCalendarView() {
            window.location.href = '/calendar';
        }

        function switchToClientView() {
            window.location.href = '/clients';
        }

        // Edit functions
        function editTask(taskId) {
            window.location.href = \`/tasks?edit=\${taskId}\`;
        }

        function editSchedule(scheduleId) {
            window.location.href = \`/calendar?edit=\${scheduleId}\`;
        }

        // Form submissions
        document.getElementById('createTaskForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const formData = new FormData(e.target);
                const taskData = Object.fromEntries(formData);
                
                await axios.post('/api/tasks', taskData);
                closeCreateTaskModal();
                await loadTasks();
                renderInterface();
                showToast('タスクを作成しました', 'success');
            } catch (error) {
                console.error('Failed to create task:', error);
                showToast('タスクの作成に失敗しました', 'error');
            }
        });

        document.getElementById('createScheduleForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const formData = new FormData(e.target);
                const scheduleData = Object.fromEntries(formData);
                
                await axios.post('/api/schedule', scheduleData);
                closeCreateScheduleModal();
                await loadScheduleEvents();
                renderInterface();
                showToast('予定を登録しました', 'success');
            } catch (error) {
                console.error('Failed to create schedule:', error);
                showToast('予定の登録に失敗しました', 'error');
            }
        });
    </script>
</body>
</html>
  `;
}
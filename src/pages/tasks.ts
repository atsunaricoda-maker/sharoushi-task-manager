export function getTasksPage(user: any) {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>タスク管理 - 社労士事務所タスク管理</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        .task-card {
            transition: all 0.3s ease;
        }
        .task-card:hover {
            transform: translateY(-2px);
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
        
        /* Kanban board styles */
        .kanban-card {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 12px;
            margin-bottom: 8px;
            cursor: grab;
            transition: all 0.3s ease;
        }
        
        .kanban-card:hover {
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
            transform: translateY(-2px);
        }
        
        .kanban-card.dragging {
            opacity: 0.5;
            cursor: grabbing;
        }
        
        .kanban-column {
            min-height: 400px;
            border: 2px dashed transparent;
        }
        
        .kanban-column.dragover {
            border-color: #3b82f6;
            background-color: rgba(59, 130, 246, 0.1);
        }
        
        .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
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
                        <i class="fas fa-tasks mr-2 text-blue-600"></i>
                        タスク管理
                    </h1>
                </div>
                <div class="flex items-center space-x-4">
                    <button onclick="openCreateModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>新規タスク
                    </button>
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
        <!-- View Toggle -->
        <div class="mb-4 flex justify-between items-center">
            <div class="flex space-x-2">
                <button id="listViewBtn" onclick="switchView('list')" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    <i class="fas fa-list mr-2"></i>リスト表示
                </button>
                <button id="kanbanViewBtn" onclick="switchView('kanban')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
                    <i class="fas fa-columns mr-2"></i>カンバン表示
                </button>
            </div>
            <button onclick="openCreateModal()" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                <i class="fas fa-plus mr-2"></i>新規タスク
            </button>
        </div>
        
        <!-- Filters -->
        <div class="bg-white rounded-lg shadow mb-6 p-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                    <select id="filterStatus" onchange="loadTasks()" class="w-full rounded-md border-gray-300">
                        <option value="">すべて</option>
                        <option value="pending">未着手</option>
                        <option value="in_progress">進行中</option>
                        <option value="completed">完了</option>
                        <option value="cancelled">キャンセル</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">優先度</label>
                    <select id="filterPriority" onchange="loadTasks()" class="w-full rounded-md border-gray-300">
                        <option value="">すべて</option>
                        <option value="urgent">緊急</option>
                        <option value="high">高</option>
                        <option value="medium">中</option>
                        <option value="low">低</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">顧客</label>
                    <select id="filterClient" onchange="loadTasks()" class="w-full rounded-md border-gray-300">
                        <option value="">すべて</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">担当者</label>
                    <select id="filterAssignee" onchange="loadTasks()" class="w-full rounded-md border-gray-300">
                        <option value="">すべて</option>
                    </select>
                </div>
            </div>
            
            <!-- Saved Filters -->
            <div class="mt-4 flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                    <button onclick="saveCurrentFilter()" class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                        <i class="fas fa-save mr-1"></i>フィルター保存
                    </button>
                    <button onclick="clearAllFilters()" class="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600">
                        <i class="fas fa-refresh mr-1"></i>クリア
                    </button>
                </div>
                <div class="flex items-center space-x-2">
                    <label class="text-sm font-medium text-gray-700">保存済み:</label>
                    <select id="savedFilters" onchange="applySavedFilter()" class="text-sm rounded-md border-gray-300">
                        <option value="">フィルターを選択</option>
                    </select>
                    <button onclick="deleteSavedFilter()" class="px-2 py-1 text-sm text-red-600 hover:text-red-800" title="選択中のフィルターを削除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Bulk Actions Bar -->
        <div id="bulkActionsBar" class="bg-white rounded-lg shadow-sm border p-4 mb-4 hidden">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <span id="selectedCount" class="text-sm font-medium text-gray-700">0件選択中</span>
                    <button onclick="selectAll()" class="text-sm text-blue-600 hover:text-blue-800">すべて選択</button>
                    <button onclick="clearSelection()" class="text-sm text-gray-600 hover:text-gray-800">選択解除</button>
                </div>
                <div class="flex items-center space-x-2">
                    <select id="bulkStatus" class="text-sm rounded-md border-gray-300">
                        <option value="">ステータス変更</option>
                        <option value="pending">未着手</option>
                        <option value="in_progress">進行中</option>
                        <option value="completed">完了</option>
                    </select>
                    <button onclick="applyBulkStatusChange()" class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                        適用
                    </button>
                    <select id="bulkAssignee" class="text-sm rounded-md border-gray-300">
                        <option value="">担当者変更</option>
                    </select>
                    <button onclick="applyBulkAssigneeChange()" class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">
                        適用
                    </button>
                    <button onclick="bulkDelete()" class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700">
                        削除
                    </button>
                </div>
            </div>
        </div>

        <!-- Task List -->
        <div id="taskList" class="space-y-4">
            <!-- Tasks will be loaded here -->
        </div>

        <!-- Kanban Board -->
        <div id="kanbanBoard" class="hidden">
            <div class="grid grid-cols-3 gap-6">
                <div class="bg-gray-50 rounded-lg p-4">
                    <h3 class="font-semibold text-gray-700 mb-4 flex items-center">
                        <i class="fas fa-clock mr-2 text-gray-600"></i>未着手
                    </h3>
                    <div id="pendingColumn" class="space-y-3 min-h-[400px]" 
                         ondrop="drop(event, 'pending')" 
                         ondragover="allowDrop(event)">
                        <!-- Pending tasks -->
                    </div>
                </div>
                <div class="bg-blue-50 rounded-lg p-4">
                    <h3 class="font-semibold text-blue-700 mb-4 flex items-center">
                        <i class="fas fa-play mr-2 text-blue-600"></i>進行中
                    </h3>
                    <div id="in_progressColumn" class="space-y-3 min-h-[400px]" 
                         ondrop="drop(event, 'in_progress')" 
                         ondragover="allowDrop(event)">
                        <!-- In progress tasks -->
                    </div>
                </div>
                <div class="bg-green-50 rounded-lg p-4">
                    <h3 class="font-semibold text-green-700 mb-4 flex items-center">
                        <i class="fas fa-check mr-2 text-green-600"></i>完了
                    </h3>
                    <div id="completedColumn" class="space-y-3 min-h-[400px]" 
                         ondrop="drop(event, 'completed')" 
                         ondragover="allowDrop(event)">
                        <!-- Completed tasks -->
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Task Detail Modal -->
    <div id="taskDetailModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                <h2 class="text-xl font-semibold">タスク詳細</h2>
                <button onclick="closeDetailModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div id="taskDetailContent" class="p-6">
                <!-- Task details will be loaded here -->
            </div>
        </div>
    </div>

    <!-- Create Task Modal -->
    <div id="createTaskModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
        <div class="bg-white rounded-lg max-w-2xl w-full mx-4">
            <div class="border-b px-6 py-4 flex justify-between items-center">
                <h2 class="text-xl font-semibold">新規タスク作成</h2>
                <button onclick="closeCreateModal()" class="text-gray-500 hover:text-gray-700">
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
                        <label class="block text-sm font-medium text-gray-700 mb-1">担当者</label>
                        <select name="assignee_id" class="w-full rounded-md border-gray-300">
                            <option value="">選択してください</option>
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">優先度</label>
                        <select name="priority" class="w-full rounded-md border-gray-300">
                            <option value="low">低</option>
                            <option value="medium" selected>中</option>
                            <option value="high">高</option>
                            <option value="urgent">緊急</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">期限</label>
                        <input type="date" name="due_date" class="w-full rounded-md border-gray-300">
                    </div>
                </div>
                <div class="flex justify-end space-x-3 pt-4">
                    <button type="button" onclick="closeCreateModal()" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
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
        let currentTask = null;
        let allTasks = [];

        async function init() {
            await loadTasks();
            await loadClients();
            await loadUsers();
            loadSavedFilters(); // Load saved filter presets
            
            // Check if we need to show task detail from dashboard navigation
            const viewTaskDetailId = sessionStorage.getItem('viewTaskDetailId');
            if (viewTaskDetailId) {
                sessionStorage.removeItem('viewTaskDetailId');
                // Wait a bit for the page to fully load, then show detail
                setTimeout(() => {
                    showTaskDetail(parseInt(viewTaskDetailId));
                }, 500);
            }
            
            // Keep existing edit task functionality
            const editTaskId = sessionStorage.getItem('editTaskId');
            if (editTaskId) {
                sessionStorage.removeItem('editTaskId');
                // Wait a bit for the page to fully load, then show detail for editing
                setTimeout(() => {
                    showTaskDetail(parseInt(editTaskId));
                }, 500);
            }
        }

        async function loadTasks() {
            try {
                const params = new URLSearchParams();
                const status = document.getElementById('filterStatus').value;
                const priority = document.getElementById('filterPriority').value;
                const clientId = document.getElementById('filterClient').value;
                const assigneeId = document.getElementById('filterAssignee').value;

                if (status) params.append('status', status);
                if (priority) params.append('priority', priority);
                if (clientId) params.append('client_id', clientId);
                if (assigneeId) params.append('assignee_id', assigneeId);

                const response = await axios.get(\`/api/tasks?\${params.toString()}\`);
                allTasks = response.data.tasks || response.data;
                displayTasks(allTasks);
            } catch (error) {
                console.error('Failed to load tasks:', error);
            }
        }

        function displayTasks(tasks) {
            if (currentView === 'kanban') {
                displayKanbanTasks(tasks);
                return;
            }

            const taskList = document.getElementById('taskList');
            
            if (!tasks || tasks.length === 0) {
                taskList.innerHTML = '<div class="bg-white rounded-lg shadow p-8 text-center text-gray-500">タスクがありません</div>';
                return;
            }

            const statusLabels = {
                pending: '未着手',
                in_progress: '進行中',
                completed: '完了',
                cancelled: 'キャンセル'
            };

            const priorityLabels = {
                urgent: '緊急',
                high: '高',
                medium: '中',
                low: '低'
            };

            taskList.innerHTML = tasks.map(task => \`
                <div class="task-card bg-white rounded-lg shadow p-4 priority-\${task.priority || 'medium'} relative">
                    <div class="flex items-start space-x-3">
                        <div class="flex items-center pt-1">
                            <input type="checkbox" class="task-checkbox w-4 h-4 text-blue-600 rounded" 
                                   data-task-id="\${task.id}" onchange="updateBulkSelection()" 
                                   onclick="event.stopPropagation()">
                        </div>
                        <div class="flex-1 cursor-pointer" onclick="showTaskDetail(\${task.id})">
                            <div class="flex justify-between items-start">
                                <div class="flex-1 pr-4">
                                    <h3 class="font-semibold text-lg text-gray-900">\${task.title}</h3>
                                    \${task.description ? \`<p class="text-gray-600 mt-1">\${task.description}</p>\` : ''}
                                    <div class="flex items-center mt-3 text-sm text-gray-500 space-x-4">
                                        <span><i class="fas fa-building mr-1"></i>\${task.client_name || '未割当'}</span>
                                        <span><i class="fas fa-user mr-1"></i>\${task.assignee_name || '未割当'}</span>
                                        <span><i class="fas fa-calendar mr-1"></i>\${task.due_date ? new Date(task.due_date).toLocaleDateString('ja-JP') : '期限なし'}</span>
                                    </div>
                                </div>
                                <div class="flex flex-col items-end space-y-2">
                                    <span class="status-badge status-\${task.status}">\${statusLabels[task.status] || task.status}</span>
                                    <span class="text-xs font-semibold text-gray-600">優先度: \${priorityLabels[task.priority] || task.priority}</span>
                                    <div class="flex space-x-1 mt-2">
                                        <button onclick="event.stopPropagation(); copyTask(\${task.id})" class="text-green-600 hover:text-green-800 text-sm p-1 rounded" title="コピー">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            \`).join('');
        }

        async function showTaskDetail(taskId) {
            try {
                const response = await axios.get(\`/api/tasks/\${taskId}\`);
                currentTask = response.data;
                
                const statusLabels = {
                    pending: '未着手',
                    in_progress: '進行中',
                    completed: '完了',
                    cancelled: 'キャンセル'
                };

                const priorityLabels = {
                    urgent: '緊急',
                    high: '高',
                    medium: '中',
                    low: '低'
                };

                const detailContent = document.getElementById('taskDetailContent');
                detailContent.innerHTML = \`
                    <div class="space-y-4">
                        <div>
                            <h3 class="text-2xl font-bold text-gray-900">\${currentTask.title}</h3>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">ステータス</label>
                                <select id="taskStatus" class="mt-1 w-full rounded-md border-gray-300">
                                    <option value="pending" \${currentTask.status === 'pending' ? 'selected' : ''}>未着手</option>
                                    <option value="in_progress" \${currentTask.status === 'in_progress' ? 'selected' : ''}>進行中</option>
                                    <option value="completed" \${currentTask.status === 'completed' ? 'selected' : ''}>完了</option>
                                    <option value="cancelled" \${currentTask.status === 'cancelled' ? 'selected' : ''}>キャンセル</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">進捗 (%)</label>
                                <input type="number" id="taskProgress" min="0" max="100" value="\${currentTask.progress || 0}" 
                                       class="mt-1 w-full rounded-md border-gray-300">
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">説明</label>
                            <p class="mt-1 text-gray-900">\${currentTask.description || '説明なし'}</p>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">顧客</label>
                                <p class="mt-1">\${currentTask.client_name || '未割当'}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">担当者</label>
                                <p class="mt-1">\${currentTask.assignee_name || '未割当'}</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">優先度</label>
                                <p class="mt-1">\${priorityLabels[currentTask.priority] || currentTask.priority}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">期限</label>
                                <p class="mt-1">\${currentTask.due_date ? new Date(currentTask.due_date).toLocaleDateString('ja-JP') : '期限なし'}</p>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">実績工数 (時間)</label>
                            <input type="number" id="taskActualHours" step="0.5" min="0" value="\${currentTask.actual_hours || 0}" 
                                   class="mt-1 w-full rounded-md border-gray-300">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700">メモ</label>
                            <textarea id="taskNotes" rows="3" class="mt-1 w-full rounded-md border-gray-300">\${currentTask.notes || ''}</textarea>
                        </div>

                        <!-- Comments Section -->
                        <div class="border-t pt-4">
                            <div class="flex justify-between items-center mb-3">
                                <h4 class="text-lg font-medium text-gray-900">コメント</h4>
                                <span class="text-sm text-gray-500" id="commentCount">0件</span>
                            </div>
                            
                            <!-- Add Comment Form -->
                            <div class="mb-4">
                                <textarea id="newCommentText" rows="2" placeholder="コメントを入力..." 
                                         class="w-full rounded-md border-gray-300 text-sm"></textarea>
                                <div class="flex justify-end mt-2">
                                    <button onclick="addComment(\${currentTask.id})" class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                                        <i class="fas fa-paper-plane mr-1"></i>投稿
                                    </button>
                                </div>
                            </div>
                            
                            <!-- Comments List -->
                            <div id="commentsList" class="space-y-3 max-h-60 overflow-y-auto">
                                <!-- Comments will be loaded here -->
                            </div>
                        </div>

                        <div class="flex justify-between pt-4">
                            <div class="space-x-3">
                                <button onclick="copyTask(\${currentTask.id})" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                                    <i class="fas fa-copy mr-2"></i>コピー
                                </button>
                                <button onclick="deleteTask(\${currentTask.id})" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                                    <i class="fas fa-trash mr-2"></i>削除
                                </button>
                            </div>
                            <div class="space-x-3">
                                <button onclick="closeDetailModal()" class="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                                    キャンセル
                                </button>
                                <button onclick="updateTask()" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                    <i class="fas fa-save mr-2"></i>保存
                                </button>
                            </div>
                        </div>
                    </div>
                \`;

                document.getElementById('taskDetailModal').classList.remove('hidden');
                document.getElementById('taskDetailModal').classList.add('flex');
                
                // Load comments for this task
                loadTaskComments(currentTask.id);
            } catch (error) {
                console.error('Failed to load task detail:', error);
                alert('タスクの詳細を取得できませんでした');
            }
        }

        async function updateTask() {
            if (!currentTask) return;

            try {
                const updateData = {
                    status: document.getElementById('taskStatus').value,
                    progress: parseInt(document.getElementById('taskProgress').value) || 0,
                    actual_hours: parseFloat(document.getElementById('taskActualHours').value) || 0,
                    notes: document.getElementById('taskNotes').value
                };

                await axios.put(\`/api/tasks/\${currentTask.id}\`, updateData);
                closeDetailModal();
                await loadTasks();
                alert('タスクを更新しました');
            } catch (error) {
                console.error('Failed to update task:', error);
                alert('タスクの更新に失敗しました');
            }
        }

        async function deleteTask(taskId) {
            if (!confirm('このタスクを削除してもよろしいですか？')) return;

            try {
                await axios.delete(\`/api/tasks/\${taskId}\`);
                closeDetailModal();
                await loadTasks();
                alert('タスクを削除しました');
            } catch (error) {
                console.error('Failed to delete task:', error);
                alert('タスクの削除に失敗しました');
            }
        }

        function closeDetailModal() {
            document.getElementById('taskDetailModal').classList.add('hidden');
            document.getElementById('taskDetailModal').classList.remove('flex');
            currentTask = null;
        }

        function openCreateModal() {
            document.getElementById('createTaskModal').classList.remove('hidden');
            document.getElementById('createTaskModal').classList.add('flex');
        }

        function closeCreateModal() {
            document.getElementById('createTaskModal').classList.add('hidden');
            document.getElementById('createTaskModal').classList.remove('flex');
            document.getElementById('createTaskForm').reset();
        }

        async function loadClients() {
            try {
                const response = await axios.get('/api/clients');
                const clients = response.data.clients || response.data;
                
                const selects = document.querySelectorAll('select[name="client_id"], #filterClient');
                selects.forEach(select => {
                    const currentValue = select.value;
                    const defaultOption = select.id === 'filterClient' ? '<option value="">すべて</option>' : '<option value="">選択してください</option>';
                    select.innerHTML = defaultOption + clients.map(c => \`<option value="\${c.id}">\${c.name || c.company_name}</option>\`).join('');
                    if (currentValue) select.value = currentValue;
                });
            } catch (error) {
                console.error('Failed to load clients:', error);
            }
        }

        async function loadUsers() {
            try {
                const response = await axios.get('/api/users');
                const users = response.data.users || response.data;
                
                const selects = document.querySelectorAll('select[name="assignee_id"], #filterAssignee, #bulkAssignee');
                selects.forEach(select => {
                    const currentValue = select.value;
                    let defaultOption = '<option value="">選択してください</option>';
                    if (select.id === 'filterAssignee') defaultOption = '<option value="">すべて</option>';
                    if (select.id === 'bulkAssignee') defaultOption = '<option value="">担当者変更</option>';
                    select.innerHTML = defaultOption + users.map(u => \`<option value="\${u.id}">\${u.name}</option>\`).join('');
                    if (currentValue) select.value = currentValue;
                });
            } catch (error) {
                console.error('Failed to load users:', error);
            }
        }

        // Bulk Actions Functions
        let selectedTasks = [];

        function updateBulkSelection() {
            const checkboxes = document.querySelectorAll('.task-checkbox:checked');
            selectedTasks = Array.from(checkboxes).map(cb => cb.dataset.taskId);
            
            const count = selectedTasks.length;
            const bulkActionsBar = document.getElementById('bulkActionsBar');
            const selectedCountElement = document.getElementById('selectedCount');
            
            selectedCountElement.textContent = count + '件選択中';
            
            if (count > 0) {
                bulkActionsBar.classList.remove('hidden');
            } else {
                bulkActionsBar.classList.add('hidden');
            }
        }

        function selectAll() {
            const checkboxes = document.querySelectorAll('.task-checkbox');
            checkboxes.forEach(cb => cb.checked = true);
            updateBulkSelection();
        }

        function clearSelection() {
            const checkboxes = document.querySelectorAll('.task-checkbox');
            checkboxes.forEach(cb => cb.checked = false);
            updateBulkSelection();
        }

        async function applyBulkStatusChange() {
            const newStatus = document.getElementById('bulkStatus').value;
            if (!newStatus || selectedTasks.length === 0) return;

            if (!confirm(\`選択した\${selectedTasks.length}個のタスクのステータスを「\${newStatus}」に変更しますか？\`)) return;

            try {
                await axios.patch('/api/tasks/bulk', {
                    task_ids: selectedTasks,
                    updates: { status: newStatus }
                });
                
                clearSelection();
                await loadTasks();
                alert('ステータスを一括更新しました');
            } catch (error) {
                console.error('Failed to bulk update status:', error);
                alert('ステータスの一括更新に失敗しました');
            }
        }

        async function applyBulkAssigneeChange() {
            const newAssigneeId = document.getElementById('bulkAssignee').value;
            if (!newAssigneeId || selectedTasks.length === 0) return;

            if (!confirm(\`選択した\${selectedTasks.length}個のタスクの担当者を変更しますか？\`)) return;

            try {
                await axios.patch('/api/tasks/bulk', {
                    task_ids: selectedTasks,
                    updates: { assignee_id: newAssigneeId }
                });
                
                clearSelection();
                await loadTasks();
                alert('担当者を一括更新しました');
            } catch (error) {
                console.error('Failed to bulk update assignee:', error);
                alert('担当者の一括更新に失敗しました');
            }
        }

        async function bulkDelete() {
            if (selectedTasks.length === 0) return;

            if (!confirm(\`選択した\${selectedTasks.length}個のタスクを削除しますか？この操作は取り消せません。\`)) return;

            try {
                await axios.delete('/api/tasks/bulk', {
                    data: { task_ids: selectedTasks }
                });
                
                clearSelection();
                await loadTasks();
                alert('タスクを一括削除しました');
            } catch (error) {
                console.error('Failed to bulk delete tasks:', error);
                alert('タスクの一括削除に失敗しました');
            }
        }

        // Task Copy Function
        async function copyTask(taskId) {
            try {
                const response = await axios.get(\`/api/tasks/\${taskId}\`);
                const originalTask = response.data;
                
                // Create new task with similar data but modified title
                const newTaskData = {
                    title: \`【コピー】\${originalTask.title}\`,
                    description: originalTask.description || '',
                    client_id: originalTask.client_id || '',
                    assignee_id: originalTask.assignee_id || '',
                    priority: originalTask.priority || 'medium',
                    due_date: '', // Clear due date for new task
                    status: 'pending' // Reset status to pending
                };

                await axios.post('/api/tasks', newTaskData);
                closeDetailModal();
                await loadTasks();
                alert('タスクをコピーしました');
            } catch (error) {
                console.error('Failed to copy task:', error);
                alert('タスクのコピーに失敗しました');
            }
        }

        // Filter Save/Load Functions
        function saveCurrentFilter() {
            const filterName = prompt('フィルター名を入力してください:');
            if (!filterName) return;

            const currentFilter = {
                name: filterName,
                status: document.getElementById('filterStatus').value,
                priority: document.getElementById('filterPriority').value,
                client_id: document.getElementById('filterClient').value,
                assignee_id: document.getElementById('filterAssignee').value
            };

            let savedFilters = JSON.parse(localStorage.getItem('taskFilters') || '[]');
            
            // Check if filter name already exists
            const existingIndex = savedFilters.findIndex(f => f.name === filterName);
            if (existingIndex >= 0) {
                if (!confirm(\`フィルター「\${filterName}」は既に存在します。上書きしますか？\`)) {
                    return;
                }
                savedFilters[existingIndex] = currentFilter;
            } else {
                savedFilters.push(currentFilter);
            }

            localStorage.setItem('taskFilters', JSON.stringify(savedFilters));
            loadSavedFilters();
            alert(\`フィルター「\${filterName}」を保存しました\`);
        }

        function loadSavedFilters() {
            const savedFilters = JSON.parse(localStorage.getItem('taskFilters') || '[]');
            const select = document.getElementById('savedFilters');
            
            select.innerHTML = '<option value="">フィルターを選択</option>' + 
                savedFilters.map(filter => \`<option value="\${filter.name}">\${filter.name}</option>\`).join('');
        }

        function applySavedFilter() {
            const filterName = document.getElementById('savedFilters').value;
            if (!filterName) return;

            const savedFilters = JSON.parse(localStorage.getItem('taskFilters') || '[]');
            const filter = savedFilters.find(f => f.name === filterName);
            
            if (filter) {
                document.getElementById('filterStatus').value = filter.status || '';
                document.getElementById('filterPriority').value = filter.priority || '';
                document.getElementById('filterClient').value = filter.client_id || '';
                document.getElementById('filterAssignee').value = filter.assignee_id || '';
                
                loadTasks(); // Apply the filter
            }
        }

        function clearAllFilters() {
            document.getElementById('filterStatus').value = '';
            document.getElementById('filterPriority').value = '';
            document.getElementById('filterClient').value = '';
            document.getElementById('filterAssignee').value = '';
            document.getElementById('savedFilters').value = '';
            
            loadTasks(); // Reload without filters
        }

        function deleteSavedFilter() {
            const filterName = document.getElementById('savedFilters').value;
            if (!filterName) return;

            if (!confirm(\`フィルター「\${filterName}」を削除しますか？\`)) return;

            let savedFilters = JSON.parse(localStorage.getItem('taskFilters') || '[]');
            savedFilters = savedFilters.filter(f => f.name !== filterName);
            
            localStorage.setItem('taskFilters', JSON.stringify(savedFilters));
            loadSavedFilters();
            alert(\`フィルター「\${filterName}」を削除しました\`);
        }

        // Kanban Board Functions
        let currentView = 'list';

        function switchView(view) {
            currentView = view;
            const listBtn = document.getElementById('listViewBtn');
            const kanbanBtn = document.getElementById('kanbanViewBtn');
            const taskList = document.getElementById('taskList');
            const kanbanBoard = document.getElementById('kanbanBoard');
            const bulkActionsBar = document.getElementById('bulkActionsBar');

            if (view === 'kanban') {
                // Switch to kanban view
                listBtn.className = 'px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50';
                kanbanBtn.className = 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700';
                taskList.classList.add('hidden');
                kanbanBoard.classList.remove('hidden');
                bulkActionsBar.classList.add('hidden'); // Hide bulk actions in kanban view
                displayKanbanTasks(allTasks);
            } else {
                // Switch to list view
                listBtn.className = 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700';
                kanbanBtn.className = 'px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50';
                taskList.classList.remove('hidden');
                kanbanBoard.classList.add('hidden');
                displayTasks(allTasks);
            }
        }

        function displayKanbanTasks(tasks) {
            const statusColumns = {
                pending: document.getElementById('pendingColumn'),
                in_progress: document.getElementById('in_progressColumn'), 
                completed: document.getElementById('completedColumn')
            };

            // Clear all columns
            Object.values(statusColumns).forEach(column => {
                column.innerHTML = '';
            });

            const priorityLabels = {
                urgent: '緊急',
                high: '高',
                medium: '中',
                low: '低'
            };

            tasks.forEach(task => {
                const column = statusColumns[task.status];
                if (column) {
                    const taskCard = document.createElement('div');
                    taskCard.className = \`kanban-card priority-\${task.priority || 'medium'}\`;
                    taskCard.draggable = true;
                    taskCard.dataset.taskId = task.id;
                    taskCard.ondragstart = (e) => drag(e);
                    taskCard.onclick = () => showTaskDetail(task.id);

                    taskCard.innerHTML = \`
                        <div class="mb-2">
                            <h4 class="font-medium text-sm text-gray-900 line-clamp-2">\${task.title}</h4>
                            \${task.description ? \`<p class="text-xs text-gray-600 mt-1 line-clamp-2">\${task.description}</p>\` : ''}
                        </div>
                        <div class="flex justify-between items-center text-xs">
                            <span class="text-gray-500">
                                <i class="fas fa-user mr-1"></i>\${task.assignee_name || '未割当'}
                            </span>
                            <span class="px-2 py-1 rounded text-xs font-medium priority-\${task.priority}">
                                \${priorityLabels[task.priority] || task.priority}
                            </span>
                        </div>
                        \${task.due_date ? \`
                            <div class="mt-2 text-xs text-gray-500">
                                <i class="fas fa-calendar mr-1"></i>\${new Date(task.due_date).toLocaleDateString('ja-JP')}
                            </div>
                        \` : ''}
                    \`;

                    column.appendChild(taskCard);
                }
            });
        }

        // Drag and Drop Functions
        function allowDrop(ev) {
            ev.preventDefault();
            ev.currentTarget.classList.add('dragover');
        }

        function drag(ev) {
            ev.dataTransfer.setData("text", ev.target.dataset.taskId);
            ev.target.classList.add('dragging');
        }

        async function drop(ev, newStatus) {
            ev.preventDefault();
            ev.currentTarget.classList.remove('dragover');
            
            const taskId = ev.dataTransfer.getData("text");
            const draggedElement = document.querySelector(\`[data-task-id="\${taskId}"]\`);
            
            if (draggedElement) {
                draggedElement.classList.remove('dragging');
                
                try {
                    await axios.put(\`/api/tasks/\${taskId}\`, { 
                        status: newStatus,
                        progress: newStatus === 'completed' ? 100 : newStatus === 'in_progress' ? 50 : 0
                    });
                    
                    await loadTasks(); // Refresh the data
                } catch (error) {
                    console.error('Failed to update task status:', error);
                    alert('タスクの更新に失敗しました');
                }
            }
        }

        // Handle drag leave to remove dragover styling
        document.addEventListener('dragleave', (e) => {
            if (e.target.classList.contains('kanban-column')) {
                e.target.classList.remove('dragover');
            }
        });

        // Comments Functions - Database powered
        async function loadTaskComments(taskId) {
            try {
                const response = await axios.get(\`/api/tasks/\${taskId}/comments\`);
                const comments = response.data.comments || [];
                const commentsList = document.getElementById('commentsList');
                const commentCount = document.getElementById('commentCount');
                
                if (!commentsList || !commentCount) return;
                
                commentCount.textContent = comments.length + '件';
                
                if (comments.length === 0) {
                    commentsList.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">まだコメントがありません</p>';
                    return;
                }
                
                commentsList.innerHTML = comments.map(comment => \`
                    <div class="bg-gray-50 rounded-lg p-3">
                        <div class="flex justify-between items-start mb-2">
                            <span class="font-medium text-sm text-gray-900">\${comment.user_name || 'ユーザー'}</span>
                            <span class="text-xs text-gray-500">\${formatCommentDate(comment.created_at)}</span>
                        </div>
                        <p class="text-sm text-gray-700">\${comment.comment_text}</p>
                        <div class="flex justify-end mt-2">
                            <button onclick="deleteComment(\${comment.id})" class="text-xs text-red-500 hover:text-red-700">
                                <i class="fas fa-trash mr-1"></i>削除
                            </button>
                        </div>
                    </div>
                \`).join('');
            } catch (error) {
                console.error('Failed to load comments:', error);
                const commentsList = document.getElementById('commentsList');
                if (commentsList) {
                    commentsList.innerHTML = '<p class="text-red-500 text-sm text-center py-4">コメントの読み込みに失敗しました</p>';
                }
            }
        }

        async function addComment(taskId) {
            const commentText = document.getElementById('newCommentText').value.trim();
            if (!commentText) {
                alert('コメントを入力してください');
                return;
            }

            try {
                await axios.post(\`/api/tasks/\${taskId}/comments\`, {
                    comment_text: commentText
                });
                
                document.getElementById('newCommentText').value = '';
                await loadTaskComments(taskId);
                
                // Show success message
                const button = document.querySelector(\`button[onclick="addComment(\${taskId})"]\`);
                const originalText = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check mr-1"></i>投稿済み';
                button.disabled = true;
                
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                }, 2000);
            } catch (error) {
                console.error('Failed to add comment:', error);
                alert('コメントの投稿に失敗しました');
            }
        }

        async function deleteComment(commentId) {
            if (!confirm('このコメントを削除しますか？')) return;

            try {
                if (!currentTask) {
                    alert('タスクが選択されていません');
                    return;
                }
                
                await axios.delete(\`/api/tasks/\${currentTask.id}/comments/\${commentId}\`);
                
                // Reload comments for current task
                await loadTaskComments(currentTask.id);
            } catch (error) {
                console.error('Failed to delete comment:', error);
                alert('コメントの削除に失敗しました');
            }
        }

        function formatCommentDate(dateString) {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'たった今';
            if (diffMins < 60) return \`\${diffMins}分前\`;
            if (diffHours < 24) return \`\${diffHours}時間前\`;
            if (diffDays < 7) return \`\${diffDays}日前\`;
            
            return date.toLocaleDateString('ja-JP');
        }

        document.getElementById('createTaskForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const formData = new FormData(e.target);
                const taskData = Object.fromEntries(formData);
                
                await axios.post('/api/tasks', taskData);
                closeCreateModal();
                await loadTasks();
                alert('タスクを作成しました');
            } catch (error) {
                console.error('Failed to create task:', error);
                alert('タスクの作成に失敗しました');
            }
        });

        // Initialize on page load
        document.addEventListener('DOMContentLoaded', init);
    </script>
</body>
</html>
  `;
}
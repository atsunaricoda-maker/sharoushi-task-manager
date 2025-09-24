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

                        <div class="flex justify-between pt-4">
                            <button onclick="deleteTask(\${currentTask.id})" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                                <i class="fas fa-trash mr-2"></i>削除
                            </button>
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
                await Promise.all(selectedTasks.map(taskId => 
                    axios.put(\`/api/tasks/\${taskId}\`, { status: newStatus })
                ));
                
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
                await Promise.all(selectedTasks.map(taskId => 
                    axios.put(\`/api/tasks/\${taskId}\`, { assignee_id: newAssigneeId })
                ));
                
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
                await Promise.all(selectedTasks.map(taskId => 
                    axios.delete(\`/api/tasks/\${taskId}\`)
                ));
                
                clearSelection();
                await loadTasks();
                alert('タスクを一括削除しました');
            } catch (error) {
                console.error('Failed to bulk delete tasks:', error);
                alert('タスクの一括削除に失敗しました');
            }
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
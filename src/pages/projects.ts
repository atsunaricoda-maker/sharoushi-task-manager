/**
 * Projects Page
 * プロジェクト管理画面
 */

export function getProjectsPage(userName: string): string {
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>プロジェクト管理 - 労務管理タスクシステム</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
                            <a href="/projects" class="border-b-2 border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                <i class="fas fa-project-diagram mr-1"></i> プロジェクト
                            </a>
                            <a href="/clients" class="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                <i class="fas fa-building mr-1"></i> 顧客管理
                            </a>
                            <a href="/reports" class="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                <i class="fas fa-file-alt mr-1"></i> レポート
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
            <!-- ヘッダーセクション -->
            <div class="mb-8">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-900">プロジェクト管理</h2>
                    <div class="flex space-x-3">
                        <button onclick="showAIGeneratorModal()" class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                            <i class="fas fa-magic mr-2"></i>AI生成
                        </button>
                        <button onclick="showNewProjectModal()" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            <i class="fas fa-plus mr-2"></i>新規プロジェクト
                        </button>
                    </div>
                </div>
            </div>

            <!-- フィルターセクション -->
            <div class="bg-white rounded-lg shadow mb-6 p-4">
                <div class="flex items-center space-x-4">
                    <select id="statusFilter" onchange="filterProjects()" class="rounded-md border-gray-300 shadow-sm">
                        <option value="">すべてのステータス</option>
                        <option value="planning">計画中</option>
                        <option value="active">進行中</option>
                        <option value="on_hold">保留</option>
                        <option value="completed">完了</option>
                    </select>
                    <select id="clientFilter" onchange="filterProjects()" class="rounded-md border-gray-300 shadow-sm">
                        <option value="">すべての顧客</option>
                    </select>
                    <div class="ml-auto flex items-center space-x-2">
                        <span class="text-sm text-gray-600">表示:</span>
                        <button onclick="setView('grid')" class="view-btn p-2" data-view="grid">
                            <i class="fas fa-th"></i>
                        </button>
                        <button onclick="setView('list')" class="view-btn p-2" data-view="list">
                            <i class="fas fa-list"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- プロジェクト一覧 -->
            <div id="projectsContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- プロジェクトカードがここに表示されます -->
            </div>
        </div>

        <!-- AI生成モーダル -->
        <div id="aiGeneratorModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
                <h3 class="text-lg font-medium text-gray-900 mb-4">
                    <i class="fas fa-magic mr-2"></i>AIプロジェクト生成
                </h3>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">生成方法を選択</label>
                    <div class="flex space-x-4">
                        <button onclick="setGenerationType('prompt')" class="gen-type-btn active" data-type="prompt">
                            <i class="fas fa-keyboard mr-2"></i>プロンプト入力
                        </button>
                        <button onclick="setGenerationType('category')" class="gen-type-btn" data-type="category">
                            <i class="fas fa-th-list mr-2"></i>カテゴリ選択
                        </button>
                        <button onclick="setGenerationType('seasonal')" class="gen-type-btn" data-type="seasonal">
                            <i class="fas fa-calendar mr-2"></i>季節業務
                        </button>
                    </div>
                </div>

                <!-- プロンプト入力 -->
                <div id="promptSection" class="generation-section">
                    <form onsubmit="generateProjectFromPrompt(event)">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700">プロンプト</label>
                            <textarea id="projectPrompt" rows="4" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                                placeholder="例: A社の給与計算と社会保険手続きを3ヶ月で完了させるプロジェクトを作成してください。従業員数は50名です。"></textarea>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">顧客</label>
                                <select id="aiClientSelect" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                    <option value="">選択してください</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">期限</label>
                                <input type="date" id="aiDeadline" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                            </div>
                        </div>
                        
                        <button type="submit" class="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                            <i class="fas fa-magic mr-2"></i>プロジェクトを生成
                        </button>
                    </form>
                </div>

                <!-- カテゴリ選択 -->
                <div id="categorySection" class="generation-section hidden">
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <button onclick="generateCategoryProject('payroll')" class="p-4 border rounded-lg hover:bg-gray-50">
                            <i class="fas fa-money-check-alt text-2xl text-blue-600 mb-2"></i>
                            <div class="font-medium">給与計算</div>
                        </button>
                        <button onclick="generateCategoryProject('insurance')" class="p-4 border rounded-lg hover:bg-gray-50">
                            <i class="fas fa-shield-alt text-2xl text-green-600 mb-2"></i>
                            <div class="font-medium">社会保険</div>
                        </button>
                        <button onclick="generateCategoryProject('labor')" class="p-4 border rounded-lg hover:bg-gray-50">
                            <i class="fas fa-hard-hat text-2xl text-orange-600 mb-2"></i>
                            <div class="font-medium">労働保険</div>
                        </button>
                        <button onclick="generateCategoryProject('hr')" class="p-4 border rounded-lg hover:bg-gray-50">
                            <i class="fas fa-users text-2xl text-purple-600 mb-2"></i>
                            <div class="font-medium">人事制度</div>
                        </button>
                    </div>
                </div>

                <!-- 季節業務 -->
                <div id="seasonalSection" class="generation-section hidden">
                    <div class="grid grid-cols-3 gap-3">
                        ${[1,2,3,4,5,6,7,8,9,10,11,12].map(month => `
                            <button onclick="generateSeasonalTasks(${month})" class="p-3 border rounded-lg hover:bg-gray-50">
                                <div class="font-medium">${month}月</div>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="mt-4 flex justify-end space-x-3">
                    <button onclick="closeAIGeneratorModal()" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                        キャンセル
                    </button>
                </div>
            </div>
        </div>

        <!-- プロジェクト詳細モーダル -->
        <div id="projectDetailModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg w-full max-w-6xl max-h-screen overflow-y-auto">
                <div id="projectDetailContent">
                    <!-- プロジェクト詳細がここに表示されます -->
                </div>
            </div>
        </div>

        <!-- 進捗記録モーダル -->
        <div id="progressModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 class="text-lg font-medium text-gray-900 mb-4">進捗の記録</h3>
                <form onsubmit="recordProgress(event)">
                    <input type="hidden" id="progressTaskId">
                    <input type="hidden" id="progressProjectId">
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700">進捗率 (%)</label>
                        <input type="range" id="progressPercentage" min="0" max="100" step="5" 
                            class="mt-1 block w-full" oninput="updateProgressLabel(this.value)">
                        <span id="progressLabel" class="text-sm text-gray-600">0%</span>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700">作業時間（時間）</label>
                        <input type="number" id="hoursSpent" step="0.5" min="0" 
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700">コメント</label>
                        <textarea id="progressComment" rows="3" 
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700">課題・ブロッカー</label>
                        <textarea id="progressBlockers" rows="2" 
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700">次のステップ</label>
                        <textarea id="progressNextSteps" rows="2" 
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
                    </div>
                    
                    <div class="flex justify-end space-x-3">
                        <button type="button" onclick="closeProgressModal()" 
                            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                            キャンセル
                        </button>
                        <button type="submit" 
                            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            記録
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <style>
            .gen-type-btn {
                @apply px-4 py-2 border rounded-md transition-colors;
            }
            .gen-type-btn.active {
                @apply bg-purple-600 text-white border-purple-600;
            }
            .gen-type-btn:not(.active) {
                @apply bg-white text-gray-700 border-gray-300 hover:bg-gray-50;
            }
            .view-btn {
                @apply rounded text-gray-600 hover:bg-gray-100;
            }
            .view-btn.active {
                @apply bg-gray-200;
            }
        </style>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let currentView = 'grid';
            let projects = [];
            let currentProjectId = null;
            
            // 初期化
            document.addEventListener('DOMContentLoaded', () => {
                loadProjects();
                loadClients();
            });
            
            // プロジェクト一覧読み込み
            async function loadProjects() {
                try {
                    const response = await axios.get('/api/projects');
                    projects = response.data.projects;
                    displayProjects(projects);
                } catch (error) {
                    console.error('Failed to load projects:', error);
                }
            }
            
            // プロジェクト表示
            function displayProjects(projectList) {
                const container = document.getElementById('projectsContainer');
                
                if (projectList.length === 0) {
                    container.innerHTML = '<div class="col-span-full text-center text-gray-500">プロジェクトがありません</div>';
                    return;
                }
                
                container.innerHTML = projectList.map(project => {
                    const statusColors = {
                        planning: 'bg-gray-100 text-gray-800',
                        active: 'bg-green-100 text-green-800',
                        on_hold: 'bg-yellow-100 text-yellow-800',
                        completed: 'bg-blue-100 text-blue-800',
                        cancelled: 'bg-red-100 text-red-800'
                    };
                    
                    const statusLabels = {
                        planning: '計画中',
                        active: '進行中',
                        on_hold: '保留',
                        completed: '完了',
                        cancelled: '中止'
                    };
                    
                    const healthColors = {
                        healthy: 'text-green-600',
                        warning: 'text-yellow-600',
                        at_risk: 'text-red-600'
                    };
                    
                    return \`
                        <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer" 
                             onclick="showProjectDetail(\${project.id})">
                            <div class="p-6">
                                <div class="flex justify-between items-start mb-4">
                                    <h3 class="text-lg font-medium text-gray-900">\${escapeHtml(project.name)}</h3>
                                    <span class="px-2 py-1 text-xs rounded-full \${statusColors[project.status]}">
                                        \${statusLabels[project.status]}
                                    </span>
                                </div>
                                
                                <div class="text-sm text-gray-600 mb-4">
                                    \${project.client_name ? \`<i class="fas fa-building mr-1"></i>\${escapeHtml(project.client_name)}\` : ''}
                                </div>
                                
                                <div class="mb-4">
                                    <div class="flex justify-between text-sm text-gray-600 mb-1">
                                        <span>進捗</span>
                                        <span>\${project.progress}%</span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-2">
                                        <div class="bg-blue-600 h-2 rounded-full" style="width: \${project.progress}%"></div>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <i class="fas fa-tasks mr-1 text-gray-400"></i>
                                        \${project.task_count || 0}タスク
                                    </div>
                                    <div>
                                        <i class="fas fa-check-circle mr-1 text-gray-400"></i>
                                        \${project.completed_task_count || 0}完了
                                    </div>
                                </div>
                                
                                \${project.isDelayed ? \`
                                    <div class="mt-4 text-sm text-red-600">
                                        <i class="fas fa-exclamation-triangle mr-1"></i>期限超過
                                    </div>
                                \` : ''}
                            </div>
                        </div>
                    \`;
                }).join('');
            }
            
            // プロジェクト詳細表示
            async function showProjectDetail(projectId) {
                try {
                    currentProjectId = projectId;
                    const response = await axios.get(\`/api/projects/\${projectId}\`);
                    const project = response.data.project;
                    
                    const detailContent = document.getElementById('projectDetailContent');
                    detailContent.innerHTML = \`
                        <div class="p-6">
                            <div class="flex justify-between items-start mb-6">
                                <div>
                                    <h2 class="text-2xl font-bold text-gray-900">\${escapeHtml(project.name)}</h2>
                                    <p class="text-gray-600 mt-2">\${escapeHtml(project.description || '')}</p>
                                </div>
                                <button onclick="closeProjectDetailModal()" class="text-gray-400 hover:text-gray-600">
                                    <i class="fas fa-times text-xl"></i>
                                </button>
                            </div>
                            
                            <!-- 進捗サマリー -->
                            <div class="grid grid-cols-4 gap-4 mb-6">
                                <div class="bg-gray-50 rounded-lg p-4">
                                    <div class="text-sm text-gray-600">全体進捗</div>
                                    <div class="text-2xl font-bold text-gray-900">\${project.overallProgress}%</div>
                                </div>
                                <div class="bg-gray-50 rounded-lg p-4">
                                    <div class="text-sm text-gray-600">タスク</div>
                                    <div class="text-2xl font-bold text-gray-900">\${project.completedTasks}/\${project.totalTasks}</div>
                                </div>
                                <div class="bg-gray-50 rounded-lg p-4">
                                    <div class="text-sm text-gray-600">作業時間</div>
                                    <div class="text-2xl font-bold text-gray-900">\${project.completedHours}h</div>
                                </div>
                                <div class="bg-gray-50 rounded-lg p-4">
                                    <div class="text-sm text-gray-600">メンバー</div>
                                    <div class="text-2xl font-bold text-gray-900">\${project.members?.length || 0}人</div>
                                </div>
                            </div>
                            
                            <!-- タスク一覧 -->
                            <div class="mb-6">
                                <h3 class="text-lg font-medium text-gray-900 mb-4">タスク一覧</h3>
                                <div class="bg-white border rounded-lg overflow-hidden">
                                    <table class="min-w-full divide-y divide-gray-200">
                                        <thead class="bg-gray-50">
                                            <tr>
                                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">タスク</th>
                                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">担当者</th>
                                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">期限</th>
                                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">進捗</th>
                                                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody class="bg-white divide-y divide-gray-200">
                                            \${project.tasks.map(task => \`
                                                <tr>
                                                    <td class="px-4 py-3 text-sm text-gray-900">\${escapeHtml(task.title)}</td>
                                                    <td class="px-4 py-3 text-sm text-gray-600">\${escapeHtml(task.assignee_name || '未割当')}</td>
                                                    <td class="px-4 py-3 text-sm text-gray-600">\${formatDate(task.due_date)}</td>
                                                    <td class="px-4 py-3 text-sm">
                                                        \${getStatusBadge(task.status)}
                                                    </td>
                                                    <td class="px-4 py-3 text-sm">
                                                        <div class="flex items-center">
                                                            <div class="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                                                <div class="bg-blue-600 h-2 rounded-full" style="width: \${task.progress || 0}%"></div>
                                                            </div>
                                                            <span class="text-gray-600">\${task.progress || 0}%</span>
                                                        </div>
                                                    </td>
                                                    <td class="px-4 py-3 text-sm">
                                                        <button onclick="showProgressModal(\${task.id}, \${projectId})" 
                                                            class="text-blue-600 hover:text-blue-800">
                                                            <i class="fas fa-chart-line"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            \`).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <!-- 最近の進捗 -->
                            \${project.recentProgress && project.recentProgress.length > 0 ? \`
                                <div class="mb-6">
                                    <h3 class="text-lg font-medium text-gray-900 mb-4">最近の進捗</h3>
                                    <div class="space-y-3">
                                        \${project.recentProgress.map(progress => \`
                                            <div class="bg-gray-50 rounded-lg p-4">
                                                <div class="flex justify-between items-start">
                                                    <div>
                                                        <div class="text-sm font-medium text-gray-900">
                                                            \${escapeHtml(progress.reporter_name)}
                                                        </div>
                                                        <div class="text-sm text-gray-600 mt-1">
                                                            \${escapeHtml(progress.comment || '')}
                                                        </div>
                                                    </div>
                                                    <div class="text-xs text-gray-500">
                                                        \${formatDateTime(progress.recorded_at)}
                                                    </div>
                                                </div>
                                            </div>
                                        \`).join('')}
                                    </div>
                                </div>
                            \` : ''}
                        </div>
                    \`;
                    
                    document.getElementById('projectDetailModal').classList.remove('hidden');
                } catch (error) {
                    console.error('Failed to load project details:', error);
                    alert('プロジェクト詳細の読み込みに失敗しました');
                }
            }
            
            // AI生成
            async function generateProjectFromPrompt(event) {
                event.preventDefault();
                
                const prompt = document.getElementById('projectPrompt').value;
                const clientId = document.getElementById('aiClientSelect').value;
                const deadline = document.getElementById('aiDeadline').value;
                
                try {
                    const response = await axios.post('/api/projects/generate', {
                        prompt,
                        clientId: clientId ? parseInt(clientId) : null,
                        context: { deadline }
                    });
                    
                    alert(response.data.message);
                    closeAIGeneratorModal();
                    loadProjects();
                } catch (error) {
                    console.error('Failed to generate project:', error);
                    alert('プロジェクトの生成に失敗しました: ' + (error.response?.data?.message || error.message));
                }
            }
            
            // 進捗記録
            async function recordProgress(event) {
                event.preventDefault();
                
                const taskId = document.getElementById('progressTaskId').value;
                const projectId = document.getElementById('progressProjectId').value;
                
                try {
                    await axios.post(\`/api/projects/\${projectId}/tasks/\${taskId}/progress\`, {
                        progressPercentage: parseInt(document.getElementById('progressPercentage').value),
                        hoursSpent: parseFloat(document.getElementById('hoursSpent').value) || 0,
                        comment: document.getElementById('progressComment').value,
                        blockers: document.getElementById('progressBlockers').value,
                        nextSteps: document.getElementById('progressNextSteps').value
                    });
                    
                    alert('進捗を記録しました');
                    closeProgressModal();
                    
                    // 詳細画面を更新
                    if (currentProjectId) {
                        showProjectDetail(currentProjectId);
                    }
                } catch (error) {
                    console.error('Failed to record progress:', error);
                    alert('進捗の記録に失敗しました');
                }
            }
            
            // モーダル操作
            function showAIGeneratorModal() {
                document.getElementById('aiGeneratorModal').classList.remove('hidden');
            }
            
            function closeAIGeneratorModal() {
                document.getElementById('aiGeneratorModal').classList.add('hidden');
            }
            
            function showProgressModal(taskId, projectId) {
                const element = document.getElementById('progressTaskId');
            if (element) element.value = taskId;
                const element = document.getElementById('progressProjectId');
            if (element) element.value = projectId;
                document.getElementById('progressModal').classList.remove('hidden');
            }
            
            function closeProgressModal() {
                document.getElementById('progressModal').classList.add('hidden');
                document.getElementById('progressModal').querySelector('form').reset();
            }
            
            function closeProjectDetailModal() {
                document.getElementById('projectDetailModal').classList.add('hidden');
                currentProjectId = null;
            }
            
            // ユーティリティ関数
            function escapeHtml(text) {
                if (!text) return '';
                const map = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#039;'
                };
                return text.toString().replace(/[&<>"']/g, m => map[m]);
            }
            
            function formatDate(dateStr) {
                if (!dateStr) return '';
                return new Date(dateStr).toLocaleDateString('ja-JP');
            }
            
            function formatDateTime(dateStr) {
                if (!dateStr) return '';
                const date = new Date(dateStr);
                return date.toLocaleDateString('ja-JP') + ' ' + 
                       date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            }
            
            function getStatusBadge(status) {
                const statusMap = {
                    pending: { label: '未着手', class: 'bg-gray-100 text-gray-800' },
                    in_progress: { label: '進行中', class: 'bg-blue-100 text-blue-800' },
                    completed: { label: '完了', class: 'bg-green-100 text-green-800' },
                    on_hold: { label: '保留', class: 'bg-yellow-100 text-yellow-800' }
                };
                
                const s = statusMap[status] || statusMap.pending;
                return \`<span class="px-2 py-1 text-xs rounded-full \${s.class}">\${s.label}</span>\`;
            }
            
            function updateProgressLabel(value) {
                document.getElementById('progressLabel').textContent = value + '%';
            }
            
            function setGenerationType(type) {
                document.querySelectorAll('.gen-type-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.type === type);
                });
                
                document.querySelectorAll('.generation-section').forEach(section => {
                    section.classList.add('hidden');
                });
                
                document.getElementById(type + 'Section').classList.remove('hidden');
            }
            
            async function loadClients() {
                try {
                    const response = await axios.get('/api/clients');
                    const clients = response.data.clients;
                    
                    const selects = document.querySelectorAll('#clientFilter, #aiClientSelect');
                    selects.forEach(select => {
                        const currentValue = select.value;
                        if (select.id === 'clientFilter') {
                            select.innerHTML = '<option value="">すべての顧客</option>';
                        } else {
                            select.innerHTML = '<option value="">選択してください</option>';
                        }
                        select.innerHTML += clients.map(c => 
                            \`<option value="\${c.id}">\${c.name}</option>\`
                        ).join('');
                        if (currentValue) select.value = currentValue;
                    });
                } catch (error) {
                    console.error('Failed to load clients:', error);
                }
            }
            
            function logout() {
                if (confirm('ログアウトしますか？')) {
                    window.location.href = '/logout';
                }
            }
        </script>
    </body>
    </html>
  `
}
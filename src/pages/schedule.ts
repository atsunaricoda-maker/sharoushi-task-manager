export function getSchedulePage(userName: string, userRole: string): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>スケジュール管理 - タスク管理システム</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/locale/ja.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/plugin/relativeTime.js"></script>
    <style>
        .schedule-critical { 
            background: linear-gradient(to right, #fee2e2, #fecaca);
            border-left: 4px solid #ef4444;
        }
        .schedule-normal { 
            background: linear-gradient(to right, #e0e7ff, #c7d2fe);
            border-left: 4px solid #6366f1;
        }
        .schedule-buffered { 
            background: linear-gradient(to right, #d1fae5, #a7f3d0);
            border-left: 4px solid #10b981;
        }
        .timeline-bar {
            position: relative;
            height: 40px;
            border-radius: 4px;
            transition: all 0.3s ease;
        }
        .timeline-bar:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .gantt-container {
            overflow-x: auto;
            overflow-y: auto;
            max-height: 600px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- ナビゲーションバー -->
    <nav class="bg-white shadow-sm border-b border-gray-200">
        <div class="container mx-auto px-4 py-3">
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-8">
                    <h1 class="text-xl font-bold text-gray-800">
                        <i class="fas fa-calendar-alt mr-2"></i>スケジュール管理
                    </h1>
                    <div class="flex space-x-4">
                        <a href="/" class="text-gray-600 hover:text-gray-900">
                            <i class="fas fa-home mr-1"></i>ダッシュボード
                        </a>
                        <a href="/projects" class="text-gray-600 hover:text-gray-900">
                            <i class="fas fa-project-diagram mr-1"></i>プロジェクト
                        </a>
                    </div>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-600">
                        <i class="fas fa-user mr-1"></i>${userName}
                    </span>
                    <button onclick="handleLogout()" class="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">
                        <i class="fas fa-sign-out-alt mr-1"></i>ログアウト
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <div class="container mx-auto px-4 py-6">
        <!-- プロジェクト選択とスケジュール生成 -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold flex items-center">
                    <i class="fas fa-project-diagram mr-2 text-blue-500"></i>
                    プロジェクトスケジュール
                </h2>
                <div class="flex space-x-2">
                    <button onclick="showScheduleGenerateModal()" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
                        <i class="fas fa-magic mr-2"></i>スケジュール生成
                    </button>
                    <button onclick="optimizeSchedule()" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
                        <i class="fas fa-cog mr-2"></i>最適化
                    </button>
                </div>
            </div>

            <!-- プロジェクト選択 -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">プロジェクト</label>
                    <select id="projectSelect" onchange="loadProjectSchedule()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">プロジェクトを選択</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">開始日</label>
                    <input type="date" id="startDate" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">終了日</label>
                    <input type="date" id="endDate" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
            </div>

            <!-- スケジュール警告 -->
            <div id="scheduleWarnings" class="hidden mb-4">
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div class="flex items-start">
                        <i class="fas fa-exclamation-triangle text-yellow-500 mr-3 mt-1"></i>
                        <div>
                            <h3 class="font-semibold text-yellow-800 mb-1">スケジュール警告</h3>
                            <ul id="warningsList" class="text-sm text-yellow-700 space-y-1"></ul>
                        </div>
                    </div>
                </div>
            </div>

            <!-- スケジュール統計 -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="text-sm text-gray-600 mb-1">総タスク数</div>
                    <div class="text-2xl font-bold text-gray-800" id="totalTasks">0</div>
                </div>
                <div class="bg-red-50 rounded-lg p-4">
                    <div class="text-sm text-red-600 mb-1">クリティカルパス</div>
                    <div class="text-2xl font-bold text-red-800" id="criticalTasks">0</div>
                </div>
                <div class="bg-blue-50 rounded-lg p-4">
                    <div class="text-sm text-blue-600 mb-1">推定総時間</div>
                    <div class="text-2xl font-bold text-blue-800" id="totalHours">0h</div>
                </div>
                <div class="bg-green-50 rounded-lg p-4">
                    <div class="text-sm text-green-600 mb-1">平均バッファー</div>
                    <div class="text-2xl font-bold text-green-800" id="avgBuffer">0日</div>
                </div>
            </div>
        </div>

        <!-- タイムライン表示 -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 class="text-lg font-bold mb-4 flex items-center">
                <i class="fas fa-stream mr-2 text-indigo-500"></i>
                タイムライン
            </h2>
            <div id="timelineContainer" class="space-y-3">
                <!-- タイムラインが動的に挿入される -->
            </div>
        </div>

        <!-- ガントチャート -->
        <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="text-lg font-bold mb-4 flex items-center">
                <i class="fas fa-chart-gantt mr-2 text-purple-500"></i>
                ガントチャート
            </h2>
            <div class="gantt-container">
                <canvas id="ganttChart"></canvas>
            </div>
        </div>
    </div>

    <!-- スケジュール生成モーダル -->
    <div id="scheduleGenerateModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
        <div class="flex items-center justify-center min-h-screen p-4">
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 class="text-lg font-bold mb-4">
                    <i class="fas fa-magic mr-2 text-blue-500"></i>
                    スケジュール自動生成
                </h3>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">バッファー率 (%)</label>
                        <input type="number" id="bufferPercentage" value="20" min="0" max="100" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <p class="text-xs text-gray-500 mt-1">各タスクに追加される余裕時間の割合</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">1日の作業時間</label>
                        <input type="number" id="workingHours" value="8" min="1" max="24" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    </div>
                    
                    <div>
                        <label class="flex items-center">
                            <input type="checkbox" id="allowParallel" checked class="mr-2">
                            <span class="text-sm">並列実行を許可</span>
                        </label>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-2 mt-6">
                    <button onclick="hideScheduleGenerateModal()" class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg">
                        キャンセル
                    </button>
                    <button onclick="generateSchedule()" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg">
                        生成開始
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script>
        dayjs.locale('ja');
        dayjs.extend(window.dayjs_plugin_relativeTime);

        let currentProject = null;
        let scheduleData = null;
        let ganttChart = null;

        // 初期化
        document.addEventListener('DOMContentLoaded', () => {
            loadProjects();
            const today = dayjs().format('YYYY-MM-DD');
            const endDate = dayjs().add(30, 'day').format('YYYY-MM-DD');
            document.getElementById('startDate').value = today;
            document.getElementById('endDate').value = endDate;
        });

        // プロジェクト一覧を読み込み
        async function loadProjects() {
            try {
                const response = await fetch('/api/projects');
                if (!response.ok) throw new Error('Failed to load projects');
                
                const data = await response.json();
                const select = document.getElementById('projectSelect');
                select.innerHTML = '<option value="">プロジェクトを選択</option>';
                
                data.projects.forEach(project => {
                    const option = document.createElement('option');
                    option.value = project.id;
                    option.textContent = project.name;
                    select.appendChild(option);
                });
            } catch (error) {
                console.error('Error loading projects:', error);
                showNotification('プロジェクトの読み込みに失敗しました', 'error');
            }
        }

        // プロジェクトのスケジュールを読み込み
        async function loadProjectSchedule() {
            const projectId = document.getElementById('projectSelect').value;
            if (!projectId) {
                clearScheduleDisplay();
                return;
            }

            try {
                const response = await fetch(\`/api/schedule/project/\${projectId}\`);
                if (!response.ok) throw new Error('Failed to load schedule');
                
                scheduleData = await response.json();
                currentProject = scheduleData.project;
                
                // 日付フィールドを更新
                if (currentProject.startDate) {
                    document.getElementById('startDate').value = dayjs(currentProject.startDate).format('YYYY-MM-DD');
                }
                if (currentProject.endDate) {
                    document.getElementById('endDate').value = dayjs(currentProject.endDate).format('YYYY-MM-DD');
                }
                
                // 統計情報を表示
                updateStats(scheduleData.stats);
                
                // タイムラインを表示
                displayTimeline(scheduleData.tasks);
                
                // ガントチャートを表示
                displayGanttChart(scheduleData.tasks);
                
            } catch (error) {
                console.error('Error loading schedule:', error);
                showNotification('スケジュールの読み込みに失敗しました', 'error');
            }
        }

        // 統計情報を更新
        function updateStats(stats) {
            document.getElementById('totalTasks').textContent = stats.totalTasks || 0;
            document.getElementById('criticalTasks').textContent = stats.criticalPathTasks || 0;
            document.getElementById('totalHours').textContent = \`\${stats.totalEstimatedHours || 0}h\`;
            document.getElementById('avgBuffer').textContent = \`\${Math.round(stats.averageBufferDays || 0)}日\`;
        }

        // タイムラインを表示
        function displayTimeline(tasks) {
            const container = document.getElementById('timelineContainer');
            container.innerHTML = '';

            if (!tasks || tasks.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center">スケジュールデータがありません</p>';
                return;
            }

            tasks.forEach(task => {
                const taskEl = document.createElement('div');
                const isCritical = task.is_critical;
                const statusClass = isCritical ? 'schedule-critical' : task.buffer_days > 2 ? 'schedule-buffered' : 'schedule-normal';
                
                taskEl.className = \`\${statusClass} rounded-lg p-4 cursor-pointer hover:shadow-md transition-all\`;
                
                const startDate = dayjs(task.scheduled_start);
                const endDate = dayjs(task.scheduled_end);
                const duration = endDate.diff(startDate, 'day') + 1;
                
                taskEl.innerHTML = \`
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <h4 class="font-semibold text-gray-800">\${task.title}</h4>
                            <div class="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                <span><i class="fas fa-calendar mr-1"></i>\${startDate.format('MM/DD')} - \${endDate.format('MM/DD')}</span>
                                <span><i class="fas fa-clock mr-1"></i>\${task.estimated_hours || 8}時間</span>
                                <span><i class="fas fa-user mr-1"></i>\${task.assignee_name || '未割当'}</span>
                                \${isCritical ? '<span class="text-red-600 font-semibold"><i class="fas fa-exclamation-circle mr-1"></i>クリティカル</span>' : ''}
                                \${task.buffer_days ? \`<span class="text-green-600"><i class="fas fa-shield-alt mr-1"></i>バッファー: \${task.buffer_days}日</span>\` : ''}
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-2xl font-bold text-gray-700">\${duration}日</div>
                            <div class="text-xs text-gray-500">期間</div>
                        </div>
                    </div>
                \`;
                
                container.appendChild(taskEl);
            });
        }

        // ガントチャートを表示
        function displayGanttChart(tasks) {
            if (!tasks || tasks.length === 0) return;

            const ctx = document.getElementById('ganttChart').getContext('2d');
            
            // 既存のチャートを破棄
            if (ganttChart) {
                ganttChart.destroy();
            }

            // データを準備
            const labels = tasks.map(t => t.title);
            const startDates = tasks.map(t => dayjs(t.scheduled_start).valueOf());
            const endDates = tasks.map(t => dayjs(t.scheduled_end).valueOf());
            const durations = tasks.map((t, i) => endDates[i] - startDates[i]);

            // チャートを作成
            ganttChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'タスク期間',
                        data: durations,
                        backgroundColor: tasks.map(t => 
                            t.is_critical ? 'rgba(239, 68, 68, 0.5)' : 
                            t.priority === 'high' ? 'rgba(245, 158, 11, 0.5)' : 
                            'rgba(59, 130, 246, 0.5)'
                        ),
                        borderColor: tasks.map(t => 
                            t.is_critical ? 'rgba(239, 68, 68, 1)' : 
                            t.priority === 'high' ? 'rgba(245, 158, 11, 1)' : 
                            'rgba(59, 130, 246, 1)'
                        ),
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const task = tasks[context.dataIndex];
                                    const start = dayjs(task.scheduled_start).format('YYYY/MM/DD');
                                    const end = dayjs(task.scheduled_end).format('YYYY/MM/DD');
                                    return \`期間: \${start} - \${end}\`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            type: 'time',
                            time: {
                                unit: 'day',
                                displayFormats: {
                                    day: 'MM/DD'
                                }
                            },
                            min: Math.min(...startDates),
                            max: Math.max(...endDates)
                        }
                    }
                }
            });

            // Canvas のサイズを設定
            ctx.canvas.style.height = \`\${tasks.length * 40 + 100}px\`;
        }

        // スケジュール生成
        async function generateSchedule() {
            const projectId = document.getElementById('projectSelect').value;
            if (!projectId) {
                showNotification('プロジェクトを選択してください', 'error');
                return;
            }

            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const bufferPercentage = parseInt(document.getElementById('bufferPercentage').value);
            const workingHours = parseInt(document.getElementById('workingHours').value);
            const allowParallel = document.getElementById('allowParallel').checked;

            try {
                const response = await fetch('/api/schedule/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        projectId,
                        startDate,
                        endDate,
                        bufferPercentage,
                        allowParallelExecution: allowParallel,
                        maxDailyHours: workingHours
                    })
                });

                if (!response.ok) throw new Error('Failed to generate schedule');
                
                const result = await response.json();
                
                // 警告を表示
                if (result.result.warnings && result.result.warnings.length > 0) {
                    displayWarnings(result.result.warnings);
                }
                
                // 提案を表示
                if (result.result.suggestions && result.result.suggestions.length > 0) {
                    displaySuggestions(result.result.suggestions);
                }
                
                hideScheduleGenerateModal();
                showNotification(result.result.message || 'スケジュールを生成しました', 'success');
                
                // スケジュールを再読み込み
                await loadProjectSchedule();
                
            } catch (error) {
                console.error('Error generating schedule:', error);
                showNotification('スケジュール生成に失敗しました', 'error');
            }
        }

        // スケジュール最適化
        async function optimizeSchedule() {
            const projectId = document.getElementById('projectSelect').value;
            if (!projectId) {
                showNotification('プロジェクトを選択してください', 'error');
                return;
            }

            const additionalDays = prompt('追加日数を入力してください（0で現在の期限内で最適化）:', '0');
            if (additionalDays === null) return;

            try {
                const response = await fetch('/api/schedule/optimize', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        projectId,
                        additionalDays: parseInt(additionalDays) || 0
                    })
                });

                if (!response.ok) throw new Error('Failed to optimize schedule');
                
                const result = await response.json();
                
                // 提案を表示
                if (result.suggestions && result.suggestions.length > 0) {
                    displaySuggestions(result.suggestions);
                }
                
                showNotification(result.message || 'スケジュールを最適化しました', 'success');
                
                // スケジュールを再読み込み
                await loadProjectSchedule();
                
            } catch (error) {
                console.error('Error optimizing schedule:', error);
                showNotification('スケジュール最適化に失敗しました', 'error');
            }
        }

        // 警告を表示
        function displayWarnings(warnings) {
            const container = document.getElementById('scheduleWarnings');
            const list = document.getElementById('warningsList');
            
            list.innerHTML = warnings.map(w => \`<li>• \${w}</li>\`).join('');
            container.classList.remove('hidden');
        }

        // 提案を表示
        function displaySuggestions(suggestions) {
            const suggestionsHtml = suggestions.map(s => \`<li>• \${s}</li>\`).join('');
            const message = \`
                <div class="text-sm">
                    <p class="font-semibold mb-2">改善提案:</p>
                    <ul class="space-y-1">\${suggestionsHtml}</ul>
                </div>
            \`;
            showNotification(message, 'info', 10000); // 10秒表示
        }

        // モーダル表示/非表示
        function showScheduleGenerateModal() {
            document.getElementById('scheduleGenerateModal').classList.remove('hidden');
        }

        function hideScheduleGenerateModal() {
            document.getElementById('scheduleGenerateModal').classList.add('hidden');
        }

        // 表示をクリア
        function clearScheduleDisplay() {
            document.getElementById('timelineContainer').innerHTML = '';
            updateStats({});
            if (ganttChart) {
                ganttChart.destroy();
                ganttChart = null;
            }
        }

        // 通知表示
        function showNotification(message, type = 'info', duration = 3000) {
            const notification = document.createElement('div');
            const bgColor = type === 'success' ? 'bg-green-500' : 
                           type === 'error' ? 'bg-red-500' : 
                           type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';
            
            notification.className = \`fixed top-4 right-4 \${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-md\`;
            notification.innerHTML = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, duration);
        }

        // ログアウト
        async function handleLogout() {
            const response = await fetch('/api/auth/logout', { method: 'POST' });
            if (response.ok) {
                window.location.href = '/login';
            }
        }
    </script>
</body>
</html>
  `;
}
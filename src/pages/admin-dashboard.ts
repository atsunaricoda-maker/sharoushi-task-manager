/**
 * 管理者ダッシュボード画面
 * スタッフの業務実績を詳細に分析・表示
 */

export function getAdminDashboardPage(userName: string): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>管理者ダッシュボード - 労務管理タスクシステム</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <style>
        .stat-card {
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
        }
        .performance-bar {
            transition: width 0.8s ease-in-out;
        }
        .ranking-medal {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            font-weight: bold;
            font-size: 12px;
        }
        .ranking-gold { background: linear-gradient(135deg, #FFD700, #FFA500); color: white; }
        .ranking-silver { background: linear-gradient(135deg, #C0C0C0, #808080); color: white; }
        .ranking-bronze { background: linear-gradient(135deg, #CD7F32, #8B4513); color: white; }
    </style>
</head>
<body class="bg-gray-50">
    <!-- ヘッダー -->
    <header class="bg-white shadow-sm border-b sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center space-x-4">
                    <a href="/" class="text-gray-600 hover:text-gray-900">
                        <i class="fas fa-arrow-left"></i>
                    </a>
                    <h1 class="text-xl font-bold text-gray-900">
                        <i class="fas fa-chart-line text-purple-600 mr-2"></i>
                        管理者ダッシュボード
                    </h1>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-600">
                        <i class="fas fa-user-shield mr-1"></i>
                        ${userName}
                    </span>
                    <button onclick="logout()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- 期間選択 -->
        <div class="mb-6 bg-white rounded-lg shadow p-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <label class="text-sm font-medium text-gray-700">分析期間:</label>
                    <select id="periodSelect" onchange="updateDashboard()" class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option value="week">今週</option>
                        <option value="month" selected>今月</option>
                        <option value="year">今年</option>
                        <option value="custom">カスタム</option>
                    </select>
                    <div id="customDateRange" class="hidden space-x-2">
                        <input type="date" id="startDate" class="px-3 py-2 border border-gray-300 rounded-md">
                        <span class="text-gray-500">〜</span>
                        <input type="date" id="endDate" class="px-3 py-2 border border-gray-300 rounded-md">
                        <button onclick="updateDashboard()" class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                            適用
                        </button>
                    </div>
                </div>
                <button onclick="exportReport()" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                    <i class="fas fa-download mr-2"></i>レポート出力
                </button>
            </div>
        </div>

        <!-- サマリーカード -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div class="stat-card bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-600">総完了タスク</span>
                    <i class="fas fa-check-circle text-green-500"></i>
                </div>
                <div class="text-3xl font-bold text-gray-900" id="totalCompleted">-</div>
                <div class="text-xs text-gray-500 mt-1" id="completedTrend"></div>
            </div>
            
            <div class="stat-card bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-600">総作業時間</span>
                    <i class="fas fa-clock text-blue-500"></i>
                </div>
                <div class="text-3xl font-bold text-gray-900" id="totalHours">-</div>
                <div class="text-xs text-gray-500 mt-1">時間</div>
            </div>
            
            <div class="stat-card bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-600">平均効率</span>
                    <i class="fas fa-tachometer-alt text-purple-500"></i>
                </div>
                <div class="text-3xl font-bold text-gray-900" id="avgEfficiency">-</div>
                <div class="text-xs text-gray-500 mt-1">%</div>
            </div>
            
            <div class="stat-card bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-600">遅延タスク</span>
                    <i class="fas fa-exclamation-triangle text-red-500"></i>
                </div>
                <div class="text-3xl font-bold text-gray-900" id="overdueCount">-</div>
                <div class="text-xs text-gray-500 mt-1">件</div>
            </div>
        </div>

        <!-- メインコンテンツ -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- スタッフ別実績 -->
            <div class="lg:col-span-2 bg-white rounded-lg shadow">
                <div class="p-6 border-b">
                    <h2 class="text-lg font-semibold text-gray-900">
                        <i class="fas fa-users mr-2 text-purple-600"></i>
                        スタッフ別業務実績
                    </h2>
                </div>
                <div class="p-6">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">スタッフ</th>
                                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">完了</th>
                                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">進行中</th>
                                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">作業時間</th>
                                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">効率</th>
                                    <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">顧客数</th>
                                </tr>
                            </thead>
                            <tbody id="staffPerformanceTable" class="bg-white divide-y divide-gray-200">
                                <!-- データはJSで挿入 -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- ランキング -->
            <div class="bg-white rounded-lg shadow">
                <div class="p-6 border-b">
                    <h2 class="text-lg font-semibold text-gray-900">
                        <i class="fas fa-trophy mr-2 text-yellow-500"></i>
                        月間ランキング
                    </h2>
                </div>
                <div class="p-6 space-y-6">
                    <!-- タスク完了数 -->
                    <div>
                        <h3 class="text-sm font-medium text-gray-700 mb-3">タスク完了数</h3>
                        <div id="completionRanking" class="space-y-2">
                            <!-- ランキングデータ -->
                        </div>
                    </div>
                    
                    <!-- 効率性 -->
                    <div>
                        <h3 class="text-sm font-medium text-gray-700 mb-3">処理速度</h3>
                        <div id="efficiencyRanking" class="space-y-2">
                            <!-- ランキングデータ -->
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- グラフエリア -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <!-- 業務推移グラフ -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">
                    <i class="fas fa-chart-line mr-2 text-blue-600"></i>
                    業務完了推移
                </h2>
                <canvas id="trendsChart" height="200"></canvas>
            </div>

            <!-- タスクタイプ別分析 -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-4">
                    <i class="fas fa-chart-pie mr-2 text-green-600"></i>
                    タスクタイプ別実績
                </h2>
                <canvas id="taskTypeChart" height="200"></canvas>
            </div>
        </div>

        <!-- 業務負荷分析 -->
        <div class="mt-6 bg-white rounded-lg shadow">
            <div class="p-6 border-b">
                <h2 class="text-lg font-semibold text-gray-900">
                    <i class="fas fa-balance-scale mr-2 text-orange-600"></i>
                    現在の業務負荷
                </h2>
            </div>
            <div class="p-6">
                <div id="workloadAnalysis" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <!-- 業務負荷データ -->
                </div>
            </div>
        </div>
    </div>

    <script>
        let performanceData = {};
        let trendsChart = null;
        let taskTypeChart = null;

        // 初期化
        document.addEventListener('DOMContentLoaded', () => {
            updateDashboard();
            
            // 期間選択の変更イベント
            document.getElementById('periodSelect').addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    document.getElementById('customDateRange').classList.remove('hidden');
                } else {
                    document.getElementById('customDateRange').classList.add('hidden');
                    updateDashboard();
                }
            });
        });

        // ダッシュボード更新
        async function updateDashboard() {
            const periodSelect = document.getElementById('periodSelect');
            if (!periodSelect) {
                console.error('periodSelect element not found in updateDashboard');
                return;
            }
            
            const period = periodSelect.value;
            let params = { period };
            
            if (period === 'custom') {
                const startDateEl = document.getElementById('startDate');
                const endDateEl = document.getElementById('endDate');
                
                if (!startDateEl || !endDateEl) {
                    console.error('Date range elements not found');
                    return;
                }
                
                params.start_date = startDateEl.value;
                params.end_date = endDateEl.value;
            }

            try {
                // スタッフ実績取得
                const perfResponse = await axios.get('/api/admin/staff-performance', { params });
                performanceData = perfResponse.data;
                
                // ランキング取得
                const rankResponse = await axios.get('/api/admin/rankings', { params: { period: period === 'custom' ? 'month' : period } });
                
                // 効率指標取得
                const effResponse = await axios.get('/api/admin/efficiency-metrics');
                
                // 業務負荷取得
                const workloadResponse = await axios.get('/api/admin/workload-analysis');
                
                // 推移データ取得
                const trendsResponse = await axios.get('/api/admin/performance-trends', { params: { period: 30 } });
                
                // UIを更新
                updateSummaryCards(performanceData.staff_performance);
                updateStaffTable(performanceData.staff_performance);
                updateRankings(rankResponse.data);
                updateWorkloadAnalysis(workloadResponse.data);
                updateCharts(trendsResponse.data, performanceData.task_type_breakdown);
                
            } catch (error) {
                console.error('Failed to update dashboard:', error);
                alert('データの取得に失敗しました');
            }
        }

        // サマリーカード更新
        function updateSummaryCards(staffData) {
            const totalCompleted = staffData.reduce((sum, s) => sum + (s.completed_tasks || 0), 0);
            const totalHours = staffData.reduce((sum, s) => sum + (s.total_hours || 0), 0);
            const avgEfficiency = staffData.length > 0 
                ? Math.round(staffData.reduce((sum, s) => sum + (s.efficiency_rate || 0), 0) / staffData.length)
                : 0;
            const overdueCount = staffData.reduce((sum, s) => sum + (s.overdue_tasks || 0), 0);
            
            document.getElementById('totalCompleted').textContent = totalCompleted.toLocaleString();
            document.getElementById('totalHours').textContent = totalHours.toFixed(1);
            document.getElementById('avgEfficiency').textContent = avgEfficiency;
            document.getElementById('overdueCount').textContent = overdueCount;
        }

        // スタッフテーブル更新
        function updateStaffTable(staffData) {
            const tbody = document.getElementById('staffPerformanceTable');
            
            tbody.innerHTML = staffData.map(staff => \`
                <tr>
                    <td class="px-4 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                                <i class="fas fa-user text-purple-600"></i>
                            </div>
                            <div class="ml-3">
                                <div class="text-sm font-medium text-gray-900">\${escapeHtml(staff.user_name)}</div>
                                <div class="text-xs text-gray-500">\${escapeHtml(staff.role)}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-4 py-4 text-center">
                        <span class="text-lg font-semibold text-green-600">\${staff.completed_tasks || 0}</span>
                    </td>
                    <td class="px-4 py-4 text-center">
                        <span class="text-sm text-blue-600">\${staff.in_progress_tasks || 0}</span>
                    </td>
                    <td class="px-4 py-4 text-center">
                        <span class="text-sm text-gray-900">\${(staff.total_hours || 0).toFixed(1)}h</span>
                    </td>
                    <td class="px-4 py-4 text-center">
                        <div class="flex items-center justify-center">
                            <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div class="performance-bar bg-\${getEfficiencyColor(staff.efficiency_rate || 0)}-500 h-2 rounded-full" 
                                     style="width: \${Math.min(100, staff.efficiency_rate || 0)}%"></div>
                            </div>
                            <span class="text-xs font-medium">\${(staff.efficiency_rate || 0).toFixed(0)}%</span>
                        </div>
                    </td>
                    <td class="px-4 py-4 text-center">
                        <span class="text-sm text-gray-900">\${staff.clients_served || 0}</span>
                    </td>
                </tr>
            \`).join('');
        }

        // ランキング更新
        function updateRankings(rankingData) {
            // タスク完了数ランキング
            const completionDiv = document.getElementById('completionRanking');
            completionDiv.innerHTML = (rankingData.completion_ranking || []).slice(0, 3).map((item, index) => \`
                <div class="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                    <div class="flex items-center">
                        \${getRankingMedal(index + 1)}
                        <span class="ml-2 text-sm font-medium">\${escapeHtml(item.user_name)}</span>
                    </div>
                    <span class="text-sm font-bold text-gray-900">\${item.completed_tasks}件</span>
                </div>
            \`).join('');
            
            // 効率性ランキング
            const efficiencyDiv = document.getElementById('efficiencyRanking');
            efficiencyDiv.innerHTML = (rankingData.efficiency_ranking || []).slice(0, 3).map((item, index) => \`
                <div class="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                    <div class="flex items-center">
                        \${getRankingMedal(index + 1)}
                        <span class="ml-2 text-sm font-medium">\${escapeHtml(item.user_name)}</span>
                    </div>
                    <span class="text-sm font-bold text-gray-900">\${item.avg_completion_days.toFixed(1)}日</span>
                </div>
            \`).join('');
        }

        // グラフ更新
        function updateCharts(trendsData, taskTypeData) {
            // 推移グラフ
            const ctx1 = document.getElementById('trendsChart').getContext('2d');
            if (trendsChart) trendsChart.destroy();
            
            const dailyData = trendsData.daily || [];
            const dates = [...new Set(dailyData.map(d => d.date))].sort();
            const users = [...new Set(dailyData.map(d => d.user_name))];
            
            trendsChart = new Chart(ctx1, {
                type: 'line',
                data: {
                    labels: dates.slice(-7),
                    datasets: users.map((user, index) => ({
                        label: user,
                        data: dates.slice(-7).map(date => {
                            const item = dailyData.find(d => d.date === date && d.user_name === user);
                            return item ? item.completed_tasks : 0;
                        }),
                        borderColor: getChartColor(index),
                        backgroundColor: getChartColor(index, 0.1),
                        tension: 0.3
                    }))
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
            
            // タスクタイプグラフ
            const ctx2 = document.getElementById('taskTypeChart').getContext('2d');
            if (taskTypeChart) taskTypeChart.destroy();
            
            const typeData = {};
            (taskTypeData || []).forEach(item => {
                if (!typeData[item.task_type]) typeData[item.task_type] = 0;
                typeData[item.task_type] += item.completed_count;
            });
            
            taskTypeChart = new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(typeData),
                    datasets: [{
                        data: Object.values(typeData),
                        backgroundColor: [
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(16, 185, 129, 0.8)',
                            'rgba(251, 146, 60, 0.8)',
                            'rgba(147, 51, 234, 0.8)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }

        // 業務負荷分析更新
        function updateWorkloadAnalysis(workloadData) {
            const container = document.getElementById('workloadAnalysis');
            
            container.innerHTML = (workloadData.staff_workload || []).map(staff => \`
                <div class="bg-gray-50 rounded-lg p-4">
                    <h4 class="font-medium text-gray-900 mb-2">\${escapeHtml(staff.user_name)}</h4>
                    <div class="space-y-1 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-600">進行中</span>
                            <span class="font-medium">\${staff.active_tasks}件</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">予定時間</span>
                            <span class="font-medium">\${staff.remaining_hours.toFixed(1)}h</span>
                        </div>
                        \${staff.urgent_tasks > 0 ? \`
                            <div class="flex justify-between text-red-600">
                                <span>緊急</span>
                                <span class="font-medium">\${staff.urgent_tasks}件</span>
                            </div>
                        \` : ''}
                    </div>
                </div>
            \`).join('');
        }

        // ヘルパー関数
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

        function getEfficiencyColor(rate) {
            if (rate >= 90) return 'green';
            if (rate >= 70) return 'blue';
            if (rate >= 50) return 'yellow';
            return 'red';
        }

        function getRankingMedal(rank) {
            if (rank === 1) return '<span class="ranking-medal ranking-gold">1</span>';
            if (rank === 2) return '<span class="ranking-medal ranking-silver">2</span>';
            if (rank === 3) return '<span class="ranking-medal ranking-bronze">3</span>';
            return \`<span class="ranking-medal bg-gray-200 text-gray-600">\${rank}</span>\`;
        }

        function getChartColor(index, alpha = 1) {
            const colors = [
                \`rgba(59, 130, 246, \${alpha})\`,
                \`rgba(16, 185, 129, \${alpha})\`,
                \`rgba(251, 146, 60, \${alpha})\`,
                \`rgba(147, 51, 234, \${alpha})\`,
                \`rgba(239, 68, 68, \${alpha})\`
            ];
            return colors[index % colors.length];
        }

        // レポート出力
        async function exportReport() {
            const period = document.getElementById('periodSelect').value;
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            
            try {
                // Get current dashboard data for export
                const params = new URLSearchParams();
                params.append('period', period);
                if (period === 'custom' && startDate && endDate) {
                    params.append('start_date', startDate);
                    params.append('end_date', endDate);
                }
                
                const response = await fetch(\`/api/admin/export-report?\${params.toString()}\`, {
                    method: 'GET',
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error('レポート生成に失敗しました');
                }
                
                // Create CSV content from current data
                const csvContent = generateCSVContent();
                
                // Create download
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', \`admin-report-\${new Date().toISOString().split('T')[0]}.csv\`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                alert('管理者レポートをダウンロードしました');
                
            } catch (error) {
                console.error('Export error:', error);
                alert('レポート出力に失敗しました: ' + error.message);
            }
        }
        
        function generateCSVContent() {
            const periodSelect = document.getElementById('periodSelect');
            if (!periodSelect) {
                console.error('periodSelect element not found');
                return 'エラー: 期間選択要素が見つかりません';
            }
            
            const period = periodSelect.value;
            const periodLabel = {
                'week': '今週',
                'month': '今月', 
                'year': '今年',
                'custom': 'カスタム期間'
            }[period];
            
            let csv = 'スタッフ管理レポート\\n';
            csv += \`期間: \${periodLabel}\\n\`;
            csv += \`生成日時: \${new Date().toLocaleString('ja-JP')}\\n\\n\`;
            
            // Summary section
            csv += 'サマリー情報\\n';
            csv += 'スタッフ数,完了タスク合計,総稼働時間,平均効率\\n';
            csv += \`\${document.getElementById('staffCount')?.textContent || 0},\`;
            csv += \`\${document.getElementById('totalCompleted')?.textContent || 0},\`;
            csv += \`\${document.getElementById('totalHours')?.textContent || 0},\`;
            csv += \`\${document.getElementById('avgEfficiency')?.textContent || 0}%\\n\\n\`;
            
            // Staff performance section
            csv += 'スタッフ別実績\\n';
            csv += 'スタッフ名,完了タスク,進行中,遅延中,効率率,総時間\\n';
            
            // Get data from staff table
            const staffRows = document.querySelectorAll('#staffPerformanceTable tbody tr');
            staffRows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length >= 6) {
                    csv += \`\${cells[0].textContent},\`;  // Name
                    csv += \`\${cells[1].textContent},\`;  // Completed
                    csv += \`\${cells[2].textContent},\`;  // In Progress  
                    csv += \`\${cells[3].textContent},\`;  // Overdue
                    csv += \`\${cells[4].textContent},\`;  // Efficiency
                    csv += \`\${cells[5].textContent}\\n\`; // Hours
                }
            });
            
            return csv;
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
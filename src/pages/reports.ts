export function getReportsPage(userName: string): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>レポート - 社労士事務所タスク管理</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body class="bg-gray-50 min-h-screen">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center space-x-8">
                    <h1 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-chart-bar mr-2 text-blue-600"></i>
                        レポート
                    </h1>
                    <nav class="flex space-x-4">
                        <a href="/" class="px-3 py-2 text-gray-700 hover:text-gray-900">
                            <i class="fas fa-home mr-1"></i>ダッシュボード
                        </a>
                        <a href="/clients" class="px-3 py-2 text-gray-700 hover:text-gray-900">
                            <i class="fas fa-building mr-1"></i>顧問先
                        </a>
                        <a href="/reports" class="px-3 py-2 text-blue-600 font-medium">
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
        <!-- Report Controls -->
        <div class="bg-white rounded-lg shadow p-6 mb-8">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-gray-900">レポート設定</h2>
                <div class="flex space-x-2">
                    <button onclick="generateReport()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        <i class="fas fa-sync mr-2"></i>レポート生成
                    </button>
                    <button onclick="exportReport('csv')" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                        <i class="fas fa-file-csv mr-2"></i>CSVエクスポート
                    </button>
                    <button onclick="exportReport('pdf')" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                        <i class="fas fa-file-pdf mr-2"></i>PDFエクスポート
                    </button>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">レポートタイプ</label>
                    <select id="reportType" class="w-full rounded-lg border-gray-300 focus:border-blue-500" onchange="handleReportTypeChange()">
                        <option value="monthly">月次レポート</option>
                        <option value="client">顧問先別レポート</option>
                        <option value="staff">スタッフ別レポート</option>
                    </select>
                </div>
                
                <div id="monthSelector">
                    <label class="block text-sm font-medium text-gray-700 mb-2">対象月</label>
                    <input type="month" id="reportMonth" class="w-full rounded-lg border-gray-300 focus:border-blue-500">
                </div>
                
                <div id="clientSelector" style="display: none;">
                    <label class="block text-sm font-medium text-gray-700 mb-2">顧問先</label>
                    <select id="reportClient" class="w-full rounded-lg border-gray-300 focus:border-blue-500">
                        <option value="">選択してください</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">期間</label>
                    <select id="reportPeriod" class="w-full rounded-lg border-gray-300 focus:border-blue-500">
                        <option value="1">1ヶ月</option>
                        <option value="3">3ヶ月</option>
                        <option value="6">6ヶ月</option>
                        <option value="12">12ヶ月</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">総タスク数</p>
                        <p class="text-3xl font-bold text-gray-900" id="totalTasks">-</p>
                        <p class="text-xs text-gray-500 mt-1">
                            <span id="taskGrowth">-</span>
                        </p>
                    </div>
                    <div class="bg-blue-100 p-3 rounded-full">
                        <i class="fas fa-tasks text-blue-600 text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">完了率</p>
                        <p class="text-3xl font-bold text-green-600" id="completionRate">-</p>
                        <p class="text-xs text-gray-500 mt-1">
                            前月比 <span id="completionChange">-</span>
                        </p>
                    </div>
                    <div class="bg-green-100 p-3 rounded-full">
                        <i class="fas fa-check-circle text-green-600 text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">遅延タスク</p>
                        <p class="text-3xl font-bold text-red-600" id="overdueTasks">-</p>
                        <p class="text-xs text-gray-500 mt-1">
                            全体の <span id="overdueRate">-</span>
                        </p>
                    </div>
                    <div class="bg-red-100 p-3 rounded-full">
                        <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm">工数効率</p>
                        <p class="text-3xl font-bold text-purple-600" id="efficiencyRate">-</p>
                        <p class="text-xs text-gray-500 mt-1">
                            実績/予定
                        </p>
                    </div>
                    <div class="bg-purple-100 p-3 rounded-full">
                        <i class="fas fa-clock text-purple-600 text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <!-- Task Status Distribution -->
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">タスク状況分布</h3>
                <div style="height: 300px;">
                    <canvas id="statusChart"></canvas>
                </div>
            </div>
            
            <!-- Daily Trend -->
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">日次推移</h3>
                <div style="height: 300px;">
                    <canvas id="trendChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Detailed Tables -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- By Client -->
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b">
                    <h3 class="text-lg font-semibold text-gray-900">顧問先別サマリー</h3>
                </div>
                <div class="overflow-x-auto max-h-96">
                    <table class="w-full">
                        <thead class="bg-gray-50 sticky top-0">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">顧問先</th>
                                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500">タスク数</th>
                                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500">完了</th>
                                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500">進捗</th>
                            </tr>
                        </thead>
                        <tbody id="clientSummaryTable" class="divide-y divide-gray-200">
                            <!-- Data will be inserted here -->
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- By Staff -->
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b">
                    <h3 class="text-lg font-semibold text-gray-900">スタッフ別サマリー</h3>
                </div>
                <div class="overflow-x-auto max-h-96">
                    <table class="w-full">
                        <thead class="bg-gray-50 sticky top-0">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500">担当者</th>
                                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500">タスク数</th>
                                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500">完了</th>
                                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500">効率</th>
                            </tr>
                        </thead>
                        <tbody id="staffSummaryTable" class="divide-y divide-gray-200">
                            <!-- Data will be inserted here -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        let currentReport = null;
        let statusChart = null;
        let trendChart = null;
        
        // Initialize
        async function init() {
            // Set default month
            document.getElementById('reportMonth').value = new Date().toISOString().slice(0, 7);
            
            // Load clients for selector
            await loadClients();
            
            // Generate initial report
            await generateReport();
        }
        
        async function loadClients() {
            try {
                const res = await axios.get('/api/clients');
                const clients = res.data.clients;
                
                const select = document.getElementById('reportClient');
                select.innerHTML = '<option value="">選択してください</option>' + 
                    clients.map(c => \`<option value="\${c.id}">\${c.name}</option>\`).join('');
            } catch (error) {
                console.error('Failed to load clients:', error);
            }
        }
        
        function handleReportTypeChange() {
            const type = document.getElementById('reportType').value;
            document.getElementById('monthSelector').style.display = type === 'client' ? 'none' : 'block';
            document.getElementById('clientSelector').style.display = type === 'client' ? 'block' : 'none';
        }
        
        async function generateReport() {
            const type = document.getElementById('reportType').value;
            const month = document.getElementById('reportMonth').value;
            const [year, monthNum] = month.split('-');
            
            try {
                let reportData;
                
                if (type === 'monthly') {
                    const res = await axios.get(\`/api/reports/monthly?year=\${year}&month=\${monthNum}\`);
                    reportData = res.data;
                    displayMonthlyReport(reportData);
                } else if (type === 'client') {
                    const clientId = document.getElementById('reportClient').value;
                    if (!clientId) {
                        alert('顧問先を選択してください');
                        return;
                    }
                    const res = await axios.get(\`/api/reports/client/\${clientId}\`);
                    reportData = res.data;
                    displayClientReport(reportData);
                }
                
                currentReport = reportData;
            } catch (error) {
                console.error('Failed to generate report:', error);
                alert('レポート生成に失敗しました');
            }
        }
        
        function displayMonthlyReport(data) {
            // Update summary cards
            document.getElementById('totalTasks').textContent = data.summary.total_tasks || 0;
            document.getElementById('completionRate').textContent = 
                Math.round((data.summary.completed_tasks / data.summary.total_tasks) * 100) + '%';
            document.getElementById('overdueTasks').textContent = data.summary.overdue_tasks || 0;
            document.getElementById('overdueRate').textContent = 
                Math.round((data.summary.overdue_tasks / data.summary.total_tasks) * 100) + '%';
            
            const efficiency = data.summary.total_estimated_hours > 0 
                ? Math.round((data.summary.total_actual_hours / data.summary.total_estimated_hours) * 100)
                : 100;
            document.getElementById('efficiencyRate').textContent = efficiency + '%';
            
            // Update status chart
            if (statusChart) statusChart.destroy();
            const ctx1 = document.getElementById('statusChart').getContext('2d');
            statusChart = new Chart(ctx1, {
                type: 'doughnut',
                data: {
                    labels: ['完了', '進行中', '未着手', '遅延'],
                    datasets: [{
                        data: [
                            data.summary.completed_tasks,
                            data.summary.in_progress_tasks,
                            data.summary.pending_tasks,
                            data.summary.overdue_tasks
                        ],
                        backgroundColor: ['#00aa44', '#0066cc', '#666666', '#ff4444']
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
            
            // Update trend chart
            if (trendChart) trendChart.destroy();
            const ctx2 = document.getElementById('trendChart').getContext('2d');
            trendChart = new Chart(ctx2, {
                type: 'line',
                data: {
                    labels: data.dailyTrend.map(d => d.date.split('-')[2] + '日'),
                    datasets: [{
                        label: '完了率',
                        data: data.dailyTrend.map(d => d.completion_rate),
                        borderColor: '#0066cc',
                        backgroundColor: 'rgba(0, 102, 204, 0.1)',
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: value => value + '%'
                            }
                        }
                    }
                }
            });
            
            // Update client table
            const clientTable = document.getElementById('clientSummaryTable');
            clientTable.innerHTML = data.byClient.map(client => \`
                <tr>
                    <td class="px-4 py-2 text-sm">\${client.client_name}</td>
                    <td class="px-4 py-2 text-sm text-center">\${client.task_count}</td>
                    <td class="px-4 py-2 text-sm text-center">\${client.completed_count}</td>
                    <td class="px-4 py-2 text-sm text-center">
                        <div class="flex items-center justify-center">
                            <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div class="bg-blue-600 h-2 rounded-full" style="width: \${client.avg_progress}%"></div>
                            </div>
                            <span class="text-xs">\${client.avg_progress}%</span>
                        </div>
                    </td>
                </tr>
            \`).join('');
            
            // Update staff table
            const staffTable = document.getElementById('staffSummaryTable');
            staffTable.innerHTML = data.byAssignee.map(staff => \`
                <tr>
                    <td class="px-4 py-2 text-sm">\${staff.assignee_name}</td>
                    <td class="px-4 py-2 text-sm text-center">\${staff.task_count}</td>
                    <td class="px-4 py-2 text-sm text-center">\${staff.completed_count}</td>
                    <td class="px-4 py-2 text-sm text-center">
                        <span class="\${staff.efficiency_rate > 100 ? 'text-red-600' : 'text-green-600'}">
                            \${staff.efficiency_rate}%
                        </span>
                    </td>
                </tr>
            \`).join('');
        }
        
        async function exportReport(format) {
            const type = document.getElementById('reportType').value;
            const month = document.getElementById('reportMonth').value;
            const [year, monthNum] = month.split('-');
            
            if (format === 'csv') {
                window.location.href = \`/api/reports/export/csv?type=\${type}&year=\${year}&month=\${monthNum}\`;
            } else if (format === 'pdf') {
                alert('PDF出力機能は準備中です');
            }
        }
        
        // Initialize on page load
        document.addEventListener('DOMContentLoaded', init);
    </script>
</body>
</html>
  `
}
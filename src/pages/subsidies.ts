/**
 * Subsidies Page
 * 助成金申請管理画面
 */

export function getSubsidiesPage(userName: string): string {
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>助成金管理 - 労務管理タスクシステム</title>
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
                            <a href="/projects" class="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                <i class="fas fa-project-diagram mr-1"></i> プロジェクト
                            </a>
                            <a href="/subsidies" class="border-b-2 border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                <i class="fas fa-coins mr-1"></i> 助成金
                            </a>
                            <a href="/clients" class="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                <i class="fas fa-building mr-1"></i> 顧客管理
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
            <!-- タブナビゲーション -->
            <div class="border-b border-gray-200 mb-6">
                <nav class="-mb-px flex space-x-8">
                    <button onclick="switchTab('applications')" class="tab-btn active" data-tab="applications">
                        <i class="fas fa-clipboard-list mr-2"></i>
                        申請管理
                    </button>
                    <button onclick="switchTab('subsidies')" class="tab-btn" data-tab="subsidies">
                        <i class="fas fa-search mr-2"></i>
                        助成金検索
                    </button>
                    <button onclick="switchTab('alerts')" class="tab-btn" data-tab="alerts">
                        <i class="fas fa-bell mr-2"></i>
                        期限アラート
                    </button>
                    <button onclick="switchTab('database')" class="tab-btn" data-tab="database">
                        <i class="fas fa-database mr-2"></i>
                        助成金DB
                    </button>
                    <button onclick="switchTab('admin')" class="tab-btn" data-tab="admin">
                        <i class="fas fa-cogs mr-2"></i>
                        管理機能
                    </button>
                </nav>
            </div>

            <!-- 申請管理タブ -->
            <div id="applications-tab" class="tab-content">
                <div class="mb-6 flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-900">申請プロジェクト一覧</h2>
                    <button onclick="showNewApplicationModal()" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>新規申請
                    </button>
                </div>

                <!-- 申請ステータス統計 -->
                <div class="grid grid-cols-4 gap-4 mb-6">
                    <div class="bg-white rounded-lg shadow p-4">
                        <div class="text-sm text-gray-600">準備中</div>
                        <div class="text-2xl font-bold text-yellow-600" id="preparingCount">0</div>
                    </div>
                    <div class="bg-white rounded-lg shadow p-4">
                        <div class="text-sm text-gray-600">申請済み</div>
                        <div class="text-2xl font-bold text-blue-600" id="submittedCount">0</div>
                    </div>
                    <div class="bg-white rounded-lg shadow p-4">
                        <div class="text-sm text-gray-600">審査中</div>
                        <div class="text-2xl font-bold text-orange-600" id="underReviewCount">0</div>
                    </div>
                    <div class="bg-white rounded-lg shadow p-4">
                        <div class="text-sm text-gray-600">承認済み</div>
                        <div class="text-2xl font-bold text-green-600" id="approvedCount">0</div>
                    </div>
                </div>

                <!-- 申請一覧 -->
                <div id="applicationsList" class="space-y-4">
                    <!-- 申請カードがここに表示されます -->
                </div>
            </div>

            <!-- 助成金検索タブ -->
            <div id="subsidies-tab" class="tab-content hidden">
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">利用可能な助成金</h2>
                    
                    <!-- 検索フィルター -->
                    <div class="bg-white rounded-lg shadow p-4 mb-6">
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700">カテゴリ</label>
                                <select id="categoryFilter" onchange="searchSubsidies()" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                    <option value="">すべて</option>
                                    <option value="雇用系">雇用系</option>
                                    <option value="育成系">育成系</option>
                                    <option value="福祉系">福祉系</option>
                                    <option value="創業系">創業系</option>
                                    <option value="設備投資系">設備投資系</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">最低金額</label>
                                <input type="number" id="minAmountFilter" onchange="searchSubsidies()" 
                                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" 
                                    placeholder="100000">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700">顧客</label>
                                <select id="clientFilterForSearch" onchange="searchSubsidies()" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                    <option value="">すべて</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- 助成金リスト -->
                    <div id="subsidiesList" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- 助成金カードがここに表示されます -->
                    </div>
                </div>
            </div>

            <!-- 期限アラートタブ -->
            <div id="alerts-tab" class="tab-content hidden">
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">期限アラート</h2>
                    
                    <div id="alertsList" class="space-y-3">
                        <!-- アラートがここに表示されます -->
                    </div>
                </div>
            </div>

            <!-- 助成金DBタブ -->
            <div id="database-tab" class="tab-content hidden">
                <div class="mb-6 flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-900">助成金データベース</h2>
                    <button onclick="showAddSubsidyModal()" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                        <i class="fas fa-plus mr-2"></i>助成金登録
                    </button>
                </div>

                <div id="subsidyDatabaseList" class="bg-white rounded-lg shadow overflow-hidden">
                    <!-- 助成金マスターリストがここに表示されます -->
                </div>
            </div>

            <!-- 管理機能タブ -->
            <div id="admin-tab" class="tab-content hidden">
                <div class="mb-6">
                    <h2 class="text-2xl font-bold text-gray-900 mb-2">助成金情報管理</h2>
                    <p class="text-gray-600">外部ソースから最新の助成金情報を取得・更新します</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- 厚労省から取得 -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="mb-4">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">
                                <i class="fas fa-building text-blue-600 mr-2"></i>
                                厚生労働省
                            </h3>
                            <p class="text-sm text-gray-600">雇用関係の助成金情報を取得</p>
                        </div>
                        <button onclick="fetchMHLWSubsidies()" class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            <i class="fas fa-sync-alt mr-2"></i>
                            厚労省から更新
                        </button>
                        <div id="mhlwStatus" class="mt-4 text-sm"></div>
                    </div>

                    <!-- 全ソースから取得 -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="mb-4">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">
                                <i class="fas fa-globe text-green-600 mr-2"></i>
                                全ソース統合
                            </h3>
                            <p class="text-sm text-gray-600">すべての情報源から一括取得</p>
                        </div>
                        <button onclick="fetchAllSubsidies()" class="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                            <i class="fas fa-download mr-2"></i>
                            全ソース一括更新
                        </button>
                        <div id="allSourcesStatus" class="mt-4 text-sm"></div>
                    </div>

                    <!-- 外部検索 -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="mb-4">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">
                                <i class="fas fa-search text-purple-600 mr-2"></i>
                                外部検索
                            </h3>
                            <p class="text-sm text-gray-600">キーワードで外部データベースを検索</p>
                        </div>
                        <div class="space-y-3">
                            <input type="text" id="externalSearchQuery" placeholder="検索キーワード" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-md">
                            <select id="searchOrganization" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                                <option value="">すべての機関</option>
                                <option value="mhlw">厚生労働省</option>
                                <option value="jgrants">jGrants</option>
                            </select>
                            <button onclick="searchExternalSubsidies()" class="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                                <i class="fas fa-search mr-2"></i>
                                検索実行
                            </button>
                        </div>
                        <div id="externalSearchResults" class="mt-4"></div>
                    </div>

                    <!-- 更新履歴 -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="mb-4">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">
                                <i class="fas fa-history text-orange-600 mr-2"></i>
                                更新履歴
                            </h3>
                            <p class="text-sm text-gray-600">最近の更新状況</p>
                        </div>
                        <div id="updateHistory" class="space-y-2 max-h-48 overflow-y-auto">
                            <p class="text-sm text-gray-500">更新履歴はまだありません</p>
                        </div>
                    </div>
                </div>

                <!-- 自動更新設定 -->
                <div class="mt-6 bg-yellow-50 rounded-lg p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-3">
                        <i class="fas fa-clock text-yellow-600 mr-2"></i>
                        自動更新設定
                    </h3>
                    <p class="text-sm text-gray-600 mb-3">
                        定期的に外部ソースから助成金情報を自動取得します（Cloudflare Scheduled Events使用）
                    </p>
                    <div class="text-sm text-gray-500">
                        <p>※ 本番環境では、Cloudflare WorkersのCron Triggersを設定してください</p>
                        <code class="block mt-2 p-2 bg-gray-100 rounded">
                            wrangler.toml: [triggers] crons = ["0 6 * * MON"]
                        </code>
                    </div>
                </div>
            </div>
        </div>

        <!-- 新規申請モーダル -->
        <div id="newApplicationModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
                <h3 class="text-lg font-medium text-gray-900 mb-4">新規助成金申請</h3>
                <form onsubmit="createApplication(event)">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="col-span-2">
                            <label class="block text-sm font-medium text-gray-700">助成金選択</label>
                            <select id="subsidySelect" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                <option value="">選択してください</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700">顧客</label>
                            <select id="clientSelect" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                <option value="">選択してください</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700">申請金額</label>
                            <input type="number" id="amountRequested" required 
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700">提出期限</label>
                            <input type="date" id="submissionDeadline" required 
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        </div>
                        
                        <div class="col-span-2">
                            <label class="block text-sm font-medium text-gray-700">備考</label>
                            <textarea id="applicationNotes" rows="3" 
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
                        </div>
                    </div>
                    
                    <div class="mt-6 flex justify-end space-x-3">
                        <button type="button" onclick="closeNewApplicationModal()" 
                            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                            キャンセル
                        </button>
                        <button type="submit" 
                            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            作成
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- 申請詳細モーダル -->
        <div id="applicationDetailModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg w-full max-w-6xl max-h-screen overflow-y-auto">
                <div id="applicationDetailContent">
                    <!-- 詳細がここに表示されます -->
                </div>
            </div>
        </div>

        <style>
            .tab-btn {
                @apply py-2 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300;
            }
            .tab-btn.active {
                @apply border-blue-500 text-blue-600;
            }
            .progress-bar {
                @apply bg-gray-200 rounded-full h-2;
            }
            .progress-fill {
                @apply bg-blue-600 h-2 rounded-full transition-all duration-300;
            }
        </style>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let subsidies = [];
            let applications = [];
            let clients = [];
            
            // 初期化
            document.addEventListener('DOMContentLoaded', () => {
                loadApplications();
                loadSubsidies();
                loadClients();
                loadAlerts();
            });
            
            // タブ切り替え
            function switchTab(tabName) {
                document.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.tab === tabName) {
                        btn.classList.add('active');
                    }
                });
                
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.add('hidden');
                });
                document.getElementById(tabName + '-tab').classList.remove('hidden');
                
                // タブに応じてデータ読み込み
                if (tabName === 'applications') {
                    loadApplications();
                } else if (tabName === 'subsidies') {
                    searchSubsidies();
                } else if (tabName === 'alerts') {
                    loadAlerts();
                } else if (tabName === 'database') {
                    loadSubsidyDatabase();
                }
            }
            
            // 申請一覧読み込み
            async function loadApplications() {
                try {
                    const response = await axios.get('/api/subsidies/applications');
                    applications = response.data.applications;
                    displayApplications(applications);
                    updateStatistics(applications);
                } catch (error) {
                    console.error('Failed to load applications:', error);
                }
            }
            
            // 申請表示
            function displayApplications(appList) {
                const container = document.getElementById('applicationsList');
                
                if (appList.length === 0) {
                    container.innerHTML = '<div class="text-center text-gray-500 py-8">申請プロジェクトがありません</div>';
                    return;
                }
                
                container.innerHTML = appList.map(app => {
                    const statusColors = {
                        planning: 'bg-gray-100 text-gray-800',
                        preparing: 'bg-yellow-100 text-yellow-800',
                        document_check: 'bg-orange-100 text-orange-800',
                        submitted: 'bg-blue-100 text-blue-800',
                        under_review: 'bg-purple-100 text-purple-800',
                        approved: 'bg-green-100 text-green-800',
                        rejected: 'bg-red-100 text-red-800',
                        received: 'bg-teal-100 text-teal-800',
                        cancelled: 'bg-gray-100 text-gray-800'
                    };
                    
                    const statusLabels = {
                        planning: '計画中',
                        preparing: '準備中',
                        document_check: '書類確認中',
                        submitted: '申請済み',
                        under_review: '審査中',
                        approved: '承認',
                        rejected: '却下',
                        received: '受給済み',
                        cancelled: '取り下げ'
                    };
                    
                    const daysUntilDeadline = app.submission_deadline 
                        ? Math.ceil((new Date(app.submission_deadline) - new Date()) / (1000 * 60 * 60 * 24))
                        : null;
                    
                    return \`
                        <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer" 
                             onclick="showApplicationDetail(\${app.id})">
                            <div class="p-6">
                                <div class="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 class="text-lg font-medium text-gray-900">\${escapeHtml(app.subsidy_name)}</h3>
                                        <p class="text-sm text-gray-600 mt-1">
                                            <i class="fas fa-building mr-1"></i>\${escapeHtml(app.client_name)}
                                        </p>
                                    </div>
                                    <span class="px-3 py-1 text-xs rounded-full \${statusColors[app.status]}">
                                        \${statusLabels[app.status]}
                                    </span>
                                </div>
                                
                                <div class="grid grid-cols-3 gap-4 mb-4 text-sm">
                                    <div>
                                        <div class="text-gray-600">申請金額</div>
                                        <div class="font-medium">¥\${(app.amount_requested || 0).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div class="text-gray-600">最大支給額</div>
                                        <div class="font-medium">¥\${(app.max_amount || 0).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div class="text-gray-600">提出期限</div>
                                        <div class="font-medium \${daysUntilDeadline && daysUntilDeadline <= 7 ? 'text-red-600' : ''}">
                                            \${app.submission_deadline ? formatDate(app.submission_deadline) : '-'}
                                            \${daysUntilDeadline !== null && daysUntilDeadline >= 0 ? \` (\${daysUntilDeadline}日)\` : ''}
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="mb-2">
                                    <div class="flex justify-between text-sm text-gray-600 mb-1">
                                        <span>進捗</span>
                                        <span>\${app.progress || 0}%</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: \${app.progress || 0}%"></div>
                                    </div>
                                </div>
                                
                                \${app.application_number ? \`
                                    <div class="mt-3 text-sm text-gray-600">
                                        <i class="fas fa-hashtag mr-1"></i>申請番号: \${escapeHtml(app.application_number)}
                                    </div>
                                \` : ''}
                            </div>
                        </div>
                    \`;
                }).join('');
            }
            
            // 統計更新
            function updateStatistics(appList) {
                const counts = {
                    preparing: 0,
                    submitted: 0,
                    under_review: 0,
                    approved: 0
                };
                
                appList.forEach(app => {
                    if (app.status === 'planning' || app.status === 'preparing' || app.status === 'document_check') {
                        counts.preparing++;
                    } else if (app.status === 'submitted') {
                        counts.submitted++;
                    } else if (app.status === 'under_review') {
                        counts.under_review++;
                    } else if (app.status === 'approved' || app.status === 'received') {
                        counts.approved++;
                    }
                });
                
                document.getElementById('preparingCount').textContent = counts.preparing;
                document.getElementById('submittedCount').textContent = counts.submitted;
                document.getElementById('underReviewCount').textContent = counts.under_review;
                document.getElementById('approvedCount').textContent = counts.approved;
            }
            
            // 助成金検索
            async function searchSubsidies() {
                const category = document.getElementById('categoryFilter').value;
                const minAmount = document.getElementById('minAmountFilter').value;
                const clientId = document.getElementById('clientFilterForSearch').value;
                
                try {
                    const params = new URLSearchParams();
                    if (category) params.append('category', category);
                    if (minAmount) params.append('minAmount', minAmount);
                    if (clientId) params.append('clientId', clientId);
                    
                    const response = await axios.get('/api/subsidies/search?' + params);
                    displaySubsidies(response.data.subsidies);
                } catch (error) {
                    console.error('Failed to search subsidies:', error);
                }
            }
            
            // 助成金表示
            function displaySubsidies(subsidyList) {
                const container = document.getElementById('subsidiesList');
                
                if (subsidyList.length === 0) {
                    container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">該当する助成金がありません</div>';
                    return;
                }
                
                container.innerHTML = subsidyList.map(subsidy => \`
                    <div class="bg-white rounded-lg shadow p-6">
                        <h4 class="font-medium text-gray-900 mb-2">\${escapeHtml(subsidy.name)}</h4>
                        <div class="text-sm text-gray-600 space-y-2">
                            <div><i class="fas fa-tag mr-2"></i>\${escapeHtml(subsidy.category)}</div>
                            <div><i class="fas fa-building mr-2"></i>\${escapeHtml(subsidy.managingOrganization)}</div>
                            <div><i class="fas fa-yen-sign mr-2"></i>最大 ¥\${(subsidy.maxAmount || 0).toLocaleString()}</div>
                            <div><i class="fas fa-percentage mr-2"></i>助成率 \${subsidy.subsidyRate}%</div>
                            \${subsidy.applicationEndDate ? \`
                                <div class="text-red-600">
                                    <i class="fas fa-calendar-times mr-2"></i>期限: \${formatDate(subsidy.applicationEndDate)}
                                </div>
                            \` : ''}
                        </div>
                        <button onclick="selectSubsidyForApplication(\${subsidy.id})" 
                            class="mt-4 w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                            この助成金を申請
                        </button>
                    </div>
                \`).join('');
            }
            
            // 期限アラート読み込み
            async function loadAlerts() {
                try {
                    const response = await axios.get('/api/subsidies/alerts?days=30');
                    displayAlerts(response.data.alerts);
                } catch (error) {
                    console.error('Failed to load alerts:', error);
                }
            }
            
            // アラート表示
            function displayAlerts(alertList) {
                const container = document.getElementById('alertsList');
                
                if (alertList.length === 0) {
                    container.innerHTML = '<div class="text-center text-gray-500 py-8">期限が近い申請はありません</div>';
                    return;
                }
                
                container.innerHTML = alertList.map(alert => {
                    const urgencyClass = alert.daysRemaining <= 7 ? 'border-red-500 bg-red-50' : 
                                        alert.daysRemaining <= 14 ? 'border-orange-500 bg-orange-50' : 
                                        'border-yellow-500 bg-yellow-50';
                    
                    return \`
                        <div class="border-l-4 \${urgencyClass} p-4 rounded">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h4 class="font-medium text-gray-900">\${escapeHtml(alert.subsidyName)}</h4>
                                    <p class="text-sm text-gray-600 mt-1">
                                        <i class="fas fa-building mr-1"></i>\${escapeHtml(alert.clientName)}
                                    </p>
                                </div>
                                <div class="text-right">
                                    <div class="text-2xl font-bold \${alert.daysRemaining <= 7 ? 'text-red-600' : 'text-gray-900'}">
                                        \${alert.daysRemaining}日
                                    </div>
                                    <div class="text-sm text-gray-600">\${formatDate(alert.deadline)}</div>
                                </div>
                            </div>
                            <button onclick="showApplicationDetail(\${alert.applicationId})" 
                                class="mt-3 text-sm text-blue-600 hover:text-blue-800">
                                <i class="fas fa-arrow-right mr-1"></i>詳細を見る
                            </button>
                        </div>
                    \`;
                }).join('');
            }
            
            // 申請作成
            async function createApplication(event) {
                event.preventDefault();
                
                try {
                    const response = await axios.post('/api/subsidies/applications', {
                        subsidyId: parseInt(document.getElementById('subsidySelect').value),
                        clientId: parseInt(document.getElementById('clientSelect').value),
                        amountRequested: parseInt(document.getElementById('amountRequested').value),
                        submissionDeadline: document.getElementById('submissionDeadline').value,
                        notes: document.getElementById('applicationNotes').value
                    });
                    
                    alert(response.data.message);
                    closeNewApplicationModal();
                    loadApplications();
                } catch (error) {
                    console.error('Failed to create application:', error);
                    alert('申請の作成に失敗しました: ' + (error.response?.data?.message || error.message));
                }
            }
            
            // 助成金読み込み
            async function loadSubsidies() {
                try {
                    const response = await axios.get('/api/subsidies');
                    subsidies = response.data.subsidies;
                    
                    const select = document.getElementById('subsidySelect');
                    select.innerHTML = '<option value="">選択してください</option>' +
                        subsidies.map(s => \`<option value="\${s.id}">\${s.name} (最大¥\${(s.max_amount || 0).toLocaleString()})</option>\`).join('');
                } catch (error) {
                    console.error('Failed to load subsidies:', error);
                }
            }
            
            // 顧客読み込み
            async function loadClients() {
                try {
                    const response = await axios.get('/api/clients');
                    clients = response.data.clients;
                    
                    const selects = document.querySelectorAll('#clientSelect, #clientFilterForSearch');
                    selects.forEach(select => {
                        const currentValue = select.value;
                        if (select.id === 'clientFilterForSearch') {
                            select.innerHTML = '<option value="">すべて</option>';
                        } else {
                            select.innerHTML = '<option value="">選択してください</option>';
                        }
                        select.innerHTML += clients.map(c => \`<option value="\${c.id}">\${c.name}</option>\`).join('');
                        if (currentValue) select.value = currentValue;
                    });
                } catch (error) {
                    console.error('Failed to load clients:', error);
                }
            }
            
            // モーダル操作
            function showNewApplicationModal() {
                document.getElementById('newApplicationModal').classList.remove('hidden');
            }
            
            function closeNewApplicationModal() {
                document.getElementById('newApplicationModal').classList.add('hidden');
                document.querySelector('#newApplicationModal form').reset();
            }
            
            function selectSubsidyForApplication(subsidyId) {
                document.getElementById('subsidySelect').value = subsidyId;
                showNewApplicationModal();
                switchTab('applications');
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
            
            function logout() {
                if (confirm('ログアウトしますか？')) {
                    window.location.href = '/logout';
                }
            }

            // 管理機能 - 厚労省から取得
            async function fetchMHLWSubsidies() {
                const statusEl = document.getElementById('mhlwStatus');
                statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 取得中...';
                statusEl.className = 'mt-4 text-sm text-blue-600';
                
                try {
                    const response = await axios.post('/api/subsidies/fetch-updates');
                    
                    statusEl.innerHTML = \`
                        <i class="fas fa-check-circle text-green-600"></i> 
                        更新完了：\${response.data.updated_count}件
                    \`;
                    statusEl.className = 'mt-4 text-sm text-green-600';
                    
                    // 更新履歴に追加
                    addUpdateHistory('厚生労働省', response.data.updated_count);
                    
                    // リストを更新
                    loadSubsidyDatabase();
                } catch (error) {
                    statusEl.innerHTML = \`
                        <i class="fas fa-exclamation-circle text-red-600"></i> 
                        エラー：\${error.response?.data?.message || 'ネットワークエラー'}
                    \`;
                    statusEl.className = 'mt-4 text-sm text-red-600';
                }
            }

            // 管理機能 - 全ソース取得
            async function fetchAllSubsidies() {
                const statusEl = document.getElementById('allSourcesStatus');
                statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 全ソースから取得中...';
                statusEl.className = 'mt-4 text-sm text-blue-600';
                
                try {
                    const response = await axios.post('/api/subsidies/fetch-all');
                    
                    statusEl.innerHTML = \`
                        <i class="fas fa-check-circle text-green-600"></i> 
                        更新完了：合計\${response.data.total_count}件
                        <div class="mt-2 text-xs">
                            厚労省: \${response.data.sources.mhlw}件 | 
                            経産省: \${response.data.sources.meti}件 | 
                            その他: \${response.data.sources.other}件
                        </div>
                    \`;
                    statusEl.className = 'mt-4 text-sm text-green-600';
                    
                    // 更新履歴に追加
                    addUpdateHistory('全ソース', response.data.total_count);
                    
                    // リストを更新
                    loadSubsidyDatabase();
                } catch (error) {
                    statusEl.innerHTML = \`
                        <i class="fas fa-exclamation-circle text-red-600"></i> 
                        エラー：\${error.response?.data?.message || 'ネットワークエラー'}
                    \`;
                    statusEl.className = 'mt-4 text-sm text-red-600';
                }
            }

            // 管理機能 - 外部検索
            async function searchExternalSubsidies() {
                const query = document.getElementById('externalSearchQuery').value;
                const org = document.getElementById('searchOrganization').value;
                
                if (!query) {
                    alert('検索キーワードを入力してください');
                    return;
                }
                
                const resultsEl = document.getElementById('externalSearchResults');
                resultsEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 検索中...';
                
                try {
                    const response = await axios.get('/api/subsidies/search-external', {
                        params: { q: query, org: org }
                    });
                    
                    if (response.data.results.length === 0) {
                        resultsEl.innerHTML = '<p class="text-gray-500">検索結果がありません</p>';
                        return;
                    }
                    
                    resultsEl.innerHTML = \`
                        <div class="mt-4">
                            <p class="text-sm text-gray-600 mb-2">
                                \${response.data.total_count}件見つかりました
                            </p>
                            <div class="space-y-2 max-h-64 overflow-y-auto">
                                \${response.data.results.map(subsidy => \`
                                    <div class="p-3 bg-gray-50 rounded">
                                        <h4 class="font-medium text-sm">\${escapeHtml(subsidy.name)}</h4>
                                        <p class="text-xs text-gray-600 mt-1">\${escapeHtml(subsidy.managing_organization)}</p>
                                        \${subsidy.url ? \`<a href="\${subsidy.url}" target="_blank" class="text-xs text-blue-600 hover:underline">詳細を見る</a>\` : ''}
                                    </div>
                                \`).join('')}
                            </div>
                        </div>
                    \`;
                } catch (error) {
                    resultsEl.innerHTML = \`
                        <p class="text-red-600 text-sm">
                            検索エラー：\${error.response?.data?.message || 'ネットワークエラー'}
                        </p>
                    \`;
                }
            }

            // 助成金データベース読み込み
            async function loadSubsidyDatabase() {
                try {
                    const response = await axios.get('/api/subsidies/database');
                    const subsidies = response.data.subsidies;
                    
                    const container = document.getElementById('subsidyDatabaseList');
                    
                    if (subsidies.length === 0) {
                        container.innerHTML = \`
                            <div class="p-6 text-center text-gray-500">
                                助成金データがありません。管理機能タブから外部データを取得してください。
                            </div>
                        \`;
                        return;
                    }
                    
                    container.innerHTML = \`
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">助成金名</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">カテゴリ</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">管理機関</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最大金額</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申請数</th>
                                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                \${subsidies.map(subsidy => \`
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <div class="text-sm font-medium text-gray-900">\${escapeHtml(subsidy.name)}</div>
                                            \${subsidy.url ? \`<a href="\${subsidy.url}" target="_blank" class="text-xs text-blue-600 hover:underline">詳細を見る</a>\` : ''}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${escapeHtml(subsidy.category)}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${escapeHtml(subsidy.managing_organization)}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            \${subsidy.max_amount ? '¥' + subsidy.max_amount.toLocaleString() : '-'}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${subsidy.application_count}件</td>
                                        <td class="px-6 py-4 whitespace-nowrap">
                                            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                \${subsidy.status === 'active' ? 'bg-green-100 text-green-800' : 
                                                  subsidy.status === 'expired' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}">
                                                \${subsidy.status === 'active' ? '募集中' : 
                                                  subsidy.status === 'expired' ? '期限切れ' : '常時募集'}
                                            </span>
                                        </td>
                                    </tr>
                                \`).join('')}
                            </tbody>
                        </table>
                    \`;
                } catch (error) {
                    console.error('Failed to load subsidy database:', error);
                    document.getElementById('subsidyDatabaseList').innerHTML = \`
                        <div class="p-6 text-center text-red-500">
                            データベースの読み込みに失敗しました
                        </div>
                    \`;
                }
            }

            // 申請詳細表示
            async function showApplicationDetail(applicationId) {
                try {
                    const response = await axios.get(\`/api/subsidies/applications/\${applicationId}\`);
                    const app = response.data.application;
                    
                    const modal = document.getElementById('applicationDetailModal');
                    const content = document.getElementById('applicationDetailContent');
                    
                    const progressPercentage = app.checklist.length > 0 
                        ? Math.round((app.checklist.filter(item => item.is_completed).length / app.checklist.length) * 100)
                        : 0;
                    
                    content.innerHTML = \`
                        <div class="p-6">
                            <div class="flex justify-between items-start mb-6">
                                <div>
                                    <h2 class="text-2xl font-bold text-gray-900">\${escapeHtml(app.subsidy_name)}</h2>
                                    <p class="text-gray-600 mt-1">
                                        <i class="fas fa-building mr-2"></i>\${escapeHtml(app.client_name)}
                                    </p>
                                </div>
                                <button onclick="closeApplicationDetailModal()" class="text-gray-400 hover:text-gray-600">
                                    <i class="fas fa-times text-xl"></i>
                                </button>
                            </div>
                            
                            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <!-- 基本情報 -->
                                <div class="lg:col-span-2">
                                    <div class="bg-white border rounded-lg p-6 mb-6">
                                        <h3 class="text-lg font-semibold mb-4">申請情報</h3>
                                        <div class="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span class="text-gray-600">申請金額:</span>
                                                <span class="ml-2 font-medium">¥\${(app.amount_requested || 0).toLocaleString()}</span>
                                            </div>
                                            <div>
                                                <span class="text-gray-600">最大支給額:</span>
                                                <span class="ml-2 font-medium">¥\${(app.max_amount || 0).toLocaleString()}</span>
                                            </div>
                                            <div>
                                                <span class="text-gray-600">提出期限:</span>
                                                <span class="ml-2 font-medium">\${app.submission_deadline ? formatDate(app.submission_deadline) : '-'}</span>
                                            </div>
                                            <div>
                                                <span class="text-gray-600">管理機関:</span>
                                                <span class="ml-2 font-medium">\${escapeHtml(app.managing_organization)}</span>
                                            </div>
                                        </div>
                                        
                                        \${app.subsidy_description ? \`
                                            <div class="mt-4">
                                                <span class="text-gray-600">概要:</span>
                                                <p class="mt-1 text-sm text-gray-700">\${escapeHtml(app.subsidy_description)}</p>
                                            </div>
                                        \` : ''}
                                        
                                        \${app.notes ? \`
                                            <div class="mt-4">
                                                <span class="text-gray-600">備考:</span>
                                                <p class="mt-1 text-sm text-gray-700">\${escapeHtml(app.notes)}</p>
                                            </div>
                                        \` : ''}
                                    </div>
                                    
                                    <!-- チェックリスト -->
                                    <div class="bg-white border rounded-lg p-6">
                                        <h3 class="text-lg font-semibold mb-4">
                                            進捗チェックリスト
                                            <span class="text-sm font-normal text-gray-500">(\${progressPercentage}% 完了)</span>
                                        </h3>
                                        <div class="space-y-3">
                                            \${app.checklist.map(item => \`
                                                <div class="flex items-center">
                                                    <input type="checkbox" \${item.is_completed ? 'checked' : ''} 
                                                        class="rounded border-gray-300 text-blue-600 mr-3">
                                                    <span class="\${item.is_completed ? 'line-through text-gray-500' : 'text-gray-900'}">\${escapeHtml(item.item_name)}</span>
                                                    \${item.is_required ? '<span class="ml-2 text-red-500 text-xs">必須</span>' : ''}
                                                </div>
                                            \`).join('')}
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- サイドバー -->
                                <div>
                                    <div class="bg-white border rounded-lg p-6 mb-6">
                                        <h3 class="text-lg font-semibold mb-4">進捗状況</h3>
                                        <div class="mb-4">
                                            <div class="flex justify-between text-sm text-gray-600 mb-1">
                                                <span>完了率</span>
                                                <span>\${progressPercentage}%</span>
                                            </div>
                                            <div class="w-full bg-gray-200 rounded-full h-2">
                                                <div class="bg-blue-600 h-2 rounded-full" style="width: \${progressPercentage}%"></div>
                                            </div>
                                        </div>
                                        
                                        \${app.subsidy_url ? \`
                                            <a href="\${app.subsidy_url}" target="_blank" 
                                                class="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 mb-3">
                                                <i class="fas fa-external-link-alt mr-2"></i>公式サイト
                                            </a>
                                        \` : ''}
                                        
                                        <button onclick="closeApplicationDetailModal()" 
                                            class="block w-full px-4 py-2 bg-gray-600 text-white text-center rounded-md hover:bg-gray-700">
                                            閉じる
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    \`;
                    
                    modal.classList.remove('hidden');
                } catch (error) {
                    console.error('Failed to load application detail:', error);
                    alert('申請詳細の読み込みに失敗しました');
                }
            }

            // 申請詳細モーダルを閉じる
            function closeApplicationDetailModal() {
                document.getElementById('applicationDetailModal').classList.add('hidden');
            }

            // 助成金登録モーダル表示（未実装）
            function showAddSubsidyModal() {
                alert('助成金登録機能は実装予定です');
            }

            // 更新履歴追加
            function addUpdateHistory(source, count) {
                const historyEl = document.getElementById('updateHistory');
                const now = new Date().toLocaleString('ja-JP');
                
                const newEntry = \`
                    <div class="p-2 bg-gray-50 rounded text-sm">
                        <div class="flex justify-between">
                            <span class="font-medium">\${source}</span>
                            <span class="text-gray-500">\${count}件</span>
                        </div>
                        <div class="text-xs text-gray-500 mt-1">\${now}</div>
                    </div>
                \`;
                
                // 既存の「履歴なし」メッセージを削除
                if (historyEl.innerHTML.includes('更新履歴はまだありません')) {
                    historyEl.innerHTML = '';
                }
                
                // 新しいエントリを先頭に追加
                historyEl.insertAdjacentHTML('afterbegin', newEntry);
                
                // 最大10件まで表示
                const entries = historyEl.querySelectorAll('div');
                if (entries.length > 10) {
                    entries[entries.length - 1].remove();
                }
            }
        </script>
    </body>
    </html>
  `
}
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { logger } from 'hono/logger'

// TypeScript types for Cloudflare bindings
type Bindings = {
  DB: D1Database
  KV: KVNamespace
  ENVIRONMENT: string
}

// Create Hono app with bindings
const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('*', logger())
app.use('/api/*', cors({
  origin: ['http://localhost:3000', 'https://*.pages.dev'],
  credentials: true
}))

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))
app.use('/favicon.ico', serveStatic({ root: './public' }))

// Health check endpoint
app.get('/api/health', async (c) => {
  try {
    // Test database connection
    const result = await c.env.DB.prepare('SELECT 1 as test').first()
    return c.json({ 
      status: 'healthy',
      environment: c.env.ENVIRONMENT || 'development',
      database: result ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return c.json({ 
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API Routes: Tasks
app.get('/api/tasks', async (c) => {
  try {
    const { status, assignee_id, client_id, priority } = c.req.query()
    
    let query = `
      SELECT 
        t.*,
        u.name as assignee_name,
        c.name as client_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE 1=1
    `
    const params: any[] = []

    if (status) {
      query += ' AND t.status = ?'
      params.push(status)
    }
    if (assignee_id) {
      query += ' AND t.assignee_id = ?'
      params.push(assignee_id)
    }
    if (client_id) {
      query += ' AND t.client_id = ?'
      params.push(client_id)
    }
    if (priority) {
      query += ' AND t.priority = ?'
      params.push(priority)
    }

    query += ' ORDER BY t.due_date ASC, t.priority DESC'

    const result = await c.env.DB.prepare(query).bind(...params).all()
    return c.json({ tasks: result.results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch tasks' }, 500)
  }
})

app.post('/api/tasks', async (c) => {
  try {
    const body = await c.req.json()
    const { title, description, client_id, assignee_id, task_type, priority, due_date, estimated_hours } = body

    const result = await c.env.DB.prepare(`
      INSERT INTO tasks (title, description, client_id, assignee_id, task_type, priority, due_date, estimated_hours)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(title, description, client_id, assignee_id, task_type, priority, due_date, estimated_hours).run()

    return c.json({ 
      success: true,
      id: result.meta.last_row_id,
      message: 'タスクを作成しました'
    })
  } catch (error) {
    return c.json({ error: 'Failed to create task' }, 500)
  }
})

app.put('/api/tasks/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { status, progress, actual_hours, notes } = body

    // Check if status is changing to update history
    const currentTask = await c.env.DB.prepare('SELECT status FROM tasks WHERE id = ?').bind(id).first()
    
    // Update task
    await c.env.DB.prepare(`
      UPDATE tasks 
      SET status = ?, progress = ?, actual_hours = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, progress, actual_hours, notes, id).run()

    // Add to history if status changed
    if (currentTask && currentTask.status !== status) {
      await c.env.DB.prepare(`
        INSERT INTO task_history (task_id, user_id, action, old_status, new_status)
        VALUES (?, 1, 'updated', ?, ?)
      `).bind(id, currentTask.status, status).run()
    }

    return c.json({ 
      success: true,
      message: 'タスクを更新しました'
    })
  } catch (error) {
    return c.json({ error: 'Failed to update task' }, 500)
  }
})

// API Routes: Clients
app.get('/api/clients', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT 
        c.*,
        COUNT(DISTINCT t.id) as active_tasks,
        COUNT(DISTINCT ctt.template_id) as assigned_templates
      FROM clients c
      LEFT JOIN tasks t ON c.id = t.client_id AND t.status != 'completed'
      LEFT JOIN client_task_templates ctt ON c.id = ctt.client_id AND ctt.is_active = TRUE
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all()
    
    return c.json({ clients: result.results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch clients' }, 500)
  }
})

// API Routes: Users (Staff)
app.get('/api/users', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT 
        u.*,
        COUNT(DISTINCT t.id) as assigned_tasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN t.status = 'overdue' THEN 1 ELSE 0 END) as overdue_tasks
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assignee_id
      GROUP BY u.id
      ORDER BY u.name ASC
    `).all()
    
    return c.json({ users: result.results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch users' }, 500)
  }
})

// API Routes: Dashboard Stats
app.get('/api/dashboard/stats', async (c) => {
  try {
    // Get today's tasks
    const todayTasks = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM tasks 
      WHERE date(due_date) = date('now') 
      AND status != 'completed'
    `).first()

    // Get overdue tasks
    const overdueTasks = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM tasks 
      WHERE date(due_date) < date('now') 
      AND status != 'completed'
    `).first()

    // Get this week's tasks
    const weekTasks = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM tasks 
      WHERE date(due_date) BETWEEN date('now') AND date('now', '+7 days')
      AND status != 'completed'
    `).first()

    // Get task status distribution
    const statusDistribution = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as count 
      FROM tasks 
      GROUP BY status
    `).all()

    // Get workload by assignee
    const workload = await c.env.DB.prepare(`
      SELECT 
        u.id,
        u.name,
        COUNT(t.id) as total_tasks,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN t.status = 'overdue' OR (date(t.due_date) < date('now') AND t.status != 'completed') THEN 1 ELSE 0 END) as overdue
      FROM users u
      LEFT JOIN tasks t ON u.id = t.assignee_id AND t.status != 'completed'
      GROUP BY u.id, u.name
      ORDER BY total_tasks DESC
    `).all()

    return c.json({
      today: todayTasks?.count || 0,
      overdue: overdueTasks?.count || 0,
      thisWeek: weekTasks?.count || 0,
      statusDistribution: statusDistribution.results,
      workload: workload.results
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch dashboard stats' }, 500)
  }
})

// Main page with dashboard
app.get('/', (c) => {
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>社労士事務所タスク管理システム</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .status-pending { background-color: #666666; }
        .status-in-progress { background-color: #0066cc; }
        .status-completed { background-color: #00aa44; }
        .status-overdue { background-color: #ff4444; }
        .priority-urgent { border-left: 4px solid #ff4444; }
        .priority-high { border-left: 4px solid #ff9900; }
        .priority-medium { border-left: 4px solid #0066cc; }
        .priority-low { border-left: 4px solid #666666; }
        
        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .animate-slide-in {
            animation: slideIn 0.3s ease-out;
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center">
                    <h1 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-briefcase mr-2 text-blue-600"></i>
                        社労士事務所タスク管理
                    </h1>
                </div>
                <nav class="flex space-x-4">
                    <button class="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium">
                        <i class="fas fa-home mr-1"></i>ダッシュボード
                    </button>
                    <button class="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium">
                        <i class="fas fa-tasks mr-1"></i>タスク
                    </button>
                    <button class="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium">
                        <i class="fas fa-building mr-1"></i>顧問先
                    </button>
                    <button class="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium">
                        <i class="fas fa-users mr-1"></i>スタッフ
                    </button>
                </nav>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6 animate-slide-in">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm font-medium">今日のタスク</p>
                        <p class="text-3xl font-bold text-gray-900" id="todayCount">-</p>
                    </div>
                    <div class="bg-blue-100 p-3 rounded-full">
                        <i class="fas fa-calendar-day text-blue-600 text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6 animate-slide-in" style="animation-delay: 0.1s">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm font-medium">遅延タスク</p>
                        <p class="text-3xl font-bold text-red-600" id="overdueCount">-</p>
                    </div>
                    <div class="bg-red-100 p-3 rounded-full">
                        <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6 animate-slide-in" style="animation-delay: 0.2s">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm font-medium">今週のタスク</p>
                        <p class="text-3xl font-bold text-gray-900" id="weekCount">-</p>
                    </div>
                    <div class="bg-green-100 p-3 rounded-full">
                        <i class="fas fa-calendar-week text-green-600 text-xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6 animate-slide-in" style="animation-delay: 0.3s">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-gray-500 text-sm font-medium">進行中</p>
                        <p class="text-3xl font-bold text-blue-600" id="inProgressCount">-</p>
                    </div>
                    <div class="bg-blue-100 p-3 rounded-full">
                        <i class="fas fa-spinner text-blue-600 text-xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Dashboard Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Recent Tasks -->
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b">
                    <h2 class="text-lg font-semibold text-gray-900">
                        <i class="fas fa-clock mr-2 text-gray-600"></i>
                        直近のタスク
                    </h2>
                </div>
                <div class="p-6">
                    <div id="taskList" class="space-y-3">
                        <!-- Tasks will be loaded here -->
                        <div class="text-center py-8 text-gray-500">
                            <i class="fas fa-spinner fa-spin text-2xl"></i>
                            <p class="mt-2">読み込み中...</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Workload Chart -->
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b">
                    <h2 class="text-lg font-semibold text-gray-900">
                        <i class="fas fa-chart-bar mr-2 text-gray-600"></i>
                        スタッフ別業務量
                    </h2>
                </div>
                <div class="p-6">
                    <canvas id="workloadChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-8 flex justify-center space-x-4">
            <button class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-lg">
                <i class="fas fa-plus mr-2"></i>新規タスク作成
            </button>
            <button class="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors shadow-lg">
                <i class="fas fa-file-export mr-2"></i>レポート出力
            </button>
        </div>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        // Load dashboard data
        async function loadDashboard() {
            try {
                // Fetch stats
                const statsRes = await axios.get('/api/dashboard/stats');
                const stats = statsRes.data;
                
                // Update counts
                document.getElementById('todayCount').textContent = stats.today;
                document.getElementById('overdueCount').textContent = stats.overdue;
                document.getElementById('weekCount').textContent = stats.thisWeek;
                
                // Find in-progress count
                const inProgress = stats.statusDistribution.find(s => s.status === 'in_progress');
                document.getElementById('inProgressCount').textContent = inProgress ? inProgress.count : 0;
                
                // Draw workload chart
                drawWorkloadChart(stats.workload);
                
                // Fetch and display tasks
                const tasksRes = await axios.get('/api/tasks?status=pending');
                displayTasks(tasksRes.data.tasks);
                
            } catch (error) {
                console.error('Failed to load dashboard:', error);
            }
        }
        
        function displayTasks(tasks) {
            const taskList = document.getElementById('taskList');
            
            if (tasks.length === 0) {
                taskList.innerHTML = '<p class="text-gray-500 text-center py-4">タスクがありません</p>';
                return;
            }
            
            taskList.innerHTML = tasks.slice(0, 5).map(task => {
                const priorityColors = {
                    urgent: 'text-red-600 bg-red-50',
                    high: 'text-orange-600 bg-orange-50',
                    medium: 'text-blue-600 bg-blue-50',
                    low: 'text-gray-600 bg-gray-50'
                };
                
                const priorityLabels = {
                    urgent: '緊急',
                    high: '高',
                    medium: '中',
                    low: '低'
                };
                
                return \`
                    <div class="border rounded-lg p-4 hover:shadow-md transition-shadow priority-\${task.priority}">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <h3 class="font-medium text-gray-900">\${task.title}</h3>
                                <div class="flex items-center mt-2 text-sm text-gray-600">
                                    <i class="fas fa-building mr-1"></i>
                                    <span class="mr-3">\${task.client_name || '-'}</span>
                                    <i class="fas fa-user mr-1"></i>
                                    <span>\${task.assignee_name || '-'}</span>
                                </div>
                            </div>
                            <div class="flex flex-col items-end">
                                <span class="px-2 py-1 text-xs font-medium rounded-full \${priorityColors[task.priority]}">
                                    \${priorityLabels[task.priority]}
                                </span>
                                <span class="text-sm text-gray-600 mt-2">
                                    <i class="fas fa-calendar mr-1"></i>
                                    \${task.due_date ? new Date(task.due_date).toLocaleDateString('ja-JP') : '期限なし'}
                                </span>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');
        }
        
        function drawWorkloadChart(workloadData) {
            const ctx = document.getElementById('workloadChart').getContext('2d');
            
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: workloadData.map(w => w.name),
                    datasets: [
                        {
                            label: '進行中',
                            data: workloadData.map(w => w.in_progress),
                            backgroundColor: '#0066cc',
                            stack: 'stack0'
                        },
                        {
                            label: '未着手',
                            data: workloadData.map(w => w.pending),
                            backgroundColor: '#666666',
                            stack: 'stack0'
                        },
                        {
                            label: '遅延',
                            data: workloadData.map(w => w.overdue),
                            backgroundColor: '#ff4444',
                            stack: 'stack0'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            stacked: true
                        },
                        y: {
                            stacked: true,
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
        
        // Load dashboard on page load
        document.addEventListener('DOMContentLoaded', loadDashboard);
    </script>
</body>
</html>
  `)
})

export default app
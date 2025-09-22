import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { logger } from 'hono/logger'
import { getCookie, setCookie } from 'hono/cookie'
import { generateToken, verifyToken, getUserByEmail, upsertUser } from './lib/auth'
import { GeminiService } from './lib/gemini'
import { clientsRouter } from './routes/clients'
import { reportsRouter } from './routes/reports'
// Simplified router imports
import subsidiesRouter from './routes/subsidies'
import scheduleRouter from './routes/schedule'
import { getClientsPage } from './pages/clients'
import { getReportsPage } from './pages/reports'
import { getSettingsPage } from './pages/settings'
// Simplified imports - removed complex features
import { getSubsidiesPage } from './pages/subsidies'
import { getSchedulePage } from './pages/schedule'
import { getTasksPage } from './pages/tasks'

// TypeScript types for Cloudflare bindings
type Bindings = {
  DB: D1Database
  KV: KVNamespace
  ENVIRONMENT: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  JWT_SECRET: string
  GEMINI_API_KEY: string
  SENDGRID_API_KEY: string
  APP_URL: string
  REDIRECT_URI: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Middleware
app.use('*', logger())
app.use('/api/*', cors({
  origin: (origin) => {
    // Allow requests from Cloudflare Pages domains and localhost
    if (!origin) return true // Allow same-origin requests
    if (origin.includes('pages.dev')) return origin
    if (origin.includes('localhost')) return origin
    if (origin.includes('127.0.0.1')) return origin
    return false
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization']
}))

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))
app.use('/favicon.ico', serveStatic({ root: './public' }))

// Authentication check middleware for API routes
async function checkAuth(c: any, next: any) {
  
  // Check for auth token in cookie or Authorization header
  const token = getCookie(c, 'auth-token') || c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    console.log('No auth token found in request')
    return c.json({ error: 'Unauthorized', message: 'No auth token found' }, 401)
  }
  
  const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-please-change-in-production'
  
  try {
    const payload = await verifyToken(token, jwtSecret)
    
    if (!payload) {
      console.log('Token verification failed')
      return c.json({ error: 'Invalid token', message: 'Token verification failed' }, 401)
    }
    
    c.set('user', payload)
    await next()
  } catch (error) {
    console.error('Auth error:', error)
    return c.json({ 
      error: 'Authentication failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 401)
  }
}

// Public test endpoint for debugging (must be before auth middleware)
app.get('/api/public/test', async (c) => {
  try {
    const testResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM tasks
    `).first()
    
    const dateTestResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM tasks 
      WHERE DATE(created_at) BETWEEN '2025-09-01' AND '2025-09-30'
    `).first()
    
    return c.json({
      success: true,
      basic_test: testResult,
      date_test: dateTestResult,
      message: 'Public test endpoint working'
    })
  } catch (error) {
    console.error('Public test error:', error)
    return c.json({ 
      error: 'Public test failed', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : ''
    }, 500)
  }
})

// Test route for debugging (placed early to check route processing)
app.get('/test-early', (c) => {
  return c.text('Early test route is working!')
})

// Development auth token generator (COMPLETELY DISABLED IN PRODUCTION)
app.get('/api/dev-auth', async (c) => {
  // 🚨 SECURITY: Completely disabled in production
  return c.json({ 
    error: 'Forbidden', 
    message: 'Development authentication is disabled in production. Please use Google OAuth.' 
  }, 403)
  
  try {
    const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-please-change-in-production'
    const testUser = {
      id: 1,
      email: 'tanaka@sharoushi.com', 
      name: '田中 太郎',
      role: 'admin'
    }
    
    const token = await generateToken(testUser, jwtSecret)
    
    // Set cookie for testing
    setCookie(c, 'auth-token', token, {
      httpOnly: true,
      secure: false, // Allow in dev environment only
      sameSite: 'Lax',
      maxAge: 24 * 60 * 60 // 24 hours
    })
    
    return c.json({
      success: true,
      message: 'Development auth token generated and set as cookie',
      token: token,
      user: testUser,
      redirect: '/'
    })
  } catch (error) {
    return c.json({
      error: 'Failed to generate dev auth token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Development login page (LOCAL DEVELOPMENT ONLY)
app.get('/dev-login', (c) => {
  // 🚨 SECURITY: Only allow in local development environment
  const environment = c.env.ENVIRONMENT || 'production'
  const isLocal = c.req.url.includes('localhost') || c.req.url.includes('127.0.0.1') || environment === 'development'
  
  if (!isLocal) {
    return c.redirect('/login')
  }
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>開発用ログイン - 社労士事務所タスク管理</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center">
    <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                <i class="fas fa-code text-blue-600 text-3xl"></i>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">開発用ログイン</h1>
            <p class="text-gray-600 mt-2">テスト用認証システム</p>
        </div>
        
        <div class="space-y-4">
            <button onclick="devLogin()" class="w-full flex items-center justify-center gap-3 bg-blue-600 text-white rounded-lg px-6 py-3 hover:bg-blue-700 transition-colors">
                <i class="fas fa-user-shield"></i>
                <span class="font-medium">開発用認証でログイン</span>
            </button>
            
            <div class="text-center text-sm text-gray-500 mt-4">
                <p>※ 開発・テスト環境専用</p>
                <p>Google OAuth設定完了後は通常ログインを使用</p>
            </div>
        </div>
    </div>

    <script>
        async function devLogin() {
            try {
                const response = await fetch('/api/dev-auth', {
                    method: 'GET',
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    alert('認証成功！ダッシュボードにリダイレクトします。');
                    window.location.href = '/';
                } else {
                    alert('認証に失敗しました: ' + data.error);
                }
            } catch (error) {
                alert('エラーが発生しました: ' + error.message);
            }
        }
    </script>
</body>
</html>
  `)
})

// Mount routers first (before auth middleware)
// Calendar API (unified schedule functionality)
app.route('/api/schedule', scheduleRouter)
app.route('/api/calendar', scheduleRouter) // Alias for calendar functionality

// Simplified auth middleware - only for core functions
app.use('/api/tasks/*', checkAuth)
app.use('/api/clients/*', checkAuth)
app.use('/api/users/*', checkAuth)
app.use('/api/dashboard/*', checkAuth)
app.use('/api/subsidies/*', checkAuth)

// Core API routes only
app.route('/api/clients', clientsRouter)
app.route('/api/reports', reportsRouter)
app.route('/api/subsidies', subsidiesRouter)

// Debug endpoint to check database tables (public)
app.get('/api/debug/tables', async (c) => {
  try {
    const tables = await c.env.DB.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `).all()
    
    return c.json({
      success: true,
      tables: tables.results || [],
      message: 'Database tables retrieved successfully'
    })
  } catch (error) {
    console.error('Error checking database tables:', error)
    return c.json({ 
      success: false,
      error: 'Failed to check database tables',
      debug: error.message 
    }, 500)
  }
})

// Health check endpoint (public)
app.get('/api/health', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT 1 as test').first()
    
    // Check if dev-auth parameter is present (COMPLETELY DISABLED IN PRODUCTION)
    const devAuth = c.req.query('dev-auth')
    if (devAuth === 'true') {
      return c.json({ 
        status: 'healthy',
        environment: c.env.ENVIRONMENT || 'production',
        database: result ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        devAuth: {
          success: false,
          message: 'Development authentication is completely disabled in production. Please use Google OAuth.'
        }
      })
      
      const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-please-change-in-production'
      const testUser = {
        id: 1,
        email: 'tanaka@sharoushi.com', 
        name: '田中 太郎',
        role: 'admin'
      }
      
      const token = await generateToken(testUser, jwtSecret)
      
      // Set cookie for testing
      setCookie(c, 'auth-token', token, {
        httpOnly: true,
        secure: false, // Allow in dev environment
        sameSite: 'Lax',
        maxAge: 24 * 60 * 60 // 24 hours
      })
      
      return c.json({
        status: 'healthy',
        environment: c.env.ENVIRONMENT || 'development',
        database: result ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
        devAuth: {
          success: true,
          message: 'Development auth token generated and set as cookie',
          user: testUser
        }
      })
    }
    
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

// Debug endpoint (for testing only - remove in production)
app.get('/api/debug/env', (c) => {
  return c.json({
    hasGoogleClientId: !!c.env.GOOGLE_CLIENT_ID,
    hasGoogleClientSecret: !!c.env.GOOGLE_CLIENT_SECRET,
    hasJwtSecret: !!c.env.JWT_SECRET,
    hasRedirectUri: !!c.env.REDIRECT_URI,
    hasGeminiApiKey: !!c.env.GEMINI_API_KEY,
    hasDB: !!c.env.DB,
    redirectUri: c.env.REDIRECT_URI || 'NOT SET',
    environment: c.env.ENVIRONMENT || 'NOT SET',
    // Show first 4 chars of client ID for verification
    clientIdPrefix: c.env.GOOGLE_CLIENT_ID ? c.env.GOOGLE_CLIENT_ID.substring(0, 4) + '...' : 'Using fallback: 1048...',
    usingFallbackClientId: !c.env.GOOGLE_CLIENT_ID
  })
})

// Redirect /auth/login to /login
app.get('/auth/login', (c) => {
  return c.redirect('/login')
})

// Google OAuth login
app.get('/auth/google', (c) => {
  // Use environment variable or fallback to hardcoded value (for production emergency)
  const clientId = c.env.GOOGLE_CLIENT_ID || '1048677720107-sv7suus5umepko9psghfuvs9f9hpdh8r.apps.googleusercontent.com'
  
  // Check if we're using fallback
  if (!c.env.GOOGLE_CLIENT_ID) {
    console.warn('GOOGLE_CLIENT_ID not set in environment, using fallback')
  }
  
  // Use configured REDIRECT_URI or construct from request URL
  const redirectUri = c.env.REDIRECT_URI || `${new URL(c.req.url).origin}/auth/callback`
  
  if (!c.env.REDIRECT_URI) {
    console.warn('REDIRECT_URI not set, using:', redirectUri)
  }
  
  // Validate that we're not in a broken state
  if (!clientId) {
    console.error('No Google Client ID available')
    return c.redirect('/login?error=oauth_not_configured')
  }
  
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.append('client_id', clientId)
  authUrl.searchParams.append('redirect_uri', redirectUri)
  authUrl.searchParams.append('response_type', 'code')
  authUrl.searchParams.append('scope', 'email profile')
  authUrl.searchParams.append('access_type', 'offline')
  authUrl.searchParams.append('prompt', 'consent')
  
  console.log('OAuth: Redirecting to Google with client_id prefix:', clientId.substring(0, 10) + '...')
  console.log('OAuth: Redirect URI:', redirectUri)
  
  return c.redirect(authUrl.toString())
})

// OAuth callback
app.get('/auth/callback', async (c) => {
  const code = c.req.query('code')
  
  if (!code) {
    console.error('OAuth callback: No code provided')
    return c.redirect('/login?error=no_code')
  }
  
  try {
    console.log('OAuth callback: Exchanging code for tokens...')
    
    // Log environment status for debugging
    if (!c.env.GOOGLE_CLIENT_SECRET) {
      console.warn('GOOGLE_CLIENT_SECRET not set in environment, using fallback')
    }
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code,
        client_id: c.env.GOOGLE_CLIENT_ID || '1048677720107-sv7suus5umepko9psghfuvs9f9hpdh8r.apps.googleusercontent.com',
        client_secret: c.env.GOOGLE_CLIENT_SECRET || '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',
        redirect_uri: c.env.REDIRECT_URI || `${new URL(c.req.url).origin}/auth/callback`,
        grant_type: 'authorization_code'
      })
    })
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('OAuth callback: Token exchange failed', {
        status: tokenResponse.status,
        error: errorData
      })
      return c.redirect(`/login?error=token_exchange_failed&details=${encodeURIComponent(errorData.substring(0, 100))}`)
    }
    
    const tokens = await tokenResponse.json()
    
    if (!tokens.access_token) {
      console.error('OAuth callback: No access token received', tokens)
      return c.redirect(`/login?error=no_token&details=${encodeURIComponent(JSON.stringify(tokens).substring(0, 100))}`)
    }
    
    console.log('OAuth callback: Got access token, fetching user info...')
    
    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    })
    
    const googleUser = await userResponse.json()
    console.log('OAuth callback: User info received:', { email: googleUser.email, name: googleUser.name })
    
    // Save or update user in database
    const user = await upsertUser(
      c.env.DB,
      googleUser.email,
      googleUser.name,
      googleUser.picture
    )
    
    console.log('OAuth callback: User saved to database:', { id: user.id, email: user.email })
    
    // Use a fallback JWT secret for development
    const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-please-change-in-production'
    
    // Generate JWT token
    const jwt = await generateToken(user, jwtSecret)
    console.log('OAuth callback: JWT token generated')
    
    // Set cookie and redirect to dashboard
    setCookie(c, 'auth-token', jwt, {
      httpOnly: true,
      secure: c.env.ENVIRONMENT === 'production',
      sameSite: 'Lax',
      maxAge: 86400 // 24 hours
    })
    
    console.log('OAuth callback: Cookie set, redirecting to dashboard...')
    return c.redirect('/')
  } catch (error) {
    console.error('OAuth error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = encodeURIComponent(errorMessage.substring(0, 100))
    return c.redirect(`/login?error=auth_failed&details=${errorDetails}`)
  }
})

// Logout
app.get('/auth/logout', (c) => {
  setCookie(c, 'auth-token', '', {
    httpOnly: true,
    secure: c.env.ENVIRONMENT === 'production',
    sameSite: 'Lax',
    maxAge: 0
  })
  return c.redirect('/login')
})

// Check authentication status
app.get('/api/auth/status', async (c) => {
  const token = getCookie(c, 'auth-token')
  
  if (!token) {
    return c.json({ authenticated: false })
  }
  
  const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-please-change-in-production'
  const payload = await verifyToken(token, jwtSecret)
  
  if (!payload) {
    return c.json({ authenticated: false })
  }
  
  return c.json({ 
    authenticated: true,
    user: {
      email: payload.email,
      name: payload.name,
      role: payload.role
    }
  })
})

// AI Task Generation API
app.post('/api/ai/generate-tasks', async (c) => {
  try {
    const { client_id, month } = await c.req.json()
    
    // Get client information
    const client = await c.env.DB.prepare(
      'SELECT * FROM clients WHERE id = ?'
    ).bind(client_id).first()
    
    if (!client) {
      return c.json({ error: 'Client not found' }, 404)
    }
    
    // Initialize Gemini service
    const gemini = new GeminiService(c.env.GEMINI_API_KEY)
    
    // Generate tasks using AI
    const generatedTasks = await gemini.generateTasksFromClientInfo(
      client.name as string,
      client.employee_count as number,
      client.contract_plan as string,
      month
    )
    
    // Get current user from auth
    const user = c.get('user')
    const userId = parseInt(user.sub)
    
    // Save generated tasks to database
    const savedTasks = []
    for (const task of generatedTasks) {
      const result = await c.env.DB.prepare(`
        INSERT INTO tasks (
          title, description, client_id, assignee_id, 
          task_type, status, priority, due_date, estimated_hours
        ) VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)
      `).bind(
        task.title,
        task.description,
        client_id,
        userId,
        task.task_type,
        task.priority,
        task.due_date,
        task.estimated_hours
      ).run()
      
      savedTasks.push({
        id: result.meta.last_row_id,
        ...task
      })
    }
    
    return c.json({
      success: true,
      message: `${savedTasks.length}個のタスクを自動生成しました`,
      tasks: savedTasks
    })
  } catch (error) {
    console.error('Task generation error:', error)
    return c.json({ 
      error: 'タスク生成に失敗しました',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// AI Task Description Enhancement
app.post('/api/ai/enhance-description', async (c) => {
  try {
    const { task_title } = await c.req.json()
    
    const gemini = new GeminiService(c.env.GEMINI_API_KEY)
    const description = await gemini.generateTaskDescription(task_title)
    
    return c.json({
      success: true,
      description
    })
  } catch (error) {
    return c.json({ 
      error: 'Description generation failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Existing API routes (Tasks, Clients, Users, Dashboard)
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

app.get('/api/tasks/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const result = await c.env.DB.prepare(`
      SELECT 
        t.*,
        u.name as assignee_name,
        c.name as client_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE t.id = ?
    `).bind(id).first()
    
    if (!result) {
      return c.json({ error: 'Task not found' }, 404)
    }
    
    return c.json(result)
  } catch (error) {
    return c.json({ error: 'Failed to fetch task' }, 500)
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

    const currentTask = await c.env.DB.prepare('SELECT status FROM tasks WHERE id = ?').bind(id).first()
    
    // Set completed_at if task is being completed
    const completedAt = (status === 'completed' && currentTask?.status !== 'completed') 
      ? `, completed_at = CURRENT_TIMESTAMP` 
      : ''
    
    await c.env.DB.prepare(`
      UPDATE tasks 
      SET status = ?, progress = ?, actual_hours = ?, notes = ?, updated_at = CURRENT_TIMESTAMP${completedAt}
      WHERE id = ?
    `).bind(status, progress, actual_hours, notes, id).run()

    // Task history tracking - temporarily disabled until needed
    // if (currentTask && currentTask.status !== status) {
    //   const user = c.get('user')
    //   await c.env.DB.prepare(`
    //     INSERT INTO task_history (task_id, user_id, action, old_status, new_status)
    //     VALUES (?, ?, 'updated', ?, ?)
    //   `).bind(id, parseInt(user.sub), currentTask.status, status).run()
    // }

    return c.json({ 
      success: true,
      message: 'タスクを更新しました'
    })
  } catch (error) {
    return c.json({ error: 'Failed to update task' }, 500)
  }
})

app.delete('/api/tasks/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await c.env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run()
    
    return c.json({ 
      success: true,
      message: 'タスクを削除しました'
    })
  } catch (error) {
    return c.json({ error: 'Failed to delete task' }, 500)
  }
})

app.get('/api/clients', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT 
        c.*,
        COUNT(DISTINCT t.id) as active_tasks
      FROM clients c
      LEFT JOIN tasks t ON c.id = t.client_id AND t.status != 'completed'
      GROUP BY c.id
      ORDER BY c.name ASC
    `).all()
    
    return c.json({ clients: result.results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch clients' }, 500)
  }
})

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

app.get('/api/dashboard/stats', async (c) => {
  try {
    const todayTasks = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM tasks 
      WHERE date(due_date) = date('now') 
      AND status != 'completed'
    `).first()

    const overdueTasks = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM tasks 
      WHERE date(due_date) < date('now') 
      AND status != 'completed'
    `).first()

    const weekTasks = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM tasks 
      WHERE date(due_date) BETWEEN date('now') AND date('now', '+7 days')
      AND status != 'completed'
    `).first()

    const statusDistribution = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as count 
      FROM tasks 
      GROUP BY status
    `).all()

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

// Login page
app.get('/login', (c) => {
  const error = c.req.query('error')
  const details = c.req.query('details')
  
  let errorMessage = ''
  if (error) {
    errorMessage = `
      <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
        <p class="font-bold">エラー: ${error}</p>
        ${details ? `<p class="text-sm mt-1">${details}</p>` : ''}
      </div>
    `
  }
  
  return c.html(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ログイン - 社労士事務所タスク管理</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center">
    <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                <i class="fas fa-briefcase text-blue-600 text-3xl"></i>
            </div>
            <h1 class="text-2xl font-bold text-gray-900">社労士事務所タスク管理</h1>
            <p class="text-gray-600 mt-2">業務の見える化と効率化を実現</p>
        </div>
        
        ${errorMessage}
        
        <div class="space-y-4">
            <button onclick="window.location.href='/auth/google'" class="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 rounded-lg px-6 py-3 hover:bg-gray-50 transition-colors">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" class="w-5 h-5">
                <span class="font-medium text-gray-700">Googleアカウントでログイン</span>
            </button>
            
            <div class="text-center text-sm text-gray-500 mt-4">
                <p>※ 認証情報は安全に管理されます</p>
            </div>
        </div>
        
        <div class="mt-8 pt-6 border-t border-gray-200">
            <div class="flex items-center justify-center space-x-6 text-sm text-gray-500">
                <a href="#" class="hover:text-gray-700">利用規約</a>
                <span>•</span>
                <a href="#" class="hover:text-gray-700">プライバシーポリシー</a>
            </div>
        </div>
    </div>
</body>
</html>
  `)
})

// Main dashboard page
app.get('/', async (c) => {
  // Check authentication
  const token = getCookie(c, 'auth-token')
  
  if (!token) {
    console.log('Dashboard: No auth token found, redirecting to login')
    return c.redirect('/login')
  }
  
  // Use the same fallback JWT secret
  const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-please-change-in-production'
  
  const payload = await verifyToken(token, jwtSecret)
  
  if (!payload) {
    console.log('Dashboard: Invalid token, redirecting to login')
    return c.redirect('/login')
  }
  
  console.log('Dashboard: Authentication successful for user:', payload.email)
  
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
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-600">
                        <i class="fas fa-user-circle mr-1"></i>
                        ${payload.name}
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
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-lg p-6 animate-slide-in border-l-4 border-blue-500">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-blue-600 text-sm font-medium mb-1">📋 今日やること</p>
                        <p class="text-3xl font-bold text-gray-900" id="todayCount">-</p>
                        <p class="text-xs text-gray-500 mt-1">件の作業があります</p>
                    </div>
                    <div class="bg-blue-100 p-4 rounded-full">
                        <i class="fas fa-calendar-day text-blue-600 text-2xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-lg p-6 animate-slide-in border-l-4 border-red-500" style="animation-delay: 0.1s">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-red-600 text-sm font-medium mb-1">⚠️ 急いで！</p>
                        <p class="text-3xl font-bold text-red-600" id="overdueCount">-</p>
                        <p class="text-xs text-gray-500 mt-1">件の遅れている作業</p>
                    </div>
                    <div class="bg-red-100 p-4 rounded-full">
                        <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-lg p-6 animate-slide-in border-l-4 border-green-500" style="animation-delay: 0.2s">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-green-600 text-sm font-medium mb-1">📅 今週の予定</p>
                        <p class="text-3xl font-bold text-gray-900" id="weekCount">-</p>
                        <p class="text-xs text-gray-500 mt-1">件の作業予定</p>
                    </div>
                    <div class="bg-green-100 p-4 rounded-full">
                        <i class="fas fa-calendar-week text-green-600 text-2xl"></i>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-lg p-6 animate-slide-in border-l-4 border-orange-500" style="animation-delay: 0.3s">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-orange-600 text-sm font-medium mb-1">🚀 作業中</p>
                        <p class="text-3xl font-bold text-orange-600" id="inProgressCount">-</p>
                        <p class="text-xs text-gray-500 mt-1">件を進めています</p>
                    </div>
                    <div class="bg-orange-100 p-4 rounded-full">
                        <i class="fas fa-play text-orange-600 text-2xl"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Dashboard Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Recent Tasks -->
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b flex justify-between items-center">
                    <h2 class="text-lg font-semibold text-gray-900">
                        <i class="fas fa-list-check mr-2 text-blue-600"></i>
                        今日やることリスト
                    </h2>
                    <button onclick="openTaskModal()" class="text-blue-600 hover:text-blue-700 text-sm">
                        <i class="fas fa-plus-circle mr-1"></i> やることを追加
                    </button>
                </div>
                <div class="p-6">
                    <div id="taskList" class="space-y-3">
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
                        <i class="fas fa-users mr-2 text-green-600"></i>
                        みんなの作業状況
                    </h2>
                </div>
                <div class="p-6">
                    <canvas id="workloadChart"></canvas>
                </div>
            </div>
        </div>

        <!-- 簡単操作ガイド -->
        <div class="mt-8 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg shadow-lg p-6 border-l-4 border-orange-400">
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <i class="fas fa-lightbulb text-orange-600 text-2xl"></i>
                </div>
                <div class="ml-4">
                    <h3 class="text-lg font-bold text-gray-900 mb-2">
                        💡 使い方のコツ
                    </h3>
                    <div class="space-y-2 text-gray-700">
                        <div class="flex items-center">
                            <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium mr-3">1</span>
                            <span>朝一番に「今日のやること」で今日の予定を確認</span>
                        </div>
                        <div class="flex items-center">
                            <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium mr-3">2</span>
                            <span>「お客様管理」で連絡先や契約内容をチェック</span>
                        </div>
                        <div class="flex items-center">
                            <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-medium mr-3">3</span>
                            <span>「予定表」で面談や締切日を確認・追加</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- シンプル機能選択 -->
        <div class="mt-8 bg-white rounded-lg shadow-lg p-8">
            <h3 class="text-2xl font-bold text-gray-900 mb-2 text-center">
                <i class="fas fa-mouse-pointer mr-3 text-blue-600"></i>
                何をしますか？
            </h3>
            <p class="text-gray-600 text-center mb-8">やりたいことをクリックしてください</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- 業務管理 (統合版) -->
                <a href="/tasks" class="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 border-2 border-transparent hover:border-blue-300 shadow-lg hover:shadow-xl">
                    <div class="text-center">
                        <div class="bg-blue-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <i class="fas fa-clipboard-list text-white text-3xl"></i>
                        </div>
                        <h4 class="text-2xl font-bold text-gray-900 mb-3">業務管理</h4>
                        <p class="text-gray-600">今日のやること・予定・進捗をまとめて管理</p>
                        <div class="mt-4 flex justify-center space-x-4 text-sm text-gray-500">
                            <span><i class="fas fa-tasks mr-1"></i>タスク</span>
                            <span><i class="fas fa-calendar mr-1"></i>予定</span>
                            <span><i class="fas fa-chart-line mr-1"></i>進捗</span>
                        </div>
                    </div>
                </a>
                
                <!-- 顧問先管理 -->
                <a href="/clients" class="group bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 hover:from-green-100 hover:to-green-200 transition-all duration-200 border-2 border-transparent hover:border-green-300 shadow-lg hover:shadow-xl">
                    <div class="text-center">
                        <div class="bg-green-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <i class="fas fa-building text-white text-3xl"></i>
                        </div>
                        <h4 class="text-2xl font-bold text-gray-900 mb-3">顧問先管理</h4>
                        <p class="text-gray-600">お客様の基本情報・連絡履歴・契約状況</p>
                        <div class="mt-4 flex justify-center space-x-4 text-sm text-gray-500">
                            <span><i class="fas fa-address-book mr-1"></i>連絡先</span>
                            <span><i class="fas fa-handshake mr-1"></i>契約</span>
                            <span><i class="fas fa-history mr-1"></i>履歴</span>
                        </div>
                    </div>
                </a>
            </div>
            
            <!-- 助成金管理 (社労士特化機能) -->
            <div class="mt-8">
                <a href="/subsidies" class="block group bg-gradient-to-r from-amber-50 to-yellow-100 rounded-xl p-6 hover:from-amber-100 hover:to-yellow-200 transition-all duration-200 border-2 border-transparent hover:border-yellow-300 shadow-lg hover:shadow-xl">
                    <div class="flex items-center justify-center">
                        <div class="bg-yellow-600 rounded-full w-16 h-16 flex items-center justify-center mr-6 group-hover:scale-110 transition-transform">
                            <i class="fas fa-coins text-white text-2xl"></i>
                        </div>
                        <div>
                            <h4 class="text-xl font-bold text-gray-900 mb-2">助成金管理</h4>
                            <p class="text-gray-600">申請から受給まで一括管理</p>
                        </div>
                    </div>
                </a>
            </div>
        </div>

        <!-- 簡単アクション -->
        <div class="mt-8 bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 text-center">
                <i class="fas fa-plus-circle mr-2 text-green-600"></i>
                新しく追加する
            </h3>
            <div class="flex justify-center space-x-4">
                <button onclick="openTaskModal()" class="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg text-lg">
                    <i class="fas fa-plus mr-2"></i>今日やることを追加
                </button>
            </div>
        </div>
    </main>

    <!-- Task Modal -->
    <div id="taskModal" class="modal">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div class="px-6 py-4 border-b flex justify-between items-center">
                <h3 class="text-lg font-semibold">新規タスク作成</h3>
                <button onclick="closeTaskModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="p-6">
                <form id="taskForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">タスク名</label>
                        <input type="text" name="title" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">説明</label>
                        <textarea name="description" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"></textarea>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">顧問先</label>
                            <select name="client_id" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                <option value="">選択してください</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">担当者</label>
                            <select name="assignee_id" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                <option value="">選択してください</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">タイプ</label>
                            <select name="task_type" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                <option value="regular">定期業務</option>
                                <option value="irregular">不定期業務</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">優先度</label>
                            <select name="priority" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                <option value="urgent">緊急</option>
                                <option value="high">高</option>
                                <option value="medium" selected>中</option>
                                <option value="low">低</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">期限</label>
                            <input type="date" name="due_date" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">予定工数（時間）</label>
                            <input type="number" name="estimated_hours" step="0.5" min="0.5" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        </div>
                    </div>
                    <div class="flex justify-end space-x-3 pt-4">
                        <button type="button" onclick="closeTaskModal()" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                            キャンセル
                        </button>
                        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            作成
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        let currentUser = null;
        
        // Initialize
        async function init() {
            try {
                // Check auth status
                const authRes = await axios.get('/api/auth/status');
                if (authRes.data.authenticated) {
                    currentUser = authRes.data.user;
                    await loadDashboard();
                    await loadClients();
                    await loadUsers();
                } else {
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error('Initialization error:', error);
            }
        }
        
        // Load dashboard data
        async function loadDashboard() {
            try {
                const statsRes = await axios.get('/api/dashboard/stats');
                const stats = statsRes.data;
                
                document.getElementById('todayCount').textContent = stats.today;
                document.getElementById('overdueCount').textContent = stats.overdue;
                document.getElementById('weekCount').textContent = stats.thisWeek;
                
                const inProgress = stats.statusDistribution.find(s => s.status === 'in_progress');
                document.getElementById('inProgressCount').textContent = inProgress ? inProgress.count : 0;
                
                drawWorkloadChart(stats.workload);
                
                const tasksRes = await axios.get('/api/tasks?status=pending');
                displayTasks(tasksRes.data.tasks);
                
            } catch (error) {
                console.error('Failed to load dashboard:', error);
            }
        }
        
        // Load clients for select options
        async function loadClients() {
            try {
                const res = await axios.get('/api/clients');
                const clients = res.data.clients;
                
                const selects = document.querySelectorAll('select[name="client_id"], #aiClientSelect');
                selects.forEach(select => {
                    const currentValue = select.value;
                    select.innerHTML = '<option value="">選択してください</option>' + 
                        clients.map(c => \`<option value="\${c.id}">\${c.name}</option>\`).join('');
                    if (currentValue) select.value = currentValue;
                });
            } catch (error) {
                console.error('Failed to load clients:', error);
            }
        }
        
        // Load users for select options
        async function loadUsers() {
            try {
                const res = await axios.get('/api/users');
                const users = res.data.users;
                
                const selects = document.querySelectorAll('select[name="assignee_id"]');
                selects.forEach(select => {
                    select.innerHTML = '<option value="">選択してください</option>' + 
                        users.map(u => \`<option value="\${u.id}">\${u.name}</option>\`).join('');
                });
            } catch (error) {
                console.error('Failed to load users:', error);
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
                        x: { stacked: true },
                        y: { stacked: true, beginAtZero: true }
                    },
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });
        }
        
        // Task Modal Functions
        function openTaskModal() {
            document.getElementById('taskModal').classList.add('active');
        }
        
        function closeTaskModal() {
            document.getElementById('taskModal').classList.remove('active');
            document.getElementById('taskForm').reset();
        }
        
        // Task form submission
        document.getElementById('taskForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const taskData = Object.fromEntries(formData);
            
            try {
                await axios.post('/api/tasks', taskData);
                closeTaskModal();
                await loadDashboard();
                alert('タスクを作成しました');
            } catch (error) {
                alert('タスクの作成に失敗しました');
            }
        });
        
        // AI Task Generation
        async function generateTasksWithAI() {
            const clientId = document.getElementById('aiClientSelect').value;
            const month = document.getElementById('aiMonthSelect').value;
            
            if (!clientId || !month) {
                alert('顧問先と対象月を選択してください');
                return;
            }
            
            const resultDiv = document.getElementById('aiGenerationResult');
            resultDiv.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin text-2xl text-purple-600"></i><p class="mt-2">AIがタスクを生成中...</p></div>';
            
            try {
                const res = await axios.post('/api/ai/generate-tasks', {
                    client_id: parseInt(clientId),
                    month: month
                });
                
                if (res.data.success) {
                    resultDiv.innerHTML = \`
                        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                            <i class="fas fa-check-circle mr-2"></i>
                            \${res.data.message}
                        </div>
                    \`;
                    await loadDashboard();
                }
            } catch (error) {
                resultDiv.innerHTML = \`
                    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <i class="fas fa-exclamation-circle mr-2"></i>
                        タスク生成に失敗しました: \${error.response?.data?.error || 'Unknown error'}
                    </div>
                \`;
            }
        }
        
        // Set default month
        document.getElementById('aiMonthSelect').value = new Date().toISOString().slice(0, 7);
        
        // Initialize on page load
        document.addEventListener('DOMContentLoaded', init);
    </script>
</body>
</html>
  `)
})

// Tasks page
app.get('/tasks', async (c) => {
  const token = getCookie(c, 'auth-token')
  
  if (!token) {
    return c.redirect('/login')
  }
  
  const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-please-change-in-production'
  const payload = await verifyToken(token, jwtSecret)
  
  if (!payload) {
    return c.redirect('/login')
  }
  
  return c.html(getTasksPage(payload))
})

// Clients page
app.get('/clients', async (c) => {
  // Development environment bypass (only for local testing)
  const environment = c.env.ENVIRONMENT || 'production'
  if (environment === 'development') {
    const testUser = { name: '田中 太郎', role: 'admin' }
    return c.html(getClientsPage(testUser.name))
  }
  
  // Production authentication
  const token = getCookie(c, 'auth-token')
  
  if (!token) {
    return c.redirect('/login')
  }
  
  const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-please-change-in-production'
  const payload = await verifyToken(token, jwtSecret)
  
  if (!payload) {
    return c.redirect('/login')
  }
  
  return c.html(getClientsPage(payload.name))
})

// Reports page
app.get('/reports', async (c) => {
  const token = getCookie(c, 'auth-token')
  
  if (!token) {
    return c.redirect('/login')
  }
  
  const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-please-change-in-production'
  const payload = await verifyToken(token, jwtSecret)
  
  if (!payload) {
    return c.redirect('/login')
  }
  
  return c.html(getReportsPage(payload.name))
})

// Settings page
app.get('/settings', async (c) => {
  const token = getCookie(c, 'auth-token')
  
  if (!token) {
    return c.redirect('/login')
  }
  
  const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-please-change-in-production'
  const payload = await verifyToken(token, jwtSecret)
  
  if (!payload) {
    return c.redirect('/login')
  }
  
  const user = await getUserByEmail(c.env.DB, payload.email)
  if (!user) {
    return c.redirect('/login')
  }
  
  return c.html(getSettingsPage(user.name, user.id))
})

// Unified Calendar/Schedule page (core feature)
app.get('/calendar', async (c) => {
  const token = getCookie(c, 'auth-token')
  
  if (!token) {
    return c.redirect('/login')
  }
  
  const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-please-change-in-production'
  const payload = await verifyToken(token, jwtSecret)
  
  if (!payload) {
    return c.redirect('/login')
  }
  
  return c.html(getSchedulePage(payload.name, payload.role || 'user'))
})

// Redirect old routes to simplified structure
app.get('/schedule', async (c) => c.redirect('/calendar'))
app.get('/projects', async (c) => c.redirect('/tasks'))
app.get('/gmail', async (c) => c.redirect('/'))
app.get('/admin', async (c) => c.redirect('/'))

// Subsidies page (core feature for sharoushi offices)
app.get('/subsidies', async (c) => {
  const token = getCookie(c, 'auth-token')
  
  if (!token) {
    return c.redirect('/login')
  }
  
  const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-please-change-in-production'
  const payload = await verifyToken(token, jwtSecret)
  
  if (!payload) {
    return c.redirect('/login')
  }
  
  return c.html(getSubsidiesPage(payload.name))
})

// Scheduled event handler for Cron Triggers
export { scheduled } from './scheduled'

export default app
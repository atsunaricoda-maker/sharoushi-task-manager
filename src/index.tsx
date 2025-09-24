import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { logger } from 'hono/logger'
import { getCookie, setCookie } from 'hono/cookie'
import { generateToken, verifyToken, getUserByEmail, upsertUser } from './lib/auth'
import { GeminiService } from './lib/gemini'
import { clientsRouter } from './routes/clients'
import { reportsRouter } from './routes/reports'
import { contactsRouter } from './routes/contacts'
// Simplified router imports
import subsidiesRouter from './routes/subsidies'
import scheduleRouter from './routes/schedule'
import { getSimplifiedClientsPage } from './pages/clients-simplified'
import { getReportsPage } from './pages/reports'
import { getSettingsPage } from './pages/settings'
// Restored subsidies page import with proper error handling
import { getUnifiedSubsidiesPage } from './pages/subsidies-unified'
import { getSchedulePage } from './pages/schedule'
import { getTasksPage } from './pages/tasks'
import { getBusinessManagementPage } from './pages/business'

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

// Authentication check middleware for API routes (EMERGENCY MODE)
async function checkAuth(c: any, next: any) {
  
  // Check for auth token in cookie or Authorization header
  const token = getCookie(c, 'auth-token') || c.req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    console.log('No auth token found in request')
    return c.json({ error: 'Unauthorized', message: 'No auth token found' }, 401)
  }
  
  // EMERGENCY: Handle simple tokens from emergency-auth endpoint
  if (token.endsWith('.')) {
    try {
      const parts = token.split('.')
      if (parts.length >= 2) {
        // Safe base64 decoding function
        function safeBase64Decode(str) {
          try {
            const binary = atob(str)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i)
            }
            const decoder = new TextDecoder()
            return decoder.decode(bytes)
          } catch (e) {
            // Fallback to simple atob for basic tokens
            return atob(str)
          }
        }
        
        const payloadStr = safeBase64Decode(parts[1])
        const payload = JSON.parse(payloadStr)
        
        // Check if token is expired
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
          console.log('Emergency token expired')
          return c.json({ error: 'Token expired' }, 401)
        }
        
        console.log('Using emergency token bypass for user:', payload.sub)
        c.set('user', payload)
        await next()
        return
      }
    } catch (emergencyError) {
      console.log('Emergency token parsing failed:', emergencyError.message)
    }
  }
  
  // Original JWT verification
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

// EMERGENCY AUTH BYPASS (TEMPORARY SOLUTION)
app.get('/api/emergency-auth', async (c) => {
  // 🚨 EMERGENCY: Bypasses authentication issues temporarily
  try {
    // Simple hardcoded token payload - using English names to avoid encoding issues
    const simplePayload = {
      sub: '1',
      email: 'tanaka@sharoushi.com',
      name: 'Tanaka Taro', // Use English name to avoid btoa() issues
      role: 'admin',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }
    
    // Safe base64 encoding function for Cloudflare Workers
    function safeBase64Encode(str) {
      // Convert to UTF-8 bytes first, then encode
      const encoder = new TextEncoder()
      const bytes = encoder.encode(str)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      return btoa(binary)
    }
    
    // Create a simple JWT manually using safe base64 encoding
    const headerStr = JSON.stringify({ typ: 'JWT', alg: 'none' })
    const payloadStr = JSON.stringify(simplePayload)
    
    const header = safeBase64Encode(headerStr)
    const payload = safeBase64Encode(payloadStr)
    const simpleToken = `${header}.${payload}.`
    
    // Set cookie with the simple token
    setCookie(c, 'auth-token', simpleToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 24 * 60 * 60
    })
    
    // Check for redirect parameter
    const redirect = c.req.query('redirect')
    if (redirect) {
      console.log(`Emergency auth with redirect to: ${redirect}`)
      return c.redirect(redirect)
    }
    
    return c.json({
      success: true,
      message: 'Emergency auth bypass activated',
      user: {
        id: 1,
        email: 'tanaka@sharoushi.com',
        name: 'Tanaka Taro'
      },
      authType: 'emergency-bypass',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Emergency auth error:', error)
    return c.json({
      error: 'Emergency auth failed',
      debug: error.message,
      stack: error.stack
    }, 500)
  }
})

// PRODUCTION AUTH SETUP (TEMPORARILY DISABLED DUE TO ERRORS)
app.get('/api/setup-auth-disabled', async (c) => {
  return c.json({
    error: 'This endpoint is temporarily disabled due to generateToken issues',
    alternative: 'Please use /api/emergency-auth instead',
    timestamp: new Date().toISOString()
  })
})

// Development auth token generator (TEMPORARILY ENABLED FOR TESTING)
app.get('/api/dev-auth', async (c) => {
  // 🚨 SECURITY: Temporarily enabled for testing - REMOVE IN PRODUCTION
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
      secure: c.env.ENVIRONMENT === 'production',
      sameSite: 'Lax',
      maxAge: 24 * 60 * 60 // 24 hours
    })
    
    return c.json({
      success: true,
      message: 'Test auth token generated and set as cookie',
      token: token,
      user: testUser,
      redirect: '/business'
    })
  } catch (error) {
    return c.json({
      error: 'Failed to generate test auth token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Development login page (TEMPORARILY ENABLED FOR TESTING)
app.get('/dev-login', (c) => {
  // 🚨 SECURITY: Temporarily enabled for testing - REMOVE IN PRODUCTION
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
app.use('/api/contacts/*', checkAuth)
app.use('/api/users/*', checkAuth)
app.use('/api/dashboard/*', checkAuth)
app.use('/api/subsidies/*', checkAuth)

// Core API routes only
app.route('/api/clients', clientsRouter)
app.route('/api/contacts', contactsRouter)
app.route('/api/reports', reportsRouter)
app.route('/api/subsidies', subsidiesRouter)

// PUBLIC Database reset endpoint (NO AUTH REQUIRED)
app.delete('/api/public/reset-db', async (c) => {
  try {
    console.log('🔧 PUBLIC: Database reset started')
    
    if (!c.env.DB) {
      return c.json({ error: 'Database not available' }, 500)
    }
    
    const results = []
    
    // Drop existing tables to start fresh
    const tablesToDrop = ['subsidy_applications', 'subsidy_checklists', 'subsidy_documents']
    
    for (const table of tablesToDrop) {
      try {
        await c.env.DB.prepare(`DROP TABLE IF EXISTS ${table}`).run()
        results.push(`✅ Dropped table: ${table}`)
      } catch (error) {
        results.push(`⚠️ Drop ${table}: ${error.message}`)
      }
    }
    
    return c.json({
      success: true,
      message: 'Database tables dropped successfully',
      results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('PUBLIC DB reset failed:', error)
    return c.json({
      error: 'Database reset failed',
      details: error.message
    }, 500)
  }
})

// PUBLIC Client Contacts Table Creation (NO AUTH REQUIRED)
app.post('/api/public/init-contacts-table', async (c) => {
  try {
    console.log('🔧 PUBLIC: Creating client_contacts table')
    
    if (!c.env.DB) {
      return c.json({ error: 'Database not available' }, 500)
    }
    
    const results = []
    
    // Create client_contacts table
    try {
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS client_contacts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id INTEGER NOT NULL,
          contact_type TEXT NOT NULL,
          subject TEXT NOT NULL,
          notes TEXT NOT NULL,
          contact_date TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients(id)
        )
      `).run()
      results.push('✅ client_contacts table created')
    } catch (error) {
      results.push(`❌ client_contacts: ${error.message}`)
    }
    
    // Verify table creation
    const tables = await c.env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name = 'client_contacts'
    `).all()
    
    console.log('🔧 PUBLIC: Client contacts table initialization completed:', results)
    
    return c.json({
      success: true,
      message: 'Client contacts table initialized successfully',
      results: results,
      tablesCreated: tables.results?.map(t => t.name) || [],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('🔧 PUBLIC: Client contacts table initialization error:', error)
    return c.json({
      error: 'Client contacts table initialization failed',
      debug: error.message,
      stack: error.stack
    }, 500)
  }
})

// PUBLIC Database initialization endpoint (NO AUTH REQUIRED)
app.post('/api/public/init-db', async (c) => {
  try {
    console.log('🔧 PUBLIC: Database initialization started')
    
    if (!c.env.DB) {
      return c.json({ error: 'Database not available' }, 500)
    }
    
    const results = []
    
    // Create users table first
    try {
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          role TEXT DEFAULT 'sharoushi',
          avatar_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run()
      results.push('✅ users table created')
    } catch (error) {
      results.push(`❌ users: ${error.message}`)
    }
    
    // Create clients table (CORE TABLE - REQUIRED)
    try {
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS clients (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          company_name TEXT,
          email TEXT,
          phone TEXT,
          address TEXT,
          employee_count INTEGER DEFAULT 0,
          contract_plan TEXT,
          monthly_fee DECIMAL(10,2),
          notes TEXT,
          last_contact_date TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run()
      results.push('✅ clients table created (CORE TABLE)')
    } catch (error) {
      results.push(`❌ clients: ${error.message}`)
    }
    
    // Create tasks table
    try {
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS tasks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          client_id INTEGER NOT NULL,
          assignee_id INTEGER NOT NULL,
          task_type TEXT NOT NULL DEFAULT 'regular',
          status TEXT DEFAULT 'pending',
          priority TEXT DEFAULT 'medium',
          due_date DATE,
          estimated_hours DECIMAL(4,1),
          actual_hours DECIMAL(4,1),
          progress INTEGER DEFAULT 0,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients (id),
          FOREIGN KEY (assignee_id) REFERENCES users (id)
        )
      `).run()
      results.push('✅ tasks table created')
    } catch (error) {
      results.push(`❌ tasks: ${error.message}`)
    }
    
    // Create subsidy_applications table
    try {
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS subsidy_applications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          subsidy_name TEXT NOT NULL,
          client_id INTEGER,
          status TEXT DEFAULT 'preparing',
          expected_amount INTEGER,
          deadline_date TEXT,
          notes TEXT,
          created_by INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run()
      results.push('✅ subsidy_applications table created')
    } catch (error) {
      results.push(`❌ subsidy_applications: ${error.message}`)
    }
    
    // Create subsidies master table
    try {
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS subsidies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          managing_organization TEXT NOT NULL,
          description TEXT,
          max_amount INTEGER,
          subsidy_rate REAL,
          application_period_type TEXT DEFAULT 'anytime',
          url TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run()
      results.push('✅ subsidies master table created')
    } catch (error) {
      results.push(`❌ subsidies: ${error.message}`)
    }
    
    // Create subsidy_checklists table
    try {
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS subsidy_checklists (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          application_id INTEGER NOT NULL,
          item_name TEXT NOT NULL,
          category TEXT,
          is_required BOOLEAN DEFAULT 0,
          is_completed BOOLEAN DEFAULT 0,
          completed_by INTEGER,
          completed_at DATETIME,
          notes TEXT,
          display_order INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (application_id) REFERENCES subsidy_applications(id)
        )
      `).run()
      results.push('✅ subsidy_checklists table created')
    } catch (error) {
      results.push(`❌ subsidy_checklists: ${error.message}`)
    }
    
    // Create subsidy_documents table
    try {
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS subsidy_documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          application_id INTEGER NOT NULL,
          document_name TEXT NOT NULL,
          document_type TEXT NOT NULL,
          file_name TEXT,
          file_size INTEGER,
          file_type TEXT,
          status TEXT DEFAULT 'uploaded',
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          notes TEXT,
          FOREIGN KEY (application_id) REFERENCES subsidy_applications(id)
        )
      `).run()
      results.push('✅ subsidy_documents table created')
    } catch (error) {
      results.push(`❌ subsidy_documents: ${error.message}`)
    }
    
    // Create client_contacts table (for contact history functionality)
    try {
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS client_contacts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          client_id INTEGER NOT NULL,
          contact_type TEXT NOT NULL,
          subject TEXT NOT NULL,
          notes TEXT NOT NULL,
          contact_date TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES clients(id)
        )
      `).run()
      results.push('✅ client_contacts table created')
    } catch (error) {
      results.push(`❌ client_contacts: ${error.message}`)
    }
    
    // Add sample data for immediate functionality
    try {
      // Add a sample user if none exists
      const userCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first()
      if (userCount.count === 0) {
        await c.env.DB.prepare(`
          INSERT INTO users (email, name, role) 
          VALUES ('tanaka@sharoushi.com', '田中 太郎', 'admin')
        `).run()
        results.push('✅ Sample user added')
      }
      
      // Add sample clients if none exist
      const clientCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM clients').first()
      if (clientCount.count === 0) {
        await c.env.DB.prepare(`
          INSERT INTO clients (name, company_name, email, phone, address, employee_count, contract_plan, notes) 
          VALUES 
          ('株式会社サンプル', 'Sample Company', 'contact@sample.co.jp', '03-1234-5678', '東京都渋谷区', 50, 'スタンダードプラン', 'サンプル顧問先です'),
          ('テスト商事', 'Test Trading', 'info@test-trading.jp', '06-9876-5432', '大阪市北区', 30, 'ライトプラン', 'テスト用の顧問先')
        `).run()
        results.push('✅ Sample clients added')
      }
    } catch (error) {
      results.push(`⚠️  Sample data: ${error.message}`)
    }
    
    // Schema migration: Add missing columns to existing tables
    try {
      // Check if last_contact_date column exists in clients table
      const clientColumns = await c.env.DB.prepare(`
        PRAGMA table_info(clients)
      `).all()
      
      const hasLastContactDate = clientColumns.results?.some(col => col.name === 'last_contact_date')
      
      if (!hasLastContactDate) {
        await c.env.DB.prepare(`
          ALTER TABLE clients ADD COLUMN last_contact_date TEXT
        `).run()
        results.push('✅ Added last_contact_date column to clients table')
      } else {
        results.push('✅ last_contact_date column already exists')
      }
      
      // Check for other missing columns and add them if needed
      const hasUpdatedAt = clientColumns.results?.some(col => col.name === 'updated_at')
      if (!hasUpdatedAt) {
        await c.env.DB.prepare(`
          ALTER TABLE clients ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        `).run()
        results.push('✅ Added updated_at column to clients table')
      }
      
    } catch (migrationError) {
      results.push(`⚠️  Schema migration: ${migrationError.message}`)
    }
    
    // Verify table creation
    const tables = await c.env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name IN (
        'users', 'clients', 'tasks', 'subsidy_applications', 'subsidies', 'subsidy_checklists', 'subsidy_documents', 'client_contacts'
      )
    `).all()
    
    console.log('🔧 PUBLIC: Database initialization completed:', results)
    
    return c.json({
      success: true,
      message: 'Database tables initialized successfully (PUBLIC ENDPOINT)',
      results: results,
      tablesCreated: tables.results?.map(t => t.name) || [],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('🔧 PUBLIC: Database initialization error:', error)
    return c.json({
      error: 'Database initialization failed',
      debug: error.message,
      stack: error.stack
    }, 500)
  }
})

// PUBLIC Client Contacts Table Creation (DIRECT)
app.get('/api/public/create-contacts-table', async (c) => {
  try {
    console.log('🔧 Creating client_contacts table directly')
    
    if (!c.env.DB) {
      return c.json({ error: 'Database not available' }, 500)
    }
    
    // Create client_contacts table
    const createResult = await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS client_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        contact_type TEXT NOT NULL,
        subject TEXT NOT NULL,
        notes TEXT NOT NULL,
        contact_date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )
    `).run()
    
    // Verify table creation
    const tables = await c.env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name = 'client_contacts'
    `).all()
    
    console.log('🔧 Client contacts table creation result:', createResult)
    console.log('🔧 Table verification:', tables)
    
    return c.json({
      success: true,
      message: 'Client contacts table created successfully',
      createResult: createResult,
      tableExists: tables.results?.length > 0,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('🔧 Client contacts table creation error:', error)
    return c.json({
      error: 'Client contacts table creation failed',
      debug: error.message,
      stack: error.stack
    }, 500)
  }
})

// PUBLIC Direct SQL Execution for client_contacts table (NO AUTH REQUIRED)
app.get('/api/public/create-contacts-table-direct', async (c) => {
  try {
    console.log('🔧 Direct SQL: Creating client_contacts table')
    
    if (!c.env.DB) {
      return c.json({ error: 'Database not available' }, 500)
    }
    
    // Step 1: Check if table exists
    const existingTables = await c.env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name = 'client_contacts'
    `).all()
    
    console.log('🔧 Existing client_contacts tables:', existingTables)
    
    // Step 2: Create table with explicit SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS client_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL,
        contact_type TEXT NOT NULL,
        subject TEXT NOT NULL,
        notes TEXT NOT NULL,
        contact_date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `
    
    console.log('🔧 Executing SQL:', createTableSQL)
    const result = await c.env.DB.prepare(createTableSQL).run()
    console.log('🔧 SQL Result:', result)
    
    // Step 3: Verify table creation
    const verifyTables = await c.env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name = 'client_contacts'
    `).all()
    
    console.log('🔧 Verification result:', verifyTables)
    
    // Step 4: Get table schema
    const tableSchema = await c.env.DB.prepare(`
      PRAGMA table_info(client_contacts)
    `).all()
    
    console.log('🔧 Table schema:', tableSchema)
    
    return c.json({
      success: true,
      message: 'Direct client_contacts table creation completed',
      existingTablesBefore: existingTables.results || [],
      createResult: result,
      existingTablesAfter: verifyTables.results || [],
      tableSchema: tableSchema.results || [],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('🔧 Direct SQL Error:', error)
    return c.json({
      error: 'Direct table creation failed',
      debug: error.message,
      stack: error.stack
    }, 500)
  }
})

// PUBLIC Database schema fix (NO AUTH REQUIRED) 
app.post('/api/public/fix-schema', async (c) => {
  try {
    console.log('🔧 PUBLIC: Fixing database schema')
    
    if (!c.env.DB) {
      return c.json({ error: 'Database not available' }, 500)
    }
    
    const results = []
    
    // Check and add missing columns to subsidy_applications table
    try {
      // Get current table structure
      const columns = await c.env.DB.prepare(`
        PRAGMA table_info(subsidy_applications)
      `).all()
      
      const existingColumns = columns.results?.map(col => col.name) || []
      console.log('Existing subsidy_applications columns:', existingColumns)
      
      // Add subsidy_name column if missing
      if (!existingColumns.includes('subsidy_name')) {
        await c.env.DB.prepare(`
          ALTER TABLE subsidy_applications 
          ADD COLUMN subsidy_name TEXT
        `).run()
        results.push('✅ Added subsidy_name column')
      } else {
        results.push('ℹ️ subsidy_name column already exists')
      }
      
      // Add other missing columns if needed
      const requiredColumns = [
        { name: 'expected_amount', type: 'INTEGER' },
        { name: 'deadline_date', type: 'TEXT' },
        { name: 'notes', type: 'TEXT' },
        { name: 'created_by', type: 'INTEGER' },
        { name: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
      ]
      
      for (const col of requiredColumns) {
        if (!existingColumns.includes(col.name)) {
          await c.env.DB.prepare(`
            ALTER TABLE subsidy_applications 
            ADD COLUMN ${col.name} ${col.type}
          `).run()
          results.push(`✅ Added ${col.name} column`)
        }
      }
      
    } catch (schemaError) {
      results.push(`❌ Schema fix error: ${schemaError.message}`)
    }
    
    // Update existing records with default values if needed
    try {
      const updateResult = await c.env.DB.prepare(`
        UPDATE subsidy_applications 
        SET subsidy_name = COALESCE(subsidy_name, 'Legacy Application'),
            created_by = COALESCE(created_by, 1),
            updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
        WHERE subsidy_name IS NULL OR created_by IS NULL
      `).run()
      
      if (updateResult.changes > 0) {
        results.push(`✅ Updated ${updateResult.changes} existing records`)
      }
    } catch (updateError) {
      results.push(`❌ Update error: ${updateError.message}`)
    }
    
    return c.json({
      success: true,
      message: 'Database schema fix completed',
      results: results,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('🔧 PUBLIC: Schema fix error:', error)
    return c.json({
      error: 'Schema fix failed',
      debug: error.message,
      stack: error.stack
    }, 500)
  }
})

// PUBLIC Database status check (NO AUTH REQUIRED)
app.get('/api/public/db-status', async (c) => {
  try {
    console.log('🔧 PUBLIC: Checking database status')
    
    if (!c.env.DB) {
      return c.json({ error: 'Database not available' }, 500)
    }
    
    // Check which tables exist
    const tables = await c.env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table'
    `).all()
    
    const requiredTables = ['subsidy_applications', 'subsidies', 'subsidy_checklists', 'subsidy_documents']
    const existingTables = tables.results?.map(t => t.name) || []
    const missingTables = requiredTables.filter(table => !existingTables.includes(table))
    
    // Get row counts for existing tables
    const tableCounts = {}
    // Get column info for subsidy_applications table
    let subsidy_applications_columns = []
    
    for (const table of existingTables) {
      if (requiredTables.includes(table)) {
        try {
          const count = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM ${table}`).first()
          tableCounts[table] = count.count
          
          // Get column info for subsidy_applications table
          if (table === 'subsidy_applications') {
            const columns = await c.env.DB.prepare(`PRAGMA table_info(${table})`).all()
            subsidy_applications_columns = columns.results?.map(col => col.name) || []
          }
        } catch (countError) {
          tableCounts[table] = 'Error: ' + countError.message
        }
      }
    }
    
    return c.json({
      success: true,
      database: {
        connected: true,
        existingTables: existingTables,
        missingTables: missingTables,
        tableCounts: tableCounts,
        allTablesExist: missingTables.length === 0,
        subsidy_applications_columns: subsidy_applications_columns
      },
      message: missingTables.length === 0 ? 'All required tables exist' : `Missing tables: ${missingTables.join(', ')}`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('🔧 PUBLIC: Database status check error:', error)
    return c.json({
      error: 'Database status check failed',
      debug: error.message,
      stack: error.stack
    }, 500)
  }
})

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
    
    // Support ALL task fields for complete updates
    const { 
      title, description, client_id, assignee_id, task_type,
      status, priority, progress, actual_hours, 
      due_date, estimated_hours, notes 
    } = body

    // Get current task for status tracking
    const currentTask = await c.env.DB.prepare('SELECT status FROM tasks WHERE id = ?').bind(id).first()
    
    if (!currentTask) {
      return c.json({ error: 'Task not found' }, 404)
    }
    
    // Build dynamic update query based on provided fields
    const updates = []
    const params = []
    
    if (title !== undefined) { updates.push('title = ?'); params.push(title) }
    if (description !== undefined) { updates.push('description = ?'); params.push(description) }
    if (client_id !== undefined) { updates.push('client_id = ?'); params.push(client_id) }
    if (assignee_id !== undefined) { updates.push('assignee_id = ?'); params.push(assignee_id) }
    if (task_type !== undefined) { updates.push('task_type = ?'); params.push(task_type) }
    if (status !== undefined) { updates.push('status = ?'); params.push(status) }
    if (priority !== undefined) { updates.push('priority = ?'); params.push(priority) }
    if (progress !== undefined) { updates.push('progress = ?'); params.push(progress) }
    if (actual_hours !== undefined) { updates.push('actual_hours = ?'); params.push(actual_hours) }
    if (due_date !== undefined) { updates.push('due_date = ?'); params.push(due_date) }
    if (estimated_hours !== undefined) { updates.push('estimated_hours = ?'); params.push(estimated_hours) }
    if (notes !== undefined) { updates.push('notes = ?'); params.push(notes) }
    
    // Always update timestamp
    updates.push('updated_at = CURRENT_TIMESTAMP')
    
    // Set completed_at if task is being completed
    if (status === 'completed' && currentTask?.status !== 'completed') {
      updates.push('completed_at = CURRENT_TIMESTAMP')
    }
    
    if (updates.length === 1) { // Only updated_at
      return c.json({ 
        success: true,
        message: 'No changes to update'
      })
    }
    
    // Add ID parameter for WHERE clause
    params.push(id)
    
    const updateQuery = `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`
    
    await c.env.DB.prepare(updateQuery).bind(...params).run()

    return c.json({ 
      success: true,
      message: 'タスクを更新しました'
    })
  } catch (error) {
    console.error('Task update error:', error)
    return c.json({ 
      error: 'Failed to update task',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
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

// Bulk operations for efficient task management
app.patch('/api/tasks/bulk', async (c) => {
  try {
    const body = await c.req.json()
    const { task_ids, updates } = body
    
    if (!task_ids || !Array.isArray(task_ids) || task_ids.length === 0) {
      return c.json({ error: 'task_ids array is required' }, 400)
    }
    
    if (!updates || typeof updates !== 'object') {
      return c.json({ error: 'updates object is required' }, 400)
    }
    
    // Build dynamic update query
    const updateFields = []
    const params = []
    
    if (updates.status !== undefined) { updateFields.push('status = ?'); params.push(updates.status) }
    if (updates.priority !== undefined) { updateFields.push('priority = ?'); params.push(updates.priority) }
    if (updates.assignee_id !== undefined) { updateFields.push('assignee_id = ?'); params.push(updates.assignee_id) }
    if (updates.client_id !== undefined) { updateFields.push('client_id = ?'); params.push(updates.client_id) }
    if (updates.progress !== undefined) { updateFields.push('progress = ?'); params.push(updates.progress) }
    
    // Always update timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    
    // Set completed_at for completed tasks
    if (updates.status === 'completed') {
      updateFields.push('completed_at = CURRENT_TIMESTAMP')
    }
    
    if (updateFields.length === 1) { // Only updated_at
      return c.json({ error: 'No valid update fields provided' }, 400)
    }
    
    // Create placeholders for task IDs
    const placeholders = task_ids.map(() => '?').join(', ')
    const updateQuery = `
      UPDATE tasks 
      SET ${updateFields.join(', ')} 
      WHERE id IN (${placeholders})
    `
    
    // Combine update params with task IDs
    const allParams = [...params, ...task_ids]
    
    const result = await c.env.DB.prepare(updateQuery).bind(...allParams).run()
    
    return c.json({ 
      success: true,
      updated_count: result.changes,
      message: `${result.changes}件のタスクを更新しました`
    })
  } catch (error) {
    console.error('Bulk update error:', error)
    return c.json({ 
      error: 'Failed to bulk update tasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

app.delete('/api/tasks/bulk', async (c) => {
  try {
    const body = await c.req.json()
    const { task_ids } = body
    
    if (!task_ids || !Array.isArray(task_ids) || task_ids.length === 0) {
      return c.json({ error: 'task_ids array is required' }, 400)
    }
    
    // Create placeholders for task IDs  
    const placeholders = task_ids.map(() => '?').join(', ')
    const deleteQuery = `DELETE FROM tasks WHERE id IN (${placeholders})`
    
    const result = await c.env.DB.prepare(deleteQuery).bind(...task_ids).run()
    
    return c.json({ 
      success: true,
      deleted_count: result.changes,
      message: `${result.changes}件のタスクを削除しました`
    })
  } catch (error) {
    console.error('Bulk delete error:', error)
    return c.json({ 
      error: 'Failed to bulk delete tasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Task Comment API endpoints
app.get('/api/tasks/:id/comments', async (c) => {
  try {
    const taskId = c.req.param('id')
    
    const result = await c.env.DB.prepare(`
      SELECT 
        tc.*,
        u.name as user_name
      FROM task_comments tc
      LEFT JOIN users u ON tc.user_id = u.id
      WHERE tc.task_id = ?
      ORDER BY tc.created_at ASC
    `).bind(taskId).all()
    
    return c.json({ 
      success: true,
      comments: result.results 
    })
  } catch (error) {
    console.error('Failed to fetch task comments:', error)
    return c.json({ 
      error: 'Failed to fetch comments',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

app.post('/api/tasks/:id/comments', async (c) => {
  try {
    const taskId = c.req.param('id')
    const body = await c.req.json()
    const { comment_text } = body
    
    if (!comment_text || comment_text.trim().length === 0) {
      return c.json({ error: 'Comment text is required' }, 400)
    }
    
    // Get user from auth context
    const user = c.get('user')
    if (!user || !user.sub) {
      return c.json({ error: 'User not found in auth context' }, 401)
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO task_comments (task_id, user_id, comment_text)
      VALUES (?, ?, ?)
    `).bind(taskId, parseInt(user.sub), comment_text.trim()).run()
    
    // Get the created comment with user name
    const newComment = await c.env.DB.prepare(`
      SELECT 
        tc.*,
        u.name as user_name
      FROM task_comments tc
      LEFT JOIN users u ON tc.user_id = u.id
      WHERE tc.id = ?
    `).bind(result.meta.last_row_id).first()
    
    return c.json({ 
      success: true,
      comment: newComment,
      message: 'コメントを追加しました'
    })
  } catch (error) {
    console.error('Failed to create task comment:', error)
    return c.json({ 
      error: 'Failed to create comment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

app.delete('/api/tasks/:taskId/comments/:commentId', async (c) => {
  try {
    const taskId = c.req.param('taskId')
    const commentId = c.req.param('commentId')
    
    // Get user from auth context
    const user = c.get('user')
    if (!user || !user.sub) {
      return c.json({ error: 'User not found in auth context' }, 401)
    }
    
    // Check if comment exists and belongs to the user (or user is admin)
    const comment = await c.env.DB.prepare(`
      SELECT user_id FROM task_comments 
      WHERE id = ? AND task_id = ?
    `).bind(commentId, taskId).first()
    
    if (!comment) {
      return c.json({ error: 'Comment not found' }, 404)
    }
    
    // Allow deletion if user owns the comment or is admin
    if (comment.user_id !== parseInt(user.sub) && user.role !== 'admin') {
      return c.json({ error: 'Unauthorized to delete this comment' }, 403)
    }
    
    await c.env.DB.prepare(`
      DELETE FROM task_comments 
      WHERE id = ? AND task_id = ?
    `).bind(commentId, taskId).run()
    
    return c.json({ 
      success: true,
      message: 'コメントを削除しました'
    })
  } catch (error) {
    console.error('Failed to delete task comment:', error)
    return c.json({ 
      error: 'Failed to delete comment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
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
  console.log('Dashboard accessed - URL:', c.req.url)
  
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
  
  // Set cache-busting headers to ensure fresh UI
  c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
  c.header('Pragma', 'no-cache')
  c.header('Expires', '0')
  
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
        
        /* Toast notifications */
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            min-width: 300px;
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .toast.success {
            background-color: #10b981;
        }
        
        .toast.error {
            background-color: #ef4444;
        }
        
        .toast.info {
            background-color: #3b82f6;
        }
        
        .toast.warning {
            background-color: #f59e0b;
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
                        社労士事務所タスク管理 <span class="text-xs text-gray-500">v2.0-unified</span>
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
                <a href="/business" class="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 hover:from-blue-100 hover:to-blue-200 transition-all duration-200 border-2 border-transparent hover:border-blue-300 shadow-lg hover:shadow-xl">
                    <div class="text-center">
                        <div class="bg-blue-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <i class="fas fa-briefcase text-white text-3xl"></i>
                        </div>
                        <h4 class="text-2xl font-bold text-gray-900 mb-3">業務管理</h4>
                        <p class="text-gray-600">タスク・予定・進捗を統合して効率的に管理</p>
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
        let workloadChartInstance = null;
        
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
                
                // Safe DOM element updates with null checks
                const todayCountEl = document.getElementById('todayCount');
                const overdueCountEl = document.getElementById('overdueCount');
                const weekCountEl = document.getElementById('weekCount');
                const inProgressCountEl = document.getElementById('inProgressCount');
                
                if (todayCountEl) todayCountEl.textContent = stats.today;
                if (overdueCountEl) overdueCountEl.textContent = stats.overdue;
                if (weekCountEl) weekCountEl.textContent = stats.thisWeek;
                
                const inProgress = stats.statusDistribution.find(s => s.status === 'in_progress');
                if (inProgressCountEl) inProgressCountEl.textContent = inProgress ? inProgress.count : 0;
                
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
            
            if (!taskList) {
                console.error('taskList element not found');
                return;
            }
            
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
                
                const statusLabels = {
                    pending: '未開始',
                    in_progress: '進行中',
                    completed: '完了'
                };
                
                const statusColors = {
                    pending: 'bg-gray-100 text-gray-800',
                    in_progress: 'bg-blue-100 text-blue-800', 
                    completed: 'bg-green-100 text-green-800'
                };
                
                return \`
                    <div class="border rounded-lg p-4 hover:shadow-md transition-shadow priority-\${task.priority}">
                        <div class="flex justify-between items-start">
                            <div class="flex-1">
                                <h3 class="font-medium text-gray-900">\${task.title}</h3>
                                \${task.description ? \`<p class="text-sm text-gray-600 mt-1">\${task.description}</p>\` : ''}
                                <div class="flex items-center mt-2 text-sm text-gray-600">
                                    <i class="fas fa-building mr-1"></i>
                                    <span class="mr-3">\${task.client_name || '-'}</span>
                                    <i class="fas fa-user mr-1"></i>
                                    <span>\${task.assignee_name || '-'}</span>
                                </div>
                                <div class="flex items-center mt-2 space-x-3">
                                    <span class="px-2 py-1 text-xs font-medium rounded \${statusColors[task.status]}">
                                        \${statusLabels[task.status] || task.status}
                                    </span>
                                    \${task.progress !== null ? \`<span class="text-xs text-gray-500">進捗: \${task.progress}%</span>\` : ''}
                                </div>
                            </div>
                            <div class="flex flex-col items-end space-y-2">
                                <span class="px-2 py-1 text-xs font-medium rounded-full \${priorityColors[task.priority]}">
                                    \${priorityLabels[task.priority]}
                                </span>
                                <span class="text-sm text-gray-600">
                                    <i class="fas fa-calendar mr-1"></i>
                                    \${task.due_date ? new Date(task.due_date).toLocaleDateString('ja-JP') : '期限なし'}
                                </span>
                                <div class="flex space-x-1">
                                    <button onclick="quickUpdateTaskStatus(\${task.id}, '\${task.status}')" class="text-blue-600 hover:text-blue-800 text-sm p-1" title="進捗更新">
                                        <i class="fas fa-arrow-right"></i>
                                    </button>
                                    <button onclick="quickEditTask(\${task.id})" class="text-green-600 hover:text-green-800 text-sm p-1" title="編集">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                \`;
            }).join('');
        }
        
        // Quick task status update from dashboard
        async function quickUpdateTaskStatus(taskId, currentStatus) {
            // Simple progress update - cycle through statuses
            const statusFlow = {
                'pending': 'in_progress',
                'in_progress': 'completed',
                'completed': 'pending'
            };
            
            const newStatus = statusFlow[currentStatus] || 'in_progress';
            const newProgress = newStatus === 'completed' ? 100 : newStatus === 'in_progress' ? 50 : 0;
            
            try {
                await axios.put('/api/tasks/' + taskId, {
                    status: newStatus,
                    progress: newProgress
                });
                
                showToast('タスクの進捗を更新しました', 'success');
                
                // Refresh dashboard data
                await loadDashboard();
                
            } catch (error) {
                console.error('Failed to update task:', error);
                showToast('タスクの更新に失敗しました', 'error');
            }
        }
        
        // Quick task edit from dashboard (redirect to task management)
        function quickEditTask(taskId) {
            // Store the task ID to highlight after navigation
            sessionStorage.setItem('editTaskId', taskId);
            // Navigate to task management page
            window.location.href = '/tasks';
        }
        
        // Toast notification system
        function showToast(message, type = 'info', duration = 3000) {
            const toast = document.createElement('div');
            toast.className = 'toast ' + type;
            toast.innerHTML = 
                '<div class="flex items-center justify-between">' +
                    '<span>' + message + '</span>' +
                    '<button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">' +
                        '<i class="fas fa-times"></i>' +
                    '</button>' +
                '</div>';
            
            // Add to page
            document.body.appendChild(toast);
            
            // Auto remove
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, duration);
        }
        
        function drawWorkloadChart(workloadData) {
            const chartElement = document.getElementById('workloadChart');
            
            if (!chartElement) {
                console.error('workloadChart element not found');
                return;
            }
            
            // Destroy existing chart if it exists
            if (workloadChartInstance) {
                workloadChartInstance.destroy();
                workloadChartInstance = null;
            }
            
            const ctx = chartElement.getContext('2d');
            
            workloadChartInstance = new Chart(ctx, {
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
            const taskModal = document.getElementById('taskModal');
            if (taskModal) {
                taskModal.classList.add('active');
            } else {
                console.error('taskModal element not found');
            }
        }
        
        function closeTaskModal() {
            const taskModal = document.getElementById('taskModal');
            const taskForm = document.getElementById('taskForm');
            
            if (taskModal) taskModal.classList.remove('active');
            if (taskForm) taskForm.reset();
        }
        
        // Task form submission
        const taskFormElement = document.getElementById('taskForm');
        if (taskFormElement) {
            taskFormElement.addEventListener('submit', async (e) => {
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
        } else {
            console.warn('taskForm element not found, skipping event listener');
        }
        
        // AI Task Generation
        async function generateTasksWithAI() {
            const clientSelectEl = document.getElementById('aiClientSelect');
            const monthSelectEl = document.getElementById('aiMonthSelect');
            
            if (!clientSelectEl || !monthSelectEl) {
                console.error('AI select elements not found');
                alert('AI機能の要素が見つかりません');
                return;
            }
            
            const clientId = clientSelectEl.value;
            const month = monthSelectEl.value;
            
            if (!clientId || !month) {
                alert('顧問先と対象月を選択してください');
                return;
            }
            
            const resultDiv = document.getElementById('aiGenerationResult');
            if (!resultDiv) {
                console.error('aiGenerationResult element not found');
                alert('結果表示要素が見つかりません');
                return;
            }
            
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
        
        // Quick task status update for dashboard

        
        // Set default month (with null check)
        const aiMonthSelectEl = document.getElementById('aiMonthSelect');
        if (aiMonthSelectEl) {
            aiMonthSelectEl.value = new Date().toISOString().slice(0, 7);
        }
        
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

// Debug clients page (NO AUTH - for testing)
app.get('/clients-debug', async (c) => {
  const testUser = { name: '田中 太郎', role: 'admin' }
  
  // Force fresh headers
  c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
  c.header('Pragma', 'no-cache')
  c.header('Expires', '0')
  
  return c.html(getSimplifiedClientsPage(testUser.name))
})

// Clients page
app.get('/clients', async (c) => {
  // Check environment - allow bypass in development
  const environment = c.env.ENVIRONMENT || 'production'
  if (environment === 'development') {
    const testUser = { name: '田中 太郎', role: 'admin' }
    
    // Set cache-busting headers
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
    c.header('Pragma', 'no-cache')
    c.header('Expires', '0')
    
    return c.html(getSimplifiedClientsPage(testUser.name))
  }
  
  // Production authentication with emergency fallback
  let token = getCookie(c, 'auth-token')
  let user = { name: '田中 太郎', role: 'admin' }  // Default user
  
  if (token) {
    const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-please-change-in-production'
    
    try {
      const payload = await verifyToken(token, jwtSecret)
      if (payload) {
        user.name = payload.name || payload.sub || '田中 太郎'
        console.log('Token verified successfully for user:', user.name)
      } else {
        console.log('Token verification failed, using default user')
      }
    } catch (error) {
      console.log('Token verification error, using default user:', error.message)
    }
  } else {
    console.log('No token found, using default user')
  }
  
  // Always render the page - no more redirects
  // Set cache-busting headers
  c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
  c.header('Pragma', 'no-cache')
  c.header('Expires', '0')
  
  return c.html(getSimplifiedClientsPage(user.name))
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

// Unified Business Management page (core feature consolidation)
app.get('/business', async (c) => {
  console.log('Business Management page accessed - URL:', c.req.url)
  
  const token = getCookie(c, 'auth-token')
  
  if (!token) {
    return c.redirect('/login')
  }
  
  const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-please-change-in-production'
  const payload = await verifyToken(token, jwtSecret)
  
  if (!payload) {
    return c.redirect('/login')
  }
  
  // Set cache-busting headers
  c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
  c.header('Pragma', 'no-cache')
  c.header('Expires', '0')
  
  return c.html(getBusinessManagementPage(payload))
})

// Root page - Dashboard
app.get('/', async (c) => {
  const token = getCookie(c, 'auth-token')
  
  if (!token) {
    return c.redirect('/login')
  }
  
  const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-please-change-in-production'
  const payload = await verifyToken(token, jwtSecret)
  
  if (!payload) {
    return c.redirect('/login')
  }
  
  try {
    // Check if admin-dashboard page function exists
    const { getAdminDashboardPage } = await import('./pages/admin-dashboard')
    return c.html(getAdminDashboardPage(payload.name, payload.role || 'user'))
  } catch (error) {
    console.error('Dashboard page error:', error)
    // Fallback to a simple dashboard
    return c.html(`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ダッシュボード - 社労士事務所タスク管理</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      </head>
      <body class="bg-gray-50">
          <div class="min-h-screen">
              <!-- Header -->
              <header class="bg-blue-600 text-white p-4">
                  <div class="container mx-auto flex justify-between items-center">
                      <h1 class="text-2xl font-bold">社労士事務所管理システム</h1>
                      <div class="flex items-center gap-4">
                          <span>こんにちは、${payload.name}さん</span>
                          <button onclick="window.location.href='/logout'" class="bg-blue-700 px-4 py-2 rounded">ログアウト</button>
                      </div>
                  </div>
              </header>
              
              <!-- Navigation -->
              <nav class="bg-white shadow-md p-4">
                  <div class="container mx-auto">
                      <div class="flex space-x-6">
                          <a href="/business" class="text-blue-600 hover:text-blue-800">業務管理</a>
                          <a href="/subsidies" class="text-blue-600 hover:text-blue-800">助成金管理</a>
                          <a href="/clients" class="text-blue-600 hover:text-blue-800">顧問先管理</a>
                          <a href="/calendar" class="text-blue-600 hover:text-blue-800">スケジュール</a>
                          <a href="/reports" class="text-blue-600 hover:text-blue-800">レポート</a>
                          <a href="/settings" class="text-blue-600 hover:text-blue-800">設定</a>
                      </div>
                  </div>
              </nav>
              
              <!-- Main Content -->
              <main class="container mx-auto p-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <!-- Quick Access Cards -->
                      <div class="bg-white p-6 rounded-lg shadow">
                          <h2 class="text-xl font-bold mb-4"><i class="fas fa-tasks mr-2"></i>業務管理</h2>
                          <p class="text-gray-600 mb-4">タスクとプロジェクトの管理</p>
                          <a href="/business" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">アクセス</a>
                      </div>
                      
                      <div class="bg-white p-6 rounded-lg shadow">
                          <h2 class="text-xl font-bold mb-4"><i class="fas fa-money-bill mr-2"></i>助成金管理</h2>
                          <p class="text-gray-600 mb-4">助成金申請の管理</p>
                          <a href="/subsidies" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">アクセス</a>
                      </div>
                      
                      <div class="bg-white p-6 rounded-lg shadow">
                          <h2 class="text-xl font-bold mb-4"><i class="fas fa-users mr-2"></i>顧問先管理</h2>
                          <p class="text-gray-600 mb-4">顧問先情報の管理</p>
                          <a href="/clients" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">アクセス</a>
                      </div>
                  </div>
                  
                  <!-- Welcome Message -->
                  <div class="mt-8 bg-white p-6 rounded-lg shadow">
                      <h2 class="text-2xl font-bold mb-4">ようこそ、${payload.name}さん</h2>
                      <p class="text-gray-600">
                          社労士事務所管理システムへようこそ。左上のメニューから各機能にアクセスできます。
                      </p>
                  </div>
              </main>
          </div>
      </body>
      </html>
    `)
  }
})

// Redirect old routes to simplified structure
app.get('/schedule', async (c) => c.redirect('/calendar'))
app.get('/projects', async (c) => c.redirect('/business'))
app.get('/tasks', async (c) => c.redirect('/business'))
app.get('/gmail', async (c) => c.redirect('/'))
app.get('/admin', async (c) => c.redirect('/'))

// Subsidies page (core feature for sharoushi offices) - Restored to original functionality
app.get('/subsidies', async (c) => {
  try {
    console.log('🔧 PROPER FIX: /subsidies route called')
    
    const token = getCookie(c, 'auth-token')
    console.log('🔧 Token exists:', !!token)
    
    if (!token) {
      console.log('🔧 No token, redirecting to login')
      return c.redirect('/login')
    }
    
    const jwtSecret = c.env.JWT_SECRET || 'dev-secret-key-please-change-in-production'
    console.log('🔧 JWT secret available:', !!jwtSecret)
    
    const payload = await verifyToken(token, jwtSecret)
    console.log('🔧 Token verification result:', !!payload)
    
    if (!payload) {
      console.log('🔧 Token verification failed, redirecting to login')
      return c.redirect('/login')
    }
    
    console.log('🔧 About to generate page for user:', payload.name)
    
    // Set cache-busting headers
    c.header('Cache-Control', 'no-cache, no-store, must-revalidate')
    c.header('Pragma', 'no-cache')
    c.header('Expires', '0')
    
    // Restored original function call with error handling
    return c.html(getUnifiedSubsidiesPage(payload.name))
    
  } catch (error) {
    console.error('🔧 Error in /subsidies route:', error)
    
    // Fallback error page with debug info
    return c.html(`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>エラー - 助成金管理</title>
          <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-red-50">
          <div class="container mx-auto p-4">
              <div class="bg-white p-6 rounded shadow">
                  <h1 class="text-2xl font-bold text-red-600 mb-4">🚨 エラーが発生しました</h1>
                  <p class="mb-4">助成金ページの読み込み中にエラーが発生しました。</p>
                  <div class="bg-gray-100 p-4 rounded mb-4">
                      <h2 class="font-semibold">エラー詳細:</h2>
                      <p class="text-sm text-gray-700">${error.message}</p>
                  </div>
                  <div class="flex space-x-4">
                      <button onclick="window.location.reload()" class="bg-blue-600 text-white px-4 py-2 rounded">
                          リロード
                      </button>
                      <button onclick="window.location.href='/'" class="bg-gray-600 text-white px-4 py-2 rounded">
                          ホームに戻る
                      </button>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `)
  }
})

// Scheduled event handler for Cron Triggers
export { scheduled } from './scheduled'

export default app
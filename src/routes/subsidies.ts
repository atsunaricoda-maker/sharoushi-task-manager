import { Hono } from 'hono'
import type { Bindings } from '../types'

const subsidiesRouter = new Hono<{ Bindings: Bindings }>()

// Test endpoint for debugging
subsidiesRouter.get('/test', async (c) => {
  try {
    console.log('Test endpoint called')
    
    if (!c.env.DB) {
      return c.json({ 
        error: 'DB not available',
        bindings: Object.keys(c.env || {})
      }, 500)
    }
    
    // Simple test query
    const result = await c.env.DB.prepare('SELECT 1 as test').first()
    
    return c.json({
      success: true,
      message: 'Database connection test successful',
      result,
      bindings: Object.keys(c.env)
    })
  } catch (error) {
    return c.json({
      error: 'Database test failed',
      message: error.message,
      stack: error.stack
    }, 500)
  }
})

// Get all subsidies (master list)
subsidiesRouter.get('/', async (c) => {
  try {
    console.log('GET /api/subsidies called')
    
    // Debug: Check if DB exists
    if (!c.env.DB) {
      console.error('Database not available in subsidies GET')
      return c.json({ 
        error: 'Database not configured', 
        debug: 'DB binding missing in subsidies GET endpoint' 
      }, 500)
    }
    
    console.log('Database connection available')
    
    // Check if subsidies table exists
    const tableCheck = await c.env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name='subsidies'
    `).first()
    
    if (!tableCheck) {
      console.error('subsidies table does not exist')
      return c.json({ 
        success: true,
        subsidies: [],
        debug: 'subsidies table not found - returning empty array'
      })
    }
    
    console.log('subsidies table exists')
    
    const result = await c.env.DB.prepare(`
      SELECT * FROM subsidies 
      WHERE is_active = 1 
      ORDER BY created_at DESC
    `).all()
    
    console.log('Query result:', result)
    
    return c.json({
      success: true,
      subsidies: result.results || [],
      debug: {
        resultCount: result.results?.length || 0,
        tableExists: true
      }
    })
  } catch (error) {
    console.error('Error fetching subsidies:', error)
    return c.json({ 
      error: 'Failed to fetch subsidies',
      debug: error.message,
      stack: error.stack 
    }, 500)
  }
})

// Get all subsidy applications
subsidiesRouter.get('/applications', async (c) => {
  try {
    // Debug: Check if user exists
    const user = c.get('user')
    if (!user) {
      console.error('No user found in context')
      return c.json({ error: 'User not authenticated', debug: 'No user in context' }, 401)
    }

    // Debug: Check if DB exists
    if (!c.env.DB) {
      console.error('Database not available')
      return c.json({ error: 'Database not configured', debug: 'DB binding missing' }, 500)
    }

    const userId = parseInt(user.sub)
    if (isNaN(userId)) {
      console.error('Invalid user ID:', user.sub)
      return c.json({ error: 'Invalid user ID', debug: `user.sub: ${user.sub}` }, 400)
    }

    // First, check if tables exist
    try {
      const tableCheck = await c.env.DB.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='subsidy_applications'
      `).first()
      
      if (!tableCheck) {
        console.error('subsidy_applications table does not exist')
        return c.json({ 
          error: 'Database not initialized', 
          debug: 'subsidy_applications table missing',
          success: true,
          applications: []
        })
      }
    } catch (tableError) {
      console.error('Error checking table existence:', tableError)
      return c.json({ 
        error: 'Database check failed', 
        debug: tableError.message,
        success: true,
        applications: []
      })
    }

    // Query with JOIN to get client and subsidy information
    const result = await c.env.DB.prepare(`
      SELECT 
        sa.*,
        c.name as client_name,
        s.name as subsidy_name,
        s.max_amount as subsidy_max_amount
      FROM subsidy_applications sa
      LEFT JOIN clients c ON sa.client_id = c.id
      LEFT JOIN subsidies s ON sa.subsidy_id = s.id
      WHERE sa.created_by = ?
      ORDER BY sa.created_at DESC
    `).bind(userId).all()
    
    return c.json({
      success: true,
      applications: result.results || [],
      debug: {
        userId,
        tableExists: true,
        resultCount: result.results?.length || 0
      }
    })
  } catch (error) {
    console.error('Error fetching subsidy applications:', error)
    return c.json({ 
      error: 'Failed to fetch subsidy applications', 
      debug: error.message,
      stack: error.stack
    }, 500)
  }
})

// Create new subsidy application
subsidiesRouter.post('/applications', async (c) => {
  try {
    console.log('Creating new subsidy application')
    
    const user = c.get('user')
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401)
    }
    
    const userId = parseInt(user.sub)
    if (isNaN(userId)) {
      return c.json({ error: 'Invalid user ID' }, 400)
    }
    
    const body = await c.req.json()
    console.log('Request body:', body)
    
    const { 
      subsidyId, clientId, amountRequested, submissionDeadline, notes
    } = body
    
    if (!subsidyId || !clientId || !amountRequested) {
      console.log('Missing required fields:', { subsidyId, clientId, amountRequested })
      return c.json({ error: '必要な項目が不足しています' }, 400)
    }

    // Begin transaction
    const result = await c.env.DB.prepare(`
      INSERT INTO subsidy_applications 
      (subsidy_id, client_id, amount_requested, submission_deadline, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(subsidyId, clientId, amountRequested, submissionDeadline, notes, userId).run()
    
    const applicationId = result.meta.last_row_id

    // Create default checklist items
    const defaultChecklist = [
      { name: '要件確認完了', category: '事前確認', required: true },
      { name: '申請書作成', category: '書類準備', required: true },
      { name: '添付書類収集', category: '書類準備', required: true },
      { name: '内部承認取得', category: '社内手続き', required: true },
      { name: '申請書提出', category: '提出', required: true }
    ]

    // Create default checklist items (with error handling)
    try {
      for (const [index, item] of defaultChecklist.entries()) {
        await c.env.DB.prepare(`
          INSERT INTO subsidy_checklists 
          (application_id, item_name, category, is_required, display_order)
          VALUES (?, ?, ?, ?, ?)
        `).bind(applicationId, item.name, item.category, item.required ? 1 : 0, index).run()
      }
      console.log('Checklist items created successfully')
    } catch (checklistError) {
      console.error('Failed to create checklist items:', checklistError)
      // Continue without checklist if table doesn't exist
    }

    return c.json({ 
      success: true,
      id: applicationId,
      message: '助成金申請プロジェクトを作成しました'
    })
  } catch (error) {
    console.error('Error creating subsidy application:', error)
    return c.json({ 
      error: 'Failed to create subsidy application',
      debug: error.message,
      stack: error.stack 
    }, 500)
  }
})

// Get single subsidy application by ID
subsidiesRouter.get('/applications/:id', async (c) => {
  try {
    const applicationId = c.req.param('id')
    const user = c.get('user')
    
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401)
    }
    
    const userId = parseInt(user.sub)
    
    // Get application details with related data
    const application = await c.env.DB.prepare(`
      SELECT 
        sa.*,
        c.name as client_name,
        s.name as subsidy_name,
        s.max_amount as subsidy_max_amount,
        s.description as subsidy_description
      FROM subsidy_applications sa
      LEFT JOIN clients c ON sa.client_id = c.id
      LEFT JOIN subsidies s ON sa.subsidy_id = s.id
      WHERE sa.id = ? AND sa.created_by = ?
    `).bind(applicationId, userId).first()
    
    if (!application) {
      return c.json({ error: 'Application not found' }, 404)
    }
    
    // Get checklist items
    let checklist = []
    try {
      const checklistResult = await c.env.DB.prepare(`
        SELECT * FROM subsidy_checklists 
        WHERE application_id = ? 
        ORDER BY display_order ASC
      `).bind(applicationId).all()
      
      checklist = checklistResult.results || []
    } catch (checklistError) {
      console.log('No checklist table or items found')
    }
    
    return c.json({
      success: true,
      application: {
        ...application,
        checklist
      }
    })
  } catch (error) {
    console.error('Error fetching application detail:', error)
    return c.json({ 
      error: 'Failed to fetch application detail',
      debug: error.message 
    }, 500)
  }
})

// Update subsidy application
subsidiesRouter.put('/applications/:id', async (c) => {
  try {
    const applicationId = c.req.param('id')
    const user = c.get('user')
    const body = await c.req.json()
    
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401)
    }
    
    const userId = parseInt(user.sub)
    const { status, notes, checklist } = body
    
    // Update main application
    if (status || notes !== undefined) {
      await c.env.DB.prepare(`
        UPDATE subsidy_applications 
        SET status = COALESCE(?, status), 
            notes = COALESCE(?, notes),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND created_by = ?
      `).bind(status, notes, applicationId, userId).run()
    }
    
    // Update checklist items
    if (checklist && Array.isArray(checklist)) {
      for (const item of checklist) {
        try {
          await c.env.DB.prepare(`
            UPDATE subsidy_checklists 
            SET is_completed = ?,
                completed_by = ?,
                completed_at = CASE 
                  WHEN ? = 1 THEN CURRENT_TIMESTAMP 
                  ELSE NULL 
                END
            WHERE id = ?
          `).bind(item.is_completed ? 1 : 0, userId, item.is_completed ? 1 : 0, item.id).run()
        } catch (checklistError) {
          console.log('Checklist update error for item', item.id, checklistError)
        }
      }
    }
    
    return c.json({ success: true, message: '申請情報を更新しました' })
  } catch (error) {
    console.error('Error updating application:', error)
    return c.json({ 
      error: 'Failed to update application',
      debug: error.message 
    }, 500)
  }
})

// Delete subsidy application
subsidiesRouter.delete('/applications/:id', async (c) => {
  try {
    const applicationId = c.req.param('id')
    const user = c.get('user')
    
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401)
    }
    
    const userId = parseInt(user.sub)
    
    // Check if application exists and belongs to user
    const application = await c.env.DB.prepare(`
      SELECT id FROM subsidy_applications 
      WHERE id = ? AND created_by = ?
    `).bind(applicationId, userId).first()
    
    if (!application) {
      return c.json({ error: 'Application not found' }, 404)
    }
    
    // Delete related checklist items first
    try {
      await c.env.DB.prepare(`
        DELETE FROM subsidy_checklists WHERE application_id = ?
      `).bind(applicationId).run()
    } catch (checklistError) {
      console.log('No checklist items to delete')
    }
    
    // Delete related documents
    try {
      await c.env.DB.prepare(`
        DELETE FROM subsidy_documents WHERE application_id = ?
      `).bind(applicationId).run()
    } catch (documentsError) {
      console.log('No documents to delete')
    }
    
    // Delete main application
    await c.env.DB.prepare(`
      DELETE FROM subsidy_applications WHERE id = ?
    `).bind(applicationId).run()
    
    return c.json({ success: true, message: '申請を削除しました' })
  } catch (error) {
    console.error('Error deleting application:', error)
    return c.json({ 
      error: 'Failed to delete application',
      debug: error.message 
    }, 500)
  }
})

// Search subsidies with filters
subsidiesRouter.get('/search', async (c) => {
  try {
    let query = `
      SELECT s.*, 
        CASE 
          WHEN s.application_end_date IS NULL THEN 0
          WHEN date(s.application_end_date) < date('now') THEN 1
          ELSE 0
        END as is_expired
      FROM subsidies s 
      WHERE s.is_active = 1
    `
    const params = []
    
    const category = c.req.query('category')
    const minAmount = c.req.query('minAmount')
    
    if (category) {
      query += ` AND s.category = ?`
      params.push(category)
    }
    
    if (minAmount) {
      query += ` AND s.max_amount >= ?`
      params.push(parseInt(minAmount))
    }
    
    query += ` ORDER BY s.application_end_date ASC, s.max_amount DESC`
    
    const result = await c.env.DB.prepare(query).bind(...params).all()
    
    return c.json({
      success: true,
      subsidies: result.results || []
    })
  } catch (error) {
    console.error('Error searching subsidies:', error)
    return c.json({ error: 'Failed to search subsidies' }, 500)
  }
})

// Get deadline alerts
subsidiesRouter.get('/alerts', async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '30')
    const user = c.get('user')
    const userId = parseInt(user.sub)

    const result = await c.env.DB.prepare(`
      SELECT 
        sa.id as applicationId,
        sa.submission_deadline as deadline,
        s.name as subsidyName,
        c.name as clientName,
        CAST(julianday(sa.submission_deadline) - julianday('now') as INTEGER) as daysRemaining
      FROM subsidy_applications sa
      JOIN subsidies s ON sa.subsidy_id = s.id
      JOIN clients c ON sa.client_id = c.id
      WHERE sa.created_by = ?
        AND sa.status IN ('planning', 'preparing', 'document_check')
        AND sa.submission_deadline IS NOT NULL
        AND date(sa.submission_deadline) BETWEEN date('now') AND date('now', '+' || ? || ' days')
      ORDER BY sa.submission_deadline ASC
    `).bind(userId, days).all()
    
    return c.json({
      success: true,
      alerts: result.results || []
    })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return c.json({ error: 'Failed to fetch alerts' }, 500)
  }
})

// Fetch updates from MHLW (Ministry of Health, Labour and Welfare)
subsidiesRouter.post('/fetch-updates', async (c) => {
  try {
    // Debug: Check if DB exists
    if (!c.env.DB) {
      console.error('Database not available for fetch-updates')
      return c.json({ error: 'Database not configured', debug: 'DB binding missing' }, 500)
    }

    // Check if subsidies table exists
    try {
      const tableCheck = await c.env.DB.prepare(`
        SELECT name FROM sqlite_master WHERE type='table' AND name='subsidies'
      `).first()
      
      if (!tableCheck) {
        console.error('subsidies table does not exist')
        // Create the table if it doesn't exist
        await c.env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS subsidies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            managing_organization TEXT NOT NULL,
            description TEXT,
            max_amount INTEGER,
            subsidy_rate REAL,
            application_period_type TEXT,
            url TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `).run()
        console.log('Created subsidies table')
      }
    } catch (tableError) {
      console.error('Error checking/creating subsidies table:', tableError)
      return c.json({ 
        error: 'Database initialization failed', 
        debug: tableError.message 
      }, 500)
    }

    const mockMHLWSubsidies = [
      {
        name: '雇用調整助成金',
        category: '雇用系',
        managing_organization: '厚生労働省',
        description: '経済上の理由により事業活動の縮小を余儀なくされた事業主に対する助成',
        max_amount: 15000,
        subsidy_rate: 80.0,
        application_period_type: 'anytime',
        url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/koyou/kyufukin/pageL07.html'
      },
      {
        name: 'キャリアアップ助成金',
        category: '育成系', 
        managing_organization: '厚生労働省',
        description: '有期雇用労働者、短時間労働者等の正社員化や処遇改善に対する助成',
        max_amount: 570000,
        subsidy_rate: 100.0,
        application_period_type: 'anytime',
        url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/part_haken/jigyounushi/career.html'
      },
      {
        name: '人材確保等支援助成金',
        category: '雇用系',
        managing_organization: '厚生労働省', 
        description: '雇用管理制度の導入等による雇用環境の改善に対する助成',
        max_amount: 720000,
        subsidy_rate: 75.0,
        application_period_type: 'anytime',
        url: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000158094.html'
      }
    ]

    let updatedCount = 0

    for (const subsidy of mockMHLWSubsidies) {
      try {
        // Check if subsidy already exists
        const existing = await c.env.DB.prepare(`
          SELECT id FROM subsidies WHERE name = ? AND managing_organization = ?
        `).bind(subsidy.name, subsidy.managing_organization).first()

        if (existing) {
          // Update existing
          await c.env.DB.prepare(`
            UPDATE subsidies SET 
              description = ?, max_amount = ?, subsidy_rate = ?,
              application_period_type = ?, url = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).bind(
            subsidy.description, subsidy.max_amount, subsidy.subsidy_rate,
            subsidy.application_period_type, subsidy.url, existing.id
          ).run()
        } else {
          // Insert new
          await c.env.DB.prepare(`
            INSERT INTO subsidies 
            (name, category, managing_organization, description, max_amount, 
             subsidy_rate, application_period_type, url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            subsidy.name, subsidy.category, subsidy.managing_organization,
            subsidy.description, subsidy.max_amount, subsidy.subsidy_rate,
            subsidy.application_period_type, subsidy.url
          ).run()
        }
        updatedCount++
      } catch (insertError) {
        console.error(`Error processing subsidy ${subsidy.name}:`, insertError)
        // Continue with next subsidy
      }
    }

    return c.json({
      success: true,
      updated_count: updatedCount,
      message: `厚労省から${updatedCount}件の助成金情報を更新しました`,
      debug: { tableExists: true, processedCount: mockMHLWSubsidies.length }
    })
  } catch (error) {
    console.error('Error fetching MHLW updates:', error)
    return c.json({ 
      error: 'Failed to fetch updates from MHLW', 
      debug: error.message,
      stack: error.stack 
    }, 500)
  }
})

// Fetch from all sources (support both GET and POST)
const fetchAllSources = async (c) => {
  try {
    console.log('fetch-all endpoint called')
    
    // Debug: Check if DB exists
    if (!c.env.DB) {
      console.error('Database not available in fetch-all')
      return c.json({ error: 'Database not configured', debug: 'DB binding missing' }, 500)
    }
    // Mock data for different sources
    const allSources = {
      mhlw: [
        {
          name: '雇用調整助成金',
          category: '雇用系',
          managing_organization: '厚生労働省',
          max_amount: 15000,
          subsidy_rate: 80.0
        },
        {
          name: '両立支援等助成金',
          category: '福祉系',
          managing_organization: '厚生労働省',
          max_amount: 1000000,
          subsidy_rate: 100.0
        }
      ],
      meti: [
        {
          name: 'ものづくり・商業・サービス生産性向上促進補助金',
          category: '設備投資系',
          managing_organization: '経済産業省',
          max_amount: 10000000,
          subsidy_rate: 50.0
        },
        {
          name: '小規模事業者持続化補助金',
          category: '創業系',
          managing_organization: '経済産業省',
          max_amount: 500000,
          subsidy_rate: 75.0
        }
      ],
      other: [
        {
          name: 'IT導入補助金',
          category: '設備投資系',
          managing_organization: 'IT導入補助金事務局',
          max_amount: 4500000,
          subsidy_rate: 75.0
        }
      ]
    }

    const counts = { mhlw: 0, meti: 0, other: 0 }
    let totalCount = 0

    for (const [source, subsidies] of Object.entries(allSources)) {
      for (const subsidy of subsidies) {
        // Check if exists
        const existing = await c.env.DB.prepare(`
          SELECT id FROM subsidies WHERE name = ? AND managing_organization = ?
        `).bind(subsidy.name, subsidy.managing_organization).first()

        if (!existing) {
          await c.env.DB.prepare(`
            INSERT INTO subsidies 
            (name, category, managing_organization, max_amount, subsidy_rate, application_period_type)
            VALUES (?, ?, ?, ?, ?, 'anytime')
          `).bind(
            subsidy.name, subsidy.category, subsidy.managing_organization,
            subsidy.max_amount, subsidy.subsidy_rate
          ).run()
          
          counts[source]++
          totalCount++
        }
      }
    }

    return c.json({
      success: true,
      total_count: totalCount,
      sources: counts,
      message: `全ソースから合計${totalCount}件の助成金情報を更新しました`
    })
  } catch (error) {
    console.error('Error fetching all sources:', error)
    return c.json({ 
      error: 'Failed to fetch from all sources',
      debug: error.message,
      stack: error.stack 
    }, 500)
  }
}

// Support both GET and POST for fetch-all
subsidiesRouter.post('/fetch-all', fetchAllSources)
subsidiesRouter.get('/fetch-all', fetchAllSources)

// Upload document for application
subsidiesRouter.post('/applications/:id/documents', async (c) => {
  try {
    const applicationId = c.req.param('id')
    const user = c.get('user')
    
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401)
    }
    
    const userId = parseInt(user.sub)
    
    // Check if application belongs to user
    const application = await c.env.DB.prepare(`
      SELECT id FROM subsidy_applications 
      WHERE id = ? AND created_by = ?
    `).bind(applicationId, userId).first()
    
    if (!application) {
      return c.json({ error: 'Application not found' }, 404)
    }
    
    const formData = await c.req.formData()
    const file = formData.get('file')
    const documentName = formData.get('document_name') || file?.name
    const documentType = formData.get('document_type') || '申請書類'
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400)
    }
    
    // For now, we'll store file info in database
    const fileSize = file.size
    const fileName = file.name
    const fileType = file.type
    
    // Store document info in database
    try {
      // Create subsidy_documents table if it doesn't exist
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
    } catch (tableError) {
      console.log('Documents table may already exist')
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO subsidy_documents 
      (application_id, document_name, document_type, file_name, file_size, file_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(applicationId, documentName, documentType, fileName, fileSize, fileType).run()
    
    return c.json({ 
      success: true, 
      message: 'ファイルをアップロードしました',
      document_id: result.meta.last_row_id 
    })
  } catch (error) {
    console.error('Error uploading document:', error)
    return c.json({ 
      error: 'Failed to upload document',
      debug: error.message 
    }, 500)
  }
})

// Get documents for application
subsidiesRouter.get('/applications/:id/documents', async (c) => {
  try {
    const applicationId = c.req.param('id')
    const user = c.get('user')
    
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401)
    }
    
    const userId = parseInt(user.sub)
    
    // Check if application belongs to user
    const application = await c.env.DB.prepare(`
      SELECT id FROM subsidy_applications 
      WHERE id = ? AND created_by = ?
    `).bind(applicationId, userId).first()
    
    if (!application) {
      return c.json({ error: 'Application not found' }, 404)
    }
    
    // Get documents
    try {
      const result = await c.env.DB.prepare(`
        SELECT * FROM subsidy_documents 
        WHERE application_id = ? 
        ORDER BY uploaded_at DESC
      `).bind(applicationId).all()
      
      return c.json({
        success: true,
        documents: result.results || []
      })
    } catch (documentsError) {
      return c.json({
        success: true,
        documents: []
      })
    }
  } catch (error) {
    console.error('Error fetching documents:', error)
    return c.json({ 
      error: 'Failed to fetch documents',
      debug: error.message 
    }, 500)
  }
})

// External search
subsidiesRouter.get('/search-external', async (c) => {
  try {
    const query = c.req.query('q')
    const org = c.req.query('org')

    if (!query) {
      return c.json({ error: 'Search query is required' }, 400)
    }

    // Mock external search results
    const mockResults = [
      {
        name: `${query}関連助成金A`,
        managing_organization: org === 'mhlw' ? '厚生労働省' : 'その他機関',
        url: 'https://example.com/subsidy1',
        description: `${query}に関する助成金制度です`
      },
      {
        name: `${query}支援補助金B`, 
        managing_organization: org === 'mhlw' ? '厚生労働省' : '経済産業省',
        url: 'https://example.com/subsidy2',
        description: `${query}事業者向けの支援制度`
      }
    ].filter(result => !org || result.managing_organization.includes(
      org === 'mhlw' ? '厚生労働省' : org === 'jgrants' ? 'jGrants' : ''
    ))

    return c.json({
      success: true,
      total_count: mockResults.length,
      results: mockResults
    })
  } catch (error) {
    console.error('Error in external search:', error)
    return c.json({ error: 'External search failed' }, 500)
  }
})

// Get subsidy database (for admin tab)
subsidiesRouter.get('/database', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT 
        s.*,
        COUNT(sa.id) as application_count,
        CASE 
          WHEN s.application_end_date IS NULL THEN 'ongoing'
          WHEN date(s.application_end_date) < date('now') THEN 'expired'
          ELSE 'active'
        END as status
      FROM subsidies s
      LEFT JOIN subsidy_applications sa ON s.id = sa.subsidy_id
      GROUP BY s.id
      ORDER BY s.updated_at DESC
    `).all()
    
    return c.json({
      success: true,
      subsidies: result.results || []
    })
  } catch (error) {
    console.error('Error fetching subsidy database:', error)
    return c.json({ error: 'Failed to fetch subsidy database' }, 500)
  }
})

// Get single application detail
subsidiesRouter.get('/applications/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const user = c.get('user')
    const userId = parseInt(user.sub)

    const application = await c.env.DB.prepare(`
      SELECT 
        sa.*, 
        s.name as subsidy_name,
        s.description as subsidy_description,
        s.max_amount,
        s.subsidy_rate,
        s.requirements,
        s.managing_organization,
        s.url as subsidy_url,
        c.name as client_name
      FROM subsidy_applications sa
      JOIN subsidies s ON sa.subsidy_id = s.id
      JOIN clients c ON sa.client_id = c.id
      WHERE sa.id = ? AND sa.created_by = ?
    `).bind(id, userId).first()

    if (!application) {
      return c.json({ error: '申請が見つかりません' }, 404)
    }

    // Get checklist
    const checklist = await c.env.DB.prepare(`
      SELECT * FROM subsidy_checklists 
      WHERE application_id = ? 
      ORDER BY display_order, id
    `).bind(id).all()

    // Get documents
    const documents = await c.env.DB.prepare(`
      SELECT * FROM subsidy_documents 
      WHERE application_id = ?
      ORDER BY created_at DESC
    `).bind(id).all()

    // Get schedules
    const schedules = await c.env.DB.prepare(`
      SELECT * FROM subsidy_schedules 
      WHERE application_id = ?
      ORDER BY scheduled_date ASC
    `).bind(id).all()

    return c.json({
      success: true,
      application: {
        ...application,
        checklist: checklist.results || [],
        documents: documents.results || [],
        schedules: schedules.results || []
      }
    })
  } catch (error) {
    console.error('Error fetching application detail:', error)
    return c.json({ error: 'Failed to fetch application detail' }, 500)
  }
})

export default subsidiesRouter
/**
 * Subsidy Management Routes
 * 助成金申請管理のAPIエンドポイント
 */

import { Hono } from 'hono'
import { SubsidyManager } from '../lib/subsidy-manager'
import { SubsidyFetcher } from '../lib/subsidy-fetcher'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
  GEMINI_API_KEY: string
}

const subsidiesRouter = new Hono<{ Bindings: Bindings }>()

/**
 * 助成金一覧取得
 */
subsidiesRouter.get('/', async (c) => {
  try {
    const category = c.req.query('category')
    const isActive = c.req.query('active') !== 'false'
    
    let query = `
      SELECT * FROM subsidies 
      WHERE is_active = ?
    `
    const params: any[] = [isActive ? 1 : 0]
    
    if (category) {
      query += ` AND category = ?`
      params.push(category)
    }
    
    query += ` ORDER BY max_amount DESC, name ASC`
    
    const subsidies = await c.env.DB.prepare(query).bind(...params).all()
    
    return c.json({
      subsidies: subsidies.results.map(s => ({
        ...s,
        requirements: JSON.parse(s.requirements as string || '[]'),
        requiredDocuments: JSON.parse(s.required_documents as string || '[]')
      })),
      totalCount: subsidies.results.length
    })
  } catch (error: any) {
    console.error('Failed to fetch subsidies:', error)
    return c.json({ error: 'Failed to fetch subsidies' }, 500)
  }
})

/**
 * 利用可能な助成金を検索
 */
subsidiesRouter.get('/search', async (c) => {
  try {
    const clientId = c.req.query('clientId')
    const category = c.req.query('category')
    const minAmount = c.req.query('minAmount')
    
    const manager = new SubsidyManager(c.env.DB, c.env.GEMINI_API_KEY)
    const subsidies = await manager.searchAvailableSubsidies({
      clientId: clientId ? parseInt(clientId) : undefined,
      category,
      minAmount: minAmount ? parseInt(minAmount) : undefined,
      includeExpired: false
    })
    
    return c.json({
      subsidies,
      totalCount: subsidies.length
    })
  } catch (error: any) {
    console.error('Failed to search subsidies:', error)
    return c.json({ error: 'Failed to search subsidies' }, 500)
  }
})

/**
 * 助成金申請一覧取得
 */
subsidiesRouter.get('/applications', async (c) => {
  try {
    const clientId = c.req.query('clientId')
    const status = c.req.query('status')
    
    let query = `
      SELECT 
        sa.*,
        s.name as subsidy_name,
        s.category as subsidy_category,
        s.max_amount as max_amount,
        c.name as client_name,
        u.name as created_by_name
      FROM subsidy_applications sa
      JOIN subsidies s ON sa.subsidy_id = s.id
      JOIN clients c ON sa.client_id = c.id
      LEFT JOIN users u ON sa.created_by = u.id
      WHERE 1=1
    `
    const params: any[] = []
    
    if (clientId) {
      query += ` AND sa.client_id = ?`
      params.push(parseInt(clientId))
    }
    
    if (status) {
      query += ` AND sa.status = ?`
      params.push(status)
    }
    
    query += ` ORDER BY sa.submission_deadline ASC, sa.created_at DESC`
    
    const applications = await c.env.DB.prepare(query).bind(...params).all()
    
    // 各申請の進捗を計算
    const manager = new SubsidyManager(c.env.DB)
    const applicationsWithProgress = await Promise.all(
      applications.results.map(async (app) => {
        const progress = await manager.calculateProgress(app.id as number)
        return {
          ...app,
          progress: progress.overall
        }
      })
    )
    
    return c.json({
      applications: applicationsWithProgress,
      totalCount: applicationsWithProgress.length
    })
  } catch (error: any) {
    console.error('Failed to fetch applications:', error)
    return c.json({ error: 'Failed to fetch applications' }, 500)
  }
})

/**
 * 助成金申請詳細取得
 */
subsidiesRouter.get('/applications/:id', async (c) => {
  try {
    const applicationId = parseInt(c.req.param('id'))
    
    // 申請基本情報
    const application = await c.env.DB.prepare(`
      SELECT 
        sa.*,
        s.name as subsidy_name,
        s.category as subsidy_category,
        s.description as subsidy_description,
        s.max_amount,
        s.subsidy_rate,
        s.requirements,
        s.required_documents,
        s.url as subsidy_url,
        c.name as client_name,
        c.industry as client_industry,
        u.name as created_by_name
      FROM subsidy_applications sa
      JOIN subsidies s ON sa.subsidy_id = s.id
      JOIN clients c ON sa.client_id = c.id
      LEFT JOIN users u ON sa.created_by = u.id
      WHERE sa.id = ?
    `).bind(applicationId).first()
    
    if (!application) {
      return c.json({ error: 'Application not found' }, 404)
    }
    
    // チェックリスト
    const checklists = await c.env.DB.prepare(`
      SELECT 
        cl.*,
        u.name as completed_by_name
      FROM subsidy_checklists cl
      LEFT JOIN users u ON cl.completed_by = u.id
      WHERE cl.application_id = ?
      ORDER BY cl.display_order, cl.category, cl.item_name
    `).bind(applicationId).all()
    
    // 書類リスト
    const documents = await c.env.DB.prepare(`
      SELECT * FROM subsidy_documents
      WHERE application_id = ?
      ORDER BY document_type, document_name
    `).bind(applicationId).all()
    
    // スケジュール
    const schedules = await c.env.DB.prepare(`
      SELECT * FROM subsidy_schedules
      WHERE application_id = ?
      ORDER BY scheduled_date ASC
    `).bind(applicationId).all()
    
    // 進捗履歴
    const progressLogs = await c.env.DB.prepare(`
      SELECT 
        pl.*,
        u.name as user_name
      FROM subsidy_progress_logs pl
      LEFT JOIN users u ON pl.user_id = u.id
      WHERE pl.application_id = ?
      ORDER BY pl.created_at DESC
      LIMIT 20
    `).bind(applicationId).all()
    
    // 進捗計算
    const manager = new SubsidyManager(c.env.DB)
    const progress = await manager.calculateProgress(applicationId)
    
    return c.json({
      application: {
        ...application,
        requirements: JSON.parse(application.requirements as string || '[]'),
        requiredDocuments: JSON.parse(application.required_documents as string || '[]'),
        progress,
        checklists: checklists.results,
        documents: documents.results,
        schedules: schedules.results,
        progressLogs: progressLogs.results
      }
    })
  } catch (error: any) {
    console.error('Failed to fetch application details:', error)
    return c.json({ error: 'Failed to fetch application details' }, 500)
  }
})

/**
 * 助成金申請作成
 */
subsidiesRouter.post('/applications', async (c) => {
  try {
    const user = c.get('user')
    const {
      subsidyId,
      clientId,
      amountRequested,
      submissionDeadline,
      notes
    } = await c.req.json()
    
    if (!subsidyId || !clientId || !amountRequested || !submissionDeadline) {
      return c.json({ 
        error: 'Required fields: subsidyId, clientId, amountRequested, submissionDeadline' 
      }, 400)
    }
    
    const manager = new SubsidyManager(c.env.DB, c.env.GEMINI_API_KEY)
    const applicationId = await manager.createApplication(
      subsidyId,
      clientId,
      user.id,
      {
        amountRequested,
        submissionDeadline,
        notes
      }
    )
    
    return c.json({
      success: true,
      applicationId,
      message: '助成金申請プロジェクトを作成しました'
    })
  } catch (error: any) {
    console.error('Failed to create application:', error)
    return c.json({ 
      error: 'Failed to create application', 
      message: error.message 
    }, 500)
  }
})

/**
 * 申請ステータス更新
 */
subsidiesRouter.put('/applications/:id/status', async (c) => {
  try {
    const user = c.get('user')
    const applicationId = parseInt(c.req.param('id'))
    const {
      status,
      applicationNumber,
      applicationDate,
      approvalDate,
      amountApproved,
      rejectionReason
    } = await c.req.json()
    
    if (!status) {
      return c.json({ error: 'Status is required' }, 400)
    }
    
    const manager = new SubsidyManager(c.env.DB)
    await manager.updateApplicationStatus(
      applicationId,
      status,
      user.id,
      {
        applicationNumber,
        applicationDate,
        approvalDate,
        amountApproved,
        rejectionReason
      }
    )
    
    return c.json({
      success: true,
      message: 'ステータスを更新しました'
    })
  } catch (error: any) {
    console.error('Failed to update status:', error)
    return c.json({ 
      error: 'Failed to update status', 
      message: error.message 
    }, 500)
  }
})

/**
 * チェックリスト項目の完了
 */
subsidiesRouter.put('/checklists/:id/complete', async (c) => {
  try {
    const user = c.get('user')
    const itemId = parseInt(c.req.param('id'))
    const { notes } = await c.req.json()
    
    const manager = new SubsidyManager(c.env.DB)
    await manager.completeChecklistItem(itemId, user.id, notes)
    
    return c.json({
      success: true,
      message: 'チェックリスト項目を完了しました'
    })
  } catch (error: any) {
    console.error('Failed to complete checklist item:', error)
    return c.json({ error: 'Failed to complete checklist item' }, 500)
  }
})

/**
 * 書類アップロード記録
 */
subsidiesRouter.put('/documents/:id/upload', async (c) => {
  try {
    const documentId = parseInt(c.req.param('id'))
    const { driveFileId, fileUrl } = await c.req.json()
    
    if (!driveFileId || !fileUrl) {
      return c.json({ error: 'driveFileId and fileUrl are required' }, 400)
    }
    
    const manager = new SubsidyManager(c.env.DB)
    await manager.uploadDocument(documentId, driveFileId, fileUrl)
    
    return c.json({
      success: true,
      message: '書類をアップロードしました'
    })
  } catch (error: any) {
    console.error('Failed to upload document:', error)
    return c.json({ error: 'Failed to upload document' }, 500)
  }
})

/**
 * AI書類生成
 */
subsidiesRouter.post('/applications/:id/generate-document', async (c) => {
  try {
    const applicationId = parseInt(c.req.param('id'))
    const { documentType } = await c.req.json()
    
    if (!['business_plan', 'budget', 'application_form'].includes(documentType)) {
      return c.json({ error: 'Invalid document type' }, 400)
    }
    
    const manager = new SubsidyManager(c.env.DB, c.env.GEMINI_API_KEY)
    const content = await manager.generateApplicationDocuments(
      applicationId,
      documentType as any
    )
    
    return c.json({
      success: true,
      content,
      documentType
    })
  } catch (error: any) {
    console.error('Failed to generate document:', error)
    return c.json({ 
      error: 'Failed to generate document', 
      message: error.message 
    }, 500)
  }
})

/**
 * 期限アラート取得
 */
subsidiesRouter.get('/alerts', async (c) => {
  try {
    const daysAhead = parseInt(c.req.query('days') || '30')
    
    const manager = new SubsidyManager(c.env.DB)
    const alerts = await manager.getDeadlineAlerts(daysAhead)
    
    return c.json({
      alerts,
      totalCount: alerts.length
    })
  } catch (error: any) {
    console.error('Failed to get alerts:', error)
    return c.json({ error: 'Failed to get alerts' }, 500)
  }
})

/**
 * 助成金マスターデータ登録
 */
subsidiesRouter.post('/', async (c) => {
  try {
    const user = c.get('user')
    const subsidyData = await c.req.json()
    
    // バリデーション
    const requiredFields = ['name', 'category', 'managingOrganization', 'maxAmount']
    for (const field of requiredFields) {
      if (!subsidyData[field]) {
        return c.json({ error: `${field} is required` }, 400)
      }
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO subsidies (
        name, category, managing_organization,
        description, max_amount, subsidy_rate,
        requirements, required_documents,
        application_period_type, application_start_date,
        application_end_date, url, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      subsidyData.name,
      subsidyData.category,
      subsidyData.managingOrganization,
      subsidyData.description || '',
      subsidyData.maxAmount,
      subsidyData.subsidyRate || 100,
      JSON.stringify(subsidyData.requirements || []),
      JSON.stringify(subsidyData.requiredDocuments || []),
      subsidyData.applicationPeriodType || 'anytime',
      subsidyData.applicationStartDate || null,
      subsidyData.applicationEndDate || null,
      subsidyData.url || '',
      1
    ).run()
    
    return c.json({
      success: true,
      subsidyId: result.meta.last_row_id,
      message: '助成金情報を登録しました'
    })
  } catch (error: any) {
    console.error('Failed to create subsidy:', error)
    return c.json({ 
      error: 'Failed to create subsidy', 
      message: error.message 
    }, 500)
  }
})

/**
 * 助成金情報を外部ソースから取得・更新
 * （管理者権限が必要）
 */
subsidiesRouter.post('/fetch-updates', async (c) => {
  try {
    const user = c.get('user')
    
    // 管理者権限チェック（実装は簡易版）
    // 本番環境では適切な権限管理を実装すること
    if (user.email !== 'admin@example.com' && !user.email.includes('admin')) {
      return c.json({ error: 'Admin access required' }, 403)
    }
    
    const fetcher = new SubsidyFetcher(c.env.DB)
    
    // 厚労省から最新情報を取得
    const mhlwSubsidies = await fetcher.fetchFromMHLW()
    
    // データベースを更新
    await fetcher.updateDatabase(mhlwSubsidies)
    
    return c.json({
      success: true,
      message: 'Subsidy information updated',
      updated_count: mhlwSubsidies.length,
      subsidies: mhlwSubsidies.map(s => ({
        name: s.name,
        category: s.category,
        organization: s.managing_organization,
        url: s.url
      }))
    })
  } catch (error: any) {
    console.error('Failed to fetch subsidy updates:', error)
    return c.json({ 
      error: 'Failed to fetch subsidy updates', 
      message: error.message 
    }, 500)
  }
})

/**
 * 助成金情報の全ソース一括取得
 * （管理者権限が必要）
 */
subsidiesRouter.post('/fetch-all', async (c) => {
  try {
    const user = c.get('user')
    
    // 管理者権限チェック
    if (user.email !== 'admin@example.com' && !user.email.includes('admin')) {
      return c.json({ error: 'Admin access required' }, 403)
    }
    
    const fetcher = new SubsidyFetcher(c.env.DB)
    
    // 全ソースから取得
    const allSubsidies = await fetcher.fetchAll()
    
    // データベースを更新
    await fetcher.updateDatabase(allSubsidies)
    
    return c.json({
      success: true,
      message: 'All subsidy sources updated',
      total_count: allSubsidies.length,
      sources: {
        mhlw: allSubsidies.filter(s => s.managing_organization === '厚生労働省').length,
        meti: allSubsidies.filter(s => s.managing_organization === '経済産業省').length,
        other: allSubsidies.filter(s => 
          s.managing_organization !== '厚生労働省' && 
          s.managing_organization !== '経済産業省'
        ).length
      }
    })
  } catch (error: any) {
    console.error('Failed to fetch all subsidies:', error)
    return c.json({ 
      error: 'Failed to fetch all subsidies', 
      message: error.message 
    }, 500)
  }
})

/**
 * 助成金情報の検索（外部APIとの連携）
 */
subsidiesRouter.get('/search-external', async (c) => {
  try {
    const query = c.req.query('q')
    const organization = c.req.query('org')
    
    if (!query) {
      return c.json({ error: 'Query parameter is required' }, 400)
    }
    
    const fetcher = new SubsidyFetcher(c.env.DB)
    
    // 組織別に検索
    let results: any[] = []
    
    if (!organization || organization === 'mhlw') {
      const mhlwResults = await fetcher.fetchFromMHLW()
      results = results.concat(
        mhlwResults.filter(s => 
          s.name.includes(query) || 
          s.description?.includes(query) ||
          s.category.includes(query)
        )
      )
    }
    
    if (!organization || organization === 'jgrants') {
      const jGrantsResults = await fetcher.fetchFromJGrants()
      results = results.concat(
        jGrantsResults.filter(s => 
          s.name.includes(query) || 
          s.description?.includes(query)
        )
      )
    }
    
    return c.json({
      success: true,
      query,
      results: results.slice(0, 50), // 最大50件
      total_count: results.length
    })
  } catch (error: any) {
    console.error('Failed to search external subsidies:', error)
    return c.json({ 
      error: 'Failed to search external subsidies', 
      message: error.message 
    }, 500)
  }
})

export { subsidiesRouter }
/**
 * 助成金申請管理サービス
 * 助成金の申請プロセス全体を管理
 */

import { GeminiService } from './gemini'

interface SubsidyInfo {
  id?: number
  name: string
  category: string
  managingOrganization: string
  description: string
  maxAmount: number
  subsidyRate: number
  requirements: string[]
  requiredDocuments: string[]
  applicationPeriodType: 'fixed' | 'anytime' | 'periodic'
  applicationStartDate?: string
  applicationEndDate?: string
  url?: string
}

interface SubsidyApplication {
  id?: number
  subsidyId: number
  clientId: number
  status: string
  applicationNumber?: string
  applicationDate?: string
  amountRequested: number
  submissionDeadline: string
  notes?: string
}

interface ChecklistItem {
  itemName: string
  category: string
  isRequired: boolean
  isCompleted: boolean
  notes?: string
}

interface DocumentItem {
  documentName: string
  documentType: string
  status: string
  dueDate?: string
  driveFileId?: string
  notes?: string
}

export class SubsidyManager {
  private db: D1Database
  private geminiService?: GeminiService

  constructor(db: D1Database, geminiApiKey?: string) {
    this.db = db
    if (geminiApiKey) {
      this.geminiService = new GeminiService(geminiApiKey)
    }
  }

  /**
   * 利用可能な助成金を検索
   */
  async searchAvailableSubsidies(criteria: {
    clientId?: number
    category?: string
    minAmount?: number
    includeExpired?: boolean
  }): Promise<SubsidyInfo[]> {
    let query = `
      SELECT * FROM subsidies 
      WHERE is_active = 1
    `
    const params: any[] = []

    if (criteria.category) {
      query += ` AND category = ?`
      params.push(criteria.category)
    }

    if (criteria.minAmount) {
      query += ` AND max_amount >= ?`
      params.push(criteria.minAmount)
    }

    if (!criteria.includeExpired) {
      query += ` AND (application_end_date IS NULL OR application_end_date >= date('now'))`
    }

    query += ` ORDER BY max_amount DESC`

    const results = await this.db.prepare(query).bind(...params).all()

    return results.results.map(r => ({
      id: r.id as number,
      name: r.name as string,
      category: r.category as string,
      managingOrganization: r.managing_organization as string,
      description: r.description as string,
      maxAmount: r.max_amount as number,
      subsidyRate: r.subsidy_rate as number,
      requirements: JSON.parse(r.requirements as string || '[]'),
      requiredDocuments: JSON.parse(r.required_documents as string || '[]'),
      applicationPeriodType: r.application_period_type as any,
      applicationStartDate: r.application_start_date as string,
      applicationEndDate: r.application_end_date as string,
      url: r.url as string
    }))
  }

  /**
   * 助成金申請プロジェクトを作成
   */
  async createApplication(
    subsidyId: number,
    clientId: number,
    userId: number,
    details: {
      amountRequested: number
      submissionDeadline: string
      notes?: string
    }
  ): Promise<number> {
    // 助成金情報を取得
    const subsidy = await this.db.prepare(`
      SELECT * FROM subsidies WHERE id = ?
    `).bind(subsidyId).first()

    if (!subsidy) {
      throw new Error('Subsidy not found')
    }

    // 申請プロジェクトを作成
    const result = await this.db.prepare(`
      INSERT INTO subsidy_applications (
        subsidy_id, client_id, status, 
        amount_requested, submission_deadline, 
        notes, created_by, created_at
      ) VALUES (?, ?, 'planning', ?, ?, ?, ?, datetime('now'))
    `).bind(
      subsidyId,
      clientId,
      details.amountRequested,
      details.submissionDeadline,
      details.notes || '',
      userId
    ).run()

    const applicationId = result.meta.last_row_id as number

    // デフォルトのチェックリストを作成
    await this.createDefaultChecklist(applicationId, subsidy)

    // デフォルトの書類リストを作成
    await this.createDefaultDocuments(applicationId, subsidy)

    // スケジュールを作成
    await this.createDefaultSchedule(applicationId, details.submissionDeadline)

    return applicationId
  }

  /**
   * デフォルトチェックリストの作成
   */
  private async createDefaultChecklist(applicationId: number, subsidy: any): Promise<void> {
    const checklistItems = [
      // 要件確認
      { category: '要件確認', itemName: '申請資格の確認', isRequired: true, displayOrder: 1 },
      { category: '要件確認', itemName: '対象事業の確認', isRequired: true, displayOrder: 2 },
      { category: '要件確認', itemName: '申請期限の確認', isRequired: true, displayOrder: 3 },
      { category: '要件確認', itemName: '必要書類の確認', isRequired: true, displayOrder: 4 },
      
      // 書類準備
      { category: '書類準備', itemName: '申請書の作成', isRequired: true, displayOrder: 10 },
      { category: '書類準備', itemName: '事業計画書の作成', isRequired: true, displayOrder: 11 },
      { category: '書類準備', itemName: '収支予算書の作成', isRequired: true, displayOrder: 12 },
      { category: '書類準備', itemName: '登記簿謄本の取得', isRequired: true, displayOrder: 13 },
      { category: '書類準備', itemName: '決算書の準備', isRequired: true, displayOrder: 14 },
      { category: '書類準備', itemName: '納税証明書の取得', isRequired: true, displayOrder: 15 },
      
      // 申請前確認
      { category: '申請前確認', itemName: '書類の整合性確認', isRequired: true, displayOrder: 20 },
      { category: '申請前確認', itemName: '添付書類の確認', isRequired: true, displayOrder: 21 },
      { category: '申請前確認', itemName: '申請書の最終チェック', isRequired: true, displayOrder: 22 },
      { category: '申請前確認', itemName: '提出方法の確認', isRequired: true, displayOrder: 23 },
    ]

    for (const item of checklistItems) {
      await this.db.prepare(`
        INSERT INTO subsidy_checklists (
          application_id, item_name, category, 
          is_required, display_order
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(
        applicationId,
        item.itemName,
        item.category,
        item.isRequired ? 1 : 0,
        item.displayOrder
      ).run()
    }
  }

  /**
   * デフォルト書類リストの作成
   */
  private async createDefaultDocuments(applicationId: number, subsidy: any): Promise<void> {
    const requiredDocs = JSON.parse(subsidy.required_documents || '[]')
    
    const defaultDocs = [
      { name: '助成金申請書', type: '申請書', required: true },
      { name: '事業計画書', type: '計画書', required: true },
      { name: '収支予算書', type: '財務書類', required: true },
      { name: '登記簿謄本', type: '証明書', required: true },
      { name: '決算書（直近3期分）', type: '財務書類', required: true },
      { name: '納税証明書', type: '証明書', required: true },
      { name: '労働保険料納付証明書', type: '証明書', required: true },
      { name: '社会保険料納付証明書', type: '証明書', required: true },
      ...requiredDocs.map((doc: string) => ({ 
        name: doc, 
        type: '添付書類', 
        required: true 
      }))
    ]

    for (const doc of defaultDocs) {
      await this.db.prepare(`
        INSERT INTO subsidy_documents (
          application_id, document_name, document_type, status
        ) VALUES (?, ?, ?, 'not_started')
      `).bind(
        applicationId,
        doc.name,
        doc.type
      ).run()
    }
  }

  /**
   * デフォルトスケジュールの作成
   */
  private async createDefaultSchedule(applicationId: number, deadline: string): Promise<void> {
    const deadlineDate = new Date(deadline)
    
    const scheduleItems = [
      { 
        eventType: '書類準備',
        eventName: '必要書類の収集開始',
        daysBeforeDeadline: 60
      },
      {
        eventType: '書類作成',
        eventName: '申請書・事業計画書の作成',
        daysBeforeDeadline: 45
      },
      {
        eventType: '内部確認',
        eventName: '社内レビュー・承認',
        daysBeforeDeadline: 30
      },
      {
        eventType: '最終確認',
        eventName: '申請書類の最終確認',
        daysBeforeDeadline: 14
      },
      {
        eventType: '提出準備',
        eventName: '提出書類の準備・製本',
        daysBeforeDeadline: 7
      },
      {
        eventType: '申請提出',
        eventName: '助成金申請書の提出',
        daysBeforeDeadline: 0
      }
    ]

    for (const item of scheduleItems) {
      const scheduledDate = new Date(deadlineDate)
      scheduledDate.setDate(scheduledDate.getDate() - item.daysBeforeDeadline)
      
      await this.db.prepare(`
        INSERT INTO subsidy_schedules (
          application_id, event_type, event_name, 
          scheduled_date, reminder_days_before
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(
        applicationId,
        item.eventType,
        item.eventName,
        scheduledDate.toISOString().split('T')[0],
        7
      ).run()
    }
  }

  /**
   * 申請状況の更新
   */
  async updateApplicationStatus(
    applicationId: number,
    newStatus: string,
    userId: number,
    details?: {
      applicationNumber?: string
      applicationDate?: string
      approvalDate?: string
      amountApproved?: number
      rejectionReason?: string
    }
  ): Promise<void> {
    // 現在の状態を取得
    const current = await this.db.prepare(`
      SELECT status FROM subsidy_applications WHERE id = ?
    `).bind(applicationId).first()

    if (!current) {
      throw new Error('Application not found')
    }

    // ステータス更新
    let updateQuery = `
      UPDATE subsidy_applications 
      SET status = ?, updated_at = datetime('now')
    `
    const params: any[] = [newStatus]

    if (details?.applicationNumber) {
      updateQuery += `, application_number = ?`
      params.push(details.applicationNumber)
    }

    if (details?.applicationDate) {
      updateQuery += `, application_date = ?`
      params.push(details.applicationDate)
    }

    if (details?.approvalDate) {
      updateQuery += `, approval_date = ?`
      params.push(details.approvalDate)
    }

    if (details?.amountApproved !== undefined) {
      updateQuery += `, amount_approved = ?`
      params.push(details.amountApproved)
    }

    if (details?.rejectionReason) {
      updateQuery += `, rejection_reason = ?`
      params.push(details.rejectionReason)
    }

    updateQuery += ` WHERE id = ?`
    params.push(applicationId)

    await this.db.prepare(updateQuery).bind(...params).run()

    // 履歴を記録
    await this.db.prepare(`
      INSERT INTO subsidy_progress_logs (
        application_id, action_type, action_detail,
        old_value, new_value, user_id
      ) VALUES (?, 'status_change', ?, ?, ?, ?)
    `).bind(
      applicationId,
      `Status changed from ${current.status} to ${newStatus}`,
      current.status,
      newStatus,
      userId
    ).run()
  }

  /**
   * チェックリスト項目の完了
   */
  async completeChecklistItem(
    itemId: number,
    userId: number,
    notes?: string
  ): Promise<void> {
    await this.db.prepare(`
      UPDATE subsidy_checklists
      SET is_completed = 1,
          completed_by = ?,
          completed_at = datetime('now'),
          notes = ?
      WHERE id = ?
    `).bind(userId, notes || '', itemId).run()
  }

  /**
   * 書類のアップロード記録
   */
  async uploadDocument(
    documentId: number,
    driveFileId: string,
    fileUrl: string
  ): Promise<void> {
    await this.db.prepare(`
      UPDATE subsidy_documents
      SET status = 'completed',
          drive_file_id = ?,
          file_url = ?,
          completed_date = date('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(driveFileId, fileUrl, documentId).run()
  }

  /**
   * 申請の進捗率を計算
   */
  async calculateProgress(applicationId: number): Promise<{
    overall: number
    checklist: number
    documents: number
    byCategory: Record<string, number>
  }> {
    // チェックリストの進捗
    const checklistStats = await this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed,
        category,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as category_progress
      FROM subsidy_checklists
      WHERE application_id = ?
      GROUP BY category
    `).bind(applicationId).all()

    // 書類の進捗
    const documentStats = await this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' OR status = 'submitted' THEN 1 ELSE 0 END) as completed
      FROM subsidy_documents
      WHERE application_id = ?
    `).bind(applicationId).first()

    const checklistProgress = checklistStats.results.reduce((sum, cat) => {
      return sum + (cat.completed as number)
    }, 0) / checklistStats.results.reduce((sum, cat) => {
      return sum + (cat.total as number)
    }, 0) * 100

    const documentProgress = documentStats && documentStats.total > 0
      ? (documentStats.completed / documentStats.total) * 100
      : 0

    const byCategory: Record<string, number> = {}
    checklistStats.results.forEach(cat => {
      byCategory[cat.category as string] = Math.round(cat.category_progress as number)
    })

    return {
      overall: Math.round((checklistProgress + documentProgress) / 2),
      checklist: Math.round(checklistProgress),
      documents: Math.round(documentProgress),
      byCategory
    }
  }

  /**
   * AIによる申請書類の自動生成
   */
  async generateApplicationDocuments(
    applicationId: number,
    documentType: 'business_plan' | 'budget' | 'application_form'
  ): Promise<string> {
    if (!this.geminiService) {
      throw new Error('AI service not configured')
    }

    // 申請情報を取得
    const application = await this.db.prepare(`
      SELECT 
        sa.*,
        s.name as subsidy_name,
        s.description as subsidy_description,
        s.requirements,
        c.name as client_name,
        c.industry,
        c.employee_count
      FROM subsidy_applications sa
      JOIN subsidies s ON sa.subsidy_id = s.id
      JOIN clients c ON sa.client_id = c.id
      WHERE sa.id = ?
    `).bind(applicationId).first()

    if (!application) {
      throw new Error('Application not found')
    }

    const prompts: Record<string, string> = {
      business_plan: `
        以下の助成金申請のための事業計画書を作成してください：
        助成金：${application.subsidy_name}
        企業名：${application.client_name}
        業種：${application.industry}
        従業員数：${application.employee_count}
        申請金額：${application.amount_requested}円
        
        以下の項目を含めてください：
        1. 事業概要
        2. 事業の目的・背景
        3. 実施計画
        4. 期待される効果
        5. 実施体制
        6. スケジュール
      `,
      budget: `
        以下の助成金申請のための収支予算書を作成してください：
        助成金：${application.subsidy_name}
        申請金額：${application.amount_requested}円
        
        以下の項目を含めてください：
        1. 収入の部
        2. 支出の部（人件費、設備費、その他経費）
        3. 助成金充当計画
        4. 自己資金計画
      `,
      application_form: `
        以下の助成金申請書の記入例を作成してください：
        助成金：${application.subsidy_name}
        企業名：${application.client_name}
        申請金額：${application.amount_requested}円
        
        申請理由と活用計画を詳しく記載してください。
      `
    }

    const response = await this.geminiService.generateContent(prompts[documentType])
    return response
  }

  /**
   * 期限アラートの取得
   */
  async getDeadlineAlerts(daysAhead: number = 30): Promise<Array<{
    applicationId: number
    clientName: string
    subsidyName: string
    deadline: string
    daysRemaining: number
    status: string
  }>> {
    const results = await this.db.prepare(`
      SELECT 
        sa.id as application_id,
        c.name as client_name,
        s.name as subsidy_name,
        sa.submission_deadline as deadline,
        sa.status,
        julianday(sa.submission_deadline) - julianday('now') as days_remaining
      FROM subsidy_applications sa
      JOIN subsidies s ON sa.subsidy_id = s.id
      JOIN clients c ON sa.client_id = c.id
      WHERE sa.status IN ('planning', 'preparing', 'document_check')
        AND sa.submission_deadline IS NOT NULL
        AND julianday(sa.submission_deadline) - julianday('now') <= ?
        AND julianday(sa.submission_deadline) - julianday('now') >= 0
      ORDER BY sa.submission_deadline ASC
    `).bind(daysAhead).all()

    return results.results.map(r => ({
      applicationId: r.application_id as number,
      clientName: r.client_name as string,
      subsidyName: r.subsidy_name as string,
      deadline: r.deadline as string,
      daysRemaining: Math.ceil(r.days_remaining as number),
      status: r.status as string
    }))
  }
}
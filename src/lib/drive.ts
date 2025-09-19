/**
 * Google Drive API Service
 * Google Drive APIとの連携を管理
 */

interface DriveConfig {
  accessToken: string
  refreshToken?: string
}

interface DriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  createdTime?: string
  modifiedTime?: string
  webViewLink?: string
  webContentLink?: string
  parents?: string[]
  thumbnailLink?: string
  iconLink?: string
  shared?: boolean
  owners?: Array<{
    displayName: string
    emailAddress: string
  }>
}

interface DriveFolder extends DriveFile {
  children?: DriveFile[]
}

interface FileUploadOptions {
  name: string
  mimeType: string
  parents?: string[]
  description?: string
}

export class DriveService {
  private config: DriveConfig
  private readonly API_BASE = 'https://www.googleapis.com/drive/v3'
  private readonly UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3'

  constructor(config: DriveConfig) {
    this.config = config
  }

  /**
   * ファイル一覧を取得
   */
  async listFiles(options: {
    q?: string // 検索クエリ
    pageSize?: number
    orderBy?: string
    fields?: string
    parents?: string
  } = {}): Promise<DriveFile[]> {
    const params = new URLSearchParams({
      pageSize: (options.pageSize || 100).toString(),
      fields: options.fields || 'files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents,thumbnailLink,iconLink,shared,owners)',
      ...(options.q && { q: options.q }),
      ...(options.orderBy && { orderBy: options.orderBy })
    })

    // 親フォルダ指定がある場合
    if (options.parents) {
      params.set('q', `'${options.parents}' in parents`)
    }

    const response = await fetch(`${this.API_BASE}/files?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`)
    }

    const data = await response.json()
    return data.files || []
  }

  /**
   * ファイルの詳細を取得
   */
  async getFile(fileId: string): Promise<DriveFile> {
    const params = new URLSearchParams({
      fields: 'id,name,mimeType,size,createdTime,modifiedTime,webViewLink,webContentLink,parents,thumbnailLink,iconLink,shared,owners,description'
    })

    const response = await fetch(`${this.API_BASE}/files/${fileId}?${params}`, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get file: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * ファイルをアップロード
   */
  async uploadFile(
    content: Blob | ArrayBuffer | string,
    options: FileUploadOptions
  ): Promise<DriveFile> {
    // メタデータ
    const metadata = {
      name: options.name,
      mimeType: options.mimeType,
      ...(options.parents && { parents: options.parents }),
      ...(options.description && { description: options.description })
    }

    // マルチパートアップロード
    const boundary = '-------314159265358979323846'
    const delimiter = `\r\n--${boundary}\r\n`
    const closeDelimiter = `\r\n--${boundary}--`

    let body = ''
    
    // メタデータパート
    body += delimiter
    body += 'Content-Type: application/json\r\n\r\n'
    body += JSON.stringify(metadata)
    
    // コンテンツパート
    body += delimiter
    body += `Content-Type: ${options.mimeType}\r\n\r\n`
    
    // コンテンツを追加
    if (typeof content === 'string') {
      body += content
    }
    
    body += closeDelimiter

    // Blobの場合の処理
    let finalBody: Blob
    if (content instanceof Blob || content instanceof ArrayBuffer) {
      const parts = [
        new Blob([body.substring(0, body.lastIndexOf(delimiter) + delimiter.length)]),
        content,
        new Blob([closeDelimiter])
      ]
      finalBody = new Blob(parts)
    } else {
      finalBody = new Blob([body])
    }

    const response = await fetch(`${this.UPLOAD_BASE}/files?uploadType=multipart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: finalBody
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to upload file: ${error}`)
    }

    return await response.json()
  }

  /**
   * フォルダを作成
   */
  async createFolder(name: string, parentId?: string): Promise<DriveFile> {
    const metadata = {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId && { parents: [parentId] })
    }

    const response = await fetch(`${this.API_BASE}/files`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    })

    if (!response.ok) {
      throw new Error(`Failed to create folder: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * ファイル/フォルダを削除
   */
  async deleteFile(fileId: string): Promise<void> {
    const response = await fetch(`${this.API_BASE}/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to delete file: ${response.statusText}`)
    }
  }

  /**
   * ファイルの内容をダウンロード
   */
  async downloadFile(fileId: string): Promise<Blob> {
    const response = await fetch(`${this.API_BASE}/files/${fileId}?alt=media`, {
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`)
    }

    return await response.blob()
  }

  /**
   * ファイルを移動
   */
  async moveFile(fileId: string, newParentId: string, oldParentId?: string): Promise<DriveFile> {
    const params = new URLSearchParams({
      ...(oldParentId && { removeParents: oldParentId }),
      addParents: newParentId
    })

    const response = await fetch(`${this.API_BASE}/files/${fileId}?${params}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to move file: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * ファイル名を変更
   */
  async renameFile(fileId: string, newName: string): Promise<DriveFile> {
    const response = await fetch(`${this.API_BASE}/files/${fileId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: newName })
    })

    if (!response.ok) {
      throw new Error(`Failed to rename file: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * ファイルを共有
   */
  async shareFile(fileId: string, email: string, role: 'reader' | 'writer' | 'commenter' = 'reader'): Promise<void> {
    const permission = {
      type: 'user',
      role,
      emailAddress: email
    }

    const response = await fetch(`${this.API_BASE}/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(permission)
    })

    if (!response.ok) {
      throw new Error(`Failed to share file: ${response.statusText}`)
    }
  }

  /**
   * 共有リンクを取得
   */
  async createShareLink(fileId: string): Promise<string> {
    // Anyone with link can view
    const permission = {
      type: 'anyone',
      role: 'reader'
    }

    await fetch(`${this.API_BASE}/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(permission)
    })

    const file = await this.getFile(fileId)
    return file.webViewLink || ''
  }

  /**
   * クライアント用フォルダ構造を作成
   */
  async createClientFolderStructure(clientName: string): Promise<{
    rootFolder: DriveFile
    subFolders: Record<string, DriveFile>
  }> {
    // ルートフォルダ作成
    const rootFolder = await this.createFolder(clientName)

    // サブフォルダ作成
    const subFolderNames = [
      '契約書',
      '請求書',
      '給与計算',
      '社会保険',
      '労働保険',
      '就業規則',
      '議事録',
      'その他書類'
    ]

    const subFolders: Record<string, DriveFile> = {}

    for (const folderName of subFolderNames) {
      const folder = await this.createFolder(folderName, rootFolder.id)
      subFolders[folderName] = folder
    }

    return { rootFolder, subFolders }
  }

  /**
   * ファイル検索
   */
  async searchFiles(query: string, options: {
    mimeType?: string
    inFolder?: string
    modifiedAfter?: Date
  } = {}): Promise<DriveFile[]> {
    const queryParts = [`name contains '${query}'`]

    if (options.mimeType) {
      queryParts.push(`mimeType = '${options.mimeType}'`)
    }

    if (options.inFolder) {
      queryParts.push(`'${options.inFolder}' in parents`)
    }

    if (options.modifiedAfter) {
      queryParts.push(`modifiedTime > '${options.modifiedAfter.toISOString()}'`)
    }

    return await this.listFiles({
      q: queryParts.join(' and ')
    })
  }
}

/**
 * タスクとDriveファイルの連携サービス
 */
export class TaskDriveIntegration {
  private driveService: DriveService
  private db: D1Database

  constructor(driveService: DriveService, db: D1Database) {
    this.driveService = driveService
    this.db = db
  }

  /**
   * タスクにファイルを添付
   */
  async attachFileToTask(taskId: number, fileId: string): Promise<void> {
    // ファイル情報を取得
    const file = await this.driveService.getFile(fileId)

    // データベースに添付ファイル情報を保存
    await this.db.prepare(`
      INSERT INTO task_attachments (
        task_id, drive_file_id, file_name, 
        file_type, file_size, file_url,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      taskId,
      file.id,
      file.name,
      file.mimeType,
      file.size || '0',
      file.webViewLink || ''
    ).run()
  }

  /**
   * タスクの添付ファイル一覧を取得
   */
  async getTaskAttachments(taskId: number): Promise<any[]> {
    const attachments = await this.db.prepare(`
      SELECT * FROM task_attachments 
      WHERE task_id = ? 
      ORDER BY created_at DESC
    `).bind(taskId).all()

    return attachments.results
  }

  /**
   * クライアント専用フォルダを取得または作成
   */
  async getOrCreateClientFolder(clientId: number): Promise<string> {
    // クライアント情報を取得
    const client = await this.db.prepare(`
      SELECT * FROM clients WHERE id = ?
    `).bind(clientId).first()

    if (!client) {
      throw new Error('Client not found')
    }

    // 既存のフォルダIDを確認
    if (client.drive_folder_id) {
      return client.drive_folder_id as string
    }

    // 新規フォルダ作成
    const { rootFolder, subFolders } = await this.driveService.createClientFolderStructure(
      client.name as string
    )

    // フォルダIDを保存
    await this.db.prepare(`
      UPDATE clients 
      SET drive_folder_id = ?, 
          drive_subfolders = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      rootFolder.id,
      JSON.stringify(subFolders),
      clientId
    ).run()

    return rootFolder.id
  }

  /**
   * タスク関連ドキュメントをアップロード
   */
  async uploadTaskDocument(
    taskId: number,
    content: Blob | ArrayBuffer | string,
    fileName: string,
    mimeType: string
  ): Promise<string> {
    // タスク情報を取得
    const task = await this.db.prepare(`
      SELECT t.*, c.drive_folder_id 
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE t.id = ?
    `).bind(taskId).first()

    if (!task) {
      throw new Error('Task not found')
    }

    // アップロード先フォルダを決定
    const parents = task.drive_folder_id ? [task.drive_folder_id as string] : undefined

    // ファイルをアップロード
    const file = await this.driveService.uploadFile(content, {
      name: fileName,
      mimeType,
      parents,
      description: `Task #${taskId}: ${task.title}`
    })

    // 添付ファイルとして記録
    await this.attachFileToTask(taskId, file.id)

    return file.id
  }

  /**
   * 月次レポートを生成してDriveに保存
   */
  async generateMonthlyReport(year: number, month: number): Promise<string> {
    // レポートデータを取得
    const reportData = await this.db.prepare(`
      SELECT 
        c.name as client_name,
        COUNT(t.id) as task_count,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(t.actual_hours) as total_hours
      FROM tasks t
      LEFT JOIN clients c ON t.client_id = c.id
      WHERE strftime('%Y-%m', t.created_at) = ?
      GROUP BY c.id, c.name
    `).bind(`${year}-${month.toString().padStart(2, '0')}`).all()

    // CSV形式でレポート作成
    let csv = 'クライアント名,タスク数,完了数,作業時間\n'
    for (const row of reportData.results) {
      csv += `${row.client_name},${row.task_count},${row.completed_count},${row.total_hours || 0}\n`
    }

    // Driveにアップロード
    const file = await this.driveService.uploadFile(csv, {
      name: `月次レポート_${year}年${month}月.csv`,
      mimeType: 'text/csv',
      description: `${year}年${month}月の月次業務レポート`
    })

    return file.id
  }
}
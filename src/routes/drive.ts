/**
 * Google Drive API Routes
 * Drive連携のAPIエンドポイント
 */

import { Hono } from 'hono'
import { DriveService, TaskDriveIntegration } from '../lib/drive'

type Bindings = {
  DB: D1Database
  KV: KVNamespace
}

const driveRouter = new Hono<{ Bindings: Bindings }>()

/**
 * ファイル一覧取得
 */
driveRouter.get('/files', async (c) => {
  try {
    const user = c.get('user')
    const q = c.req.query('q')
    const parents = c.req.query('parents')
    const pageSize = parseInt(c.req.query('pageSize') || '50')

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const driveService = new DriveService({ accessToken: access_token })

    const files = await driveService.listFiles({
      q,
      parents,
      pageSize
    })

    return c.json({
      files: files.map(file => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        thumbnailLink: file.thumbnailLink,
        iconLink: file.iconLink,
        shared: file.shared
      })),
      totalCount: files.length
    })
  } catch (error: any) {
    console.error('Failed to list files:', error)
    return c.json({ 
      error: 'Failed to list files', 
      message: error.message 
    }, 500)
  }
})

/**
 * ファイル詳細取得
 */
driveRouter.get('/files/:fileId', async (c) => {
  try {
    const user = c.get('user')
    const fileId = c.req.param('fileId')

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const driveService = new DriveService({ accessToken: access_token })

    const file = await driveService.getFile(fileId)

    return c.json(file)
  } catch (error: any) {
    console.error('Failed to get file:', error)
    return c.json({ 
      error: 'Failed to get file', 
      message: error.message 
    }, 500)
  }
})

/**
 * ファイルアップロード
 */
driveRouter.post('/upload', async (c) => {
  try {
    const user = c.get('user')
    const formData = await c.req.formData()
    
    const file = formData.get('file') as File
    const name = formData.get('name') as string || file.name
    const parents = formData.get('parents') as string
    const description = formData.get('description') as string

    if (!file) {
      return c.json({ error: 'File is required' }, 400)
    }

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const driveService = new DriveService({ accessToken: access_token })

    const arrayBuffer = await file.arrayBuffer()
    const uploadedFile = await driveService.uploadFile(arrayBuffer, {
      name,
      mimeType: file.type,
      parents: parents ? [parents] : undefined,
      description
    })

    return c.json({
      success: true,
      file: uploadedFile
    })
  } catch (error: any) {
    console.error('Failed to upload file:', error)
    return c.json({ 
      error: 'Failed to upload file', 
      message: error.message 
    }, 500)
  }
})

/**
 * フォルダ作成
 */
driveRouter.post('/folders', async (c) => {
  try {
    const user = c.get('user')
    const { name, parentId } = await c.req.json()

    if (!name) {
      return c.json({ error: 'Folder name is required' }, 400)
    }

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const driveService = new DriveService({ accessToken: access_token })

    const folder = await driveService.createFolder(name, parentId)

    return c.json({
      success: true,
      folder
    })
  } catch (error: any) {
    console.error('Failed to create folder:', error)
    return c.json({ 
      error: 'Failed to create folder', 
      message: error.message 
    }, 500)
  }
})

/**
 * ファイル削除
 */
driveRouter.delete('/files/:fileId', async (c) => {
  try {
    const user = c.get('user')
    const fileId = c.req.param('fileId')

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const driveService = new DriveService({ accessToken: access_token })

    await driveService.deleteFile(fileId)

    return c.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete file:', error)
    return c.json({ 
      error: 'Failed to delete file', 
      message: error.message 
    }, 500)
  }
})

/**
 * ファイルダウンロード
 */
driveRouter.get('/download/:fileId', async (c) => {
  try {
    const user = c.get('user')
    const fileId = c.req.param('fileId')

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const driveService = new DriveService({ accessToken: access_token })

    // ファイル情報を取得
    const file = await driveService.getFile(fileId)
    
    // ファイルをダウンロード
    const blob = await driveService.downloadFile(fileId)

    return new Response(blob, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.name}"`
      }
    })
  } catch (error: any) {
    console.error('Failed to download file:', error)
    return c.json({ 
      error: 'Failed to download file', 
      message: error.message 
    }, 500)
  }
})

/**
 * ファイル移動
 */
driveRouter.put('/files/:fileId/move', async (c) => {
  try {
    const user = c.get('user')
    const fileId = c.req.param('fileId')
    const { newParentId, oldParentId } = await c.req.json()

    if (!newParentId) {
      return c.json({ error: 'New parent ID is required' }, 400)
    }

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const driveService = new DriveService({ accessToken: access_token })

    const movedFile = await driveService.moveFile(fileId, newParentId, oldParentId)

    return c.json({
      success: true,
      file: movedFile
    })
  } catch (error: any) {
    console.error('Failed to move file:', error)
    return c.json({ 
      error: 'Failed to move file', 
      message: error.message 
    }, 500)
  }
})

/**
 * ファイル名変更
 */
driveRouter.put('/files/:fileId/rename', async (c) => {
  try {
    const user = c.get('user')
    const fileId = c.req.param('fileId')
    const { newName } = await c.req.json()

    if (!newName) {
      return c.json({ error: 'New name is required' }, 400)
    }

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const driveService = new DriveService({ accessToken: access_token })

    const renamedFile = await driveService.renameFile(fileId, newName)

    return c.json({
      success: true,
      file: renamedFile
    })
  } catch (error: any) {
    console.error('Failed to rename file:', error)
    return c.json({ 
      error: 'Failed to rename file', 
      message: error.message 
    }, 500)
  }
})

/**
 * ファイル共有
 */
driveRouter.post('/files/:fileId/share', async (c) => {
  try {
    const user = c.get('user')
    const fileId = c.req.param('fileId')
    const { email, role = 'reader' } = await c.req.json()

    if (!email) {
      return c.json({ error: 'Email is required' }, 400)
    }

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const driveService = new DriveService({ accessToken: access_token })

    await driveService.shareFile(fileId, email, role as 'reader' | 'writer' | 'commenter')

    return c.json({ 
      success: true,
      message: 'ファイルを共有しました'
    })
  } catch (error: any) {
    console.error('Failed to share file:', error)
    return c.json({ 
      error: 'Failed to share file', 
      message: error.message 
    }, 500)
  }
})

/**
 * 共有リンク作成
 */
driveRouter.post('/files/:fileId/create-link', async (c) => {
  try {
    const user = c.get('user')
    const fileId = c.req.param('fileId')

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const driveService = new DriveService({ accessToken: access_token })

    const link = await driveService.createShareLink(fileId)

    return c.json({
      success: true,
      link
    })
  } catch (error: any) {
    console.error('Failed to create share link:', error)
    return c.json({ 
      error: 'Failed to create share link', 
      message: error.message 
    }, 500)
  }
})

/**
 * クライアントフォルダ作成
 */
driveRouter.post('/create-client-folder/:clientId', async (c) => {
  try {
    const user = c.get('user')
    const clientId = parseInt(c.req.param('clientId'))

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const driveService = new DriveService({ accessToken: access_token })
    const integration = new TaskDriveIntegration(driveService, c.env.DB)

    const folderId = await integration.getOrCreateClientFolder(clientId)

    return c.json({
      success: true,
      folderId,
      message: 'クライアント専用フォルダを作成しました'
    })
  } catch (error: any) {
    console.error('Failed to create client folder:', error)
    return c.json({ 
      error: 'Failed to create client folder', 
      message: error.message 
    }, 500)
  }
})

/**
 * タスクにファイル添付
 */
driveRouter.post('/attach-to-task/:taskId', async (c) => {
  try {
    const user = c.get('user')
    const taskId = parseInt(c.req.param('taskId'))
    const { fileId } = await c.req.json()

    if (!fileId) {
      return c.json({ error: 'File ID is required' }, 400)
    }

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const driveService = new DriveService({ accessToken: access_token })
    const integration = new TaskDriveIntegration(driveService, c.env.DB)

    await integration.attachFileToTask(taskId, fileId)

    return c.json({
      success: true,
      message: 'ファイルをタスクに添付しました'
    })
  } catch (error: any) {
    console.error('Failed to attach file to task:', error)
    return c.json({ 
      error: 'Failed to attach file', 
      message: error.message 
    }, 500)
  }
})

/**
 * タスクの添付ファイル一覧
 */
driveRouter.get('/task-attachments/:taskId', async (c) => {
  try {
    const user = c.get('user')
    const taskId = parseInt(c.req.param('taskId'))

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const driveService = new DriveService({ accessToken: access_token })
    const integration = new TaskDriveIntegration(driveService, c.env.DB)

    const attachments = await integration.getTaskAttachments(taskId)

    return c.json({
      attachments,
      totalCount: attachments.length
    })
  } catch (error: any) {
    console.error('Failed to get task attachments:', error)
    return c.json({ 
      error: 'Failed to get attachments', 
      message: error.message 
    }, 500)
  }
})

/**
 * ファイル検索
 */
driveRouter.get('/search', async (c) => {
  try {
    const user = c.get('user')
    const query = c.req.query('q') || ''
    const mimeType = c.req.query('mimeType')
    const inFolder = c.req.query('inFolder')

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const driveService = new DriveService({ accessToken: access_token })

    const files = await driveService.searchFiles(query, {
      mimeType,
      inFolder
    })

    return c.json({
      files,
      totalCount: files.length
    })
  } catch (error: any) {
    console.error('Failed to search files:', error)
    return c.json({ 
      error: 'Failed to search files', 
      message: error.message 
    }, 500)
  }
})

/**
 * 月次レポート生成
 */
driveRouter.post('/generate-monthly-report', async (c) => {
  try {
    const user = c.get('user')
    const { year, month } = await c.req.json()

    if (!year || !month) {
      return c.json({ error: 'Year and month are required' }, 400)
    }

    const tokenData = await c.env.KV.get(`google_token_${user.id}`)
    if (!tokenData) {
      return c.json({ error: 'Google authentication required' }, 401)
    }

    const { access_token } = JSON.parse(tokenData)
    const driveService = new DriveService({ accessToken: access_token })
    const integration = new TaskDriveIntegration(driveService, c.env.DB)

    const fileId = await integration.generateMonthlyReport(year, month)

    return c.json({
      success: true,
      fileId,
      message: `${year}年${month}月の月次レポートを生成しました`
    })
  } catch (error: any) {
    console.error('Failed to generate monthly report:', error)
    return c.json({ 
      error: 'Failed to generate report', 
      message: error.message 
    }, 500)
  }
})

export { driveRouter }
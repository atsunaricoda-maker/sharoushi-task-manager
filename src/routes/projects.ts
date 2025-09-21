import { Hono } from 'hono'
import type { Bindings } from '../types'

const projectsRouter = new Hono<{ Bindings: Bindings }>()

// Get all projects
projectsRouter.get('/', async (c) => {
  try {
    const result = await c.env.DB.prepare(`
      SELECT p.*, c.name as client_name, c.company_name,
        COUNT(DISTINCT pt.id) as task_count,
        SUM(CASE WHEN pt.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN project_tasks pt ON p.id = pt.project_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all()
    
    return c.json(result.results || [])
  } catch (error) {
    console.error('Error fetching projects:', error)
    return c.json({ error: 'Failed to fetch projects' }, 500)
  }
})

// Get single project with tasks
projectsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    const project = await c.env.DB.prepare(`
      SELECT p.*, c.name as client_name, c.company_name
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.id = ?
    `).bind(id).first()
    
    if (!project) {
      return c.json({ error: 'Project not found' }, 404)
    }
    
    const tasks = await c.env.DB.prepare(`
      SELECT * FROM project_tasks
      WHERE project_id = ?
      ORDER BY created_at DESC
    `).bind(id).all()
    
    return c.json({
      ...project,
      tasks: tasks.results || []
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    return c.json({ error: 'Failed to fetch project' }, 500)
  }
})

// Create new project
projectsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { client_id, name, description, start_date, end_date, status = 'active', budget } = body
    
    const result = await c.env.DB.prepare(`
      INSERT INTO projects (client_id, name, description, start_date, end_date, status, budget)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(client_id, name, description, start_date, end_date, status, budget).run()
    
    return c.json({ 
      id: result.meta.last_row_id,
      success: true,
      message: 'プロジェクトを作成しました'
    })
  } catch (error) {
    console.error('Error creating project:', error)
    return c.json({ error: 'Failed to create project' }, 500)
  }
})

// Update project
projectsRouter.put('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    const { client_id, name, description, start_date, end_date, status, budget } = body
    
    await c.env.DB.prepare(`
      UPDATE projects SET
        client_id = ?, name = ?, description = ?,
        start_date = ?, end_date = ?, status = ?, budget = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(client_id, name, description, start_date, end_date, status, budget, id).run()
    
    return c.json({ 
      success: true,
      message: 'プロジェクトを更新しました'
    })
  } catch (error) {
    console.error('Error updating project:', error)
    return c.json({ error: 'Failed to update project' }, 500)
  }
})

// Delete project
projectsRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    
    // Delete associated tasks first
    await c.env.DB.prepare(`
      DELETE FROM project_tasks WHERE project_id = ?
    `).bind(id).run()
    
    // Delete project
    await c.env.DB.prepare(`
      DELETE FROM projects WHERE id = ?
    `).bind(id).run()
    
    return c.json({ 
      success: true,
      message: 'プロジェクトを削除しました'
    })
  } catch (error) {
    console.error('Error deleting project:', error)
    return c.json({ error: 'Failed to delete project' }, 500)
  }
})

// Add task to project
projectsRouter.post('/:id/tasks', async (c) => {
  try {
    const projectId = c.req.param('id')
    const body = await c.req.json()
    const { title, description, assigned_to, due_date, status = 'pending' } = body
    
    const result = await c.env.DB.prepare(`
      INSERT INTO project_tasks (project_id, title, description, assigned_to, due_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(projectId, title, description, assigned_to, due_date, status).run()
    
    return c.json({ 
      id: result.meta.last_row_id,
      success: true,
      message: 'タスクを追加しました'
    })
  } catch (error) {
    console.error('Error adding task to project:', error)
    return c.json({ error: 'Failed to add task' }, 500)
  }
})

// Update project task
projectsRouter.put('/:projectId/tasks/:taskId', async (c) => {
  try {
    const taskId = c.req.param('taskId')
    const body = await c.req.json()
    const { title, description, assigned_to, due_date, status } = body
    
    await c.env.DB.prepare(`
      UPDATE project_tasks SET
        title = ?, description = ?, assigned_to = ?,
        due_date = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(title, description, assigned_to, due_date, status, taskId).run()
    
    return c.json({ 
      success: true,
      message: 'タスクを更新しました'
    })
  } catch (error) {
    console.error('Error updating project task:', error)
    return c.json({ error: 'Failed to update task' }, 500)
  }
})

export default projectsRouter
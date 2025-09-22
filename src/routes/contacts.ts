import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

export const contactsRouter = new Hono<{ Bindings: Bindings }>()

// Create new contact record
contactsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json()
    const { 
      client_id, 
      contact_type, 
      subject, 
      notes, 
      contact_date 
    } = body
    
    // Validate required fields
    if (!client_id || !contact_type || !subject || !notes) {
      return c.json({ 
        error: '必須項目が不足しています（顧問先、連絡方法、件名、内容）' 
      }, 400)
    }
    
    // Use provided contact_date or current timestamp
    const finalContactDate = contact_date || new Date().toISOString()
    
    const result = await c.env.DB.prepare(`
      INSERT INTO client_contacts (
        client_id, 
        contact_type, 
        subject, 
        notes, 
        contact_date
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      client_id, 
      contact_type, 
      subject, 
      notes, 
      finalContactDate
    ).run()
    
    // Update client's last_contact_date
    await c.env.DB.prepare(`
      UPDATE clients 
      SET 
        last_contact_date = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(finalContactDate, client_id).run()
    
    return c.json({
      success: true,
      id: result.meta.last_row_id,
      message: '連絡記録を追加しました'
    })
  } catch (error) {
    console.error('Error creating contact record:', error)
    return c.json({ 
      error: 'Failed to create contact record',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Get contact details
contactsRouter.get('/:id', async (c) => {
  try {
    const contactId = c.req.param('id')
    
    const contact = await c.env.DB.prepare(`
      SELECT 
        cc.*,
        cl.name as client_name
      FROM client_contacts cc
      LEFT JOIN clients cl ON cc.client_id = cl.id
      WHERE cc.id = ?
    `).bind(contactId).first()
    
    if (!contact) {
      return c.json({ error: 'Contact record not found' }, 404)
    }
    
    return c.json({
      success: true,
      contact
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch contact record' }, 500)
  }
})

// Update contact record
contactsRouter.put('/:id', async (c) => {
  try {
    const contactId = c.req.param('id')
    const body = await c.req.json()
    const { contact_type, subject, notes, contact_date } = body
    
    await c.env.DB.prepare(`
      UPDATE client_contacts SET
        contact_type = ?,
        subject = ?,
        notes = ?,
        contact_date = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      contact_type,
      subject,
      notes,
      contact_date,
      contactId
    ).run()
    
    return c.json({
      success: true,
      message: '連絡記録を更新しました'
    })
  } catch (error) {
    return c.json({ error: 'Failed to update contact record' }, 500)
  }
})

// Delete contact record
contactsRouter.delete('/:id', async (c) => {
  try {
    const contactId = c.req.param('id')
    
    await c.env.DB.prepare(`
      DELETE FROM client_contacts WHERE id = ?
    `).bind(contactId).run()
    
    return c.json({
      success: true,
      message: '連絡記録を削除しました'
    })
  } catch (error) {
    return c.json({ error: 'Failed to delete contact record' }, 500)
  }
})
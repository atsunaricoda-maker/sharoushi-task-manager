import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

export const contactsRouter = new Hono<{ Bindings: Bindings }>()

// Check if client_contacts table exists
contactsRouter.get('/table-status', async (c) => {
  try {
    // Check table existence
    const tables = await c.env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name = 'client_contacts'
    `).all()
    
    const tableExists = tables.results && tables.results.length > 0
    
    // If table exists, get schema info
    let tableSchema = null
    if (tableExists) {
      const schema = await c.env.DB.prepare(`
        PRAGMA table_info(client_contacts)
      `).all()
      tableSchema = schema.results
    }
    
    return c.json({
      success: true,
      tableExists: tableExists,
      tableSchema: tableSchema,
      allTables: tables.results,
      message: tableExists ? 'client_contacts table exists' : 'client_contacts table not found'
    })
  } catch (error) {
    return c.json({ 
      error: 'Failed to check table status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

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
    
    // Update client's last_contact_date (with error handling for missing column)
    try {
      await c.env.DB.prepare(`
        UPDATE clients 
        SET 
          last_contact_date = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(finalContactDate, client_id).run()
    } catch (updateError) {
      console.warn('Could not update last_contact_date (column may not exist):', updateError.message)
      // Try updating only updated_at if last_contact_date column doesn't exist
      try {
        await c.env.DB.prepare(`
          UPDATE clients 
          SET updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(client_id).run()
      } catch (fallbackError) {
        console.warn('Could not update client timestamp:', fallbackError.message)
        // Continue anyway - contact record was created successfully
      }
    }
    
    return c.json({
      success: true,
      id: result.meta.last_row_id,
      message: '連絡記録を追加しました'
    })
  } catch (error) {
    console.error('Error creating contact record:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack',
      name: error instanceof Error ? error.name : 'Unknown error type'
    })
    
    // Check if it's a database table error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    let userFriendlyMessage = 'Failed to create contact record'
    
    if (errorMessage.includes('no such table')) {
      userFriendlyMessage = 'Database table not found. Please initialize the database first.'
    } else if (errorMessage.includes('client_contacts')) {
      userFriendlyMessage = 'client_contacts table is missing. Database initialization required.'
    }
    
    return c.json({ 
      error: userFriendlyMessage,
      details: errorMessage,
      debug: {
        errorType: error instanceof Error ? error.name : 'Unknown',
        fullMessage: errorMessage
      }
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
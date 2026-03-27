const { query } = require('../config/database');

class Lead {
  static async create(leadData) {
    const { name, email, phone, source, status, assigned_to, communication_history } = leadData;
    
    const result = await query(
      `INSERT INTO leads (name, email, phone, source, status, assigned_to, communication_history) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, name, email, phone, source, status, assigned_to, communication_history, created_at`,
      [name, email, phone, source, status || 'New', assigned_to, JSON.stringify(communication_history || [])]
    );
    
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      `SELECT l.*, u.name as assigned_to_name 
       FROM leads l 
       LEFT JOIN users u ON l.assigned_to = u.id 
       WHERE l.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async getAll(limit = 10, offset = 0) {
    const result = await query(
      `SELECT l.*, u.name as assigned_to_name 
       FROM leads l 
       LEFT JOIN users u ON l.assigned_to = u.id 
       ORDER BY l.created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  static async getByAssignee(assigneeId) {
    const result = await query(
      `SELECT l.*, u.name as assigned_to_name 
       FROM leads l 
       LEFT JOIN users u ON l.assigned_to = u.id 
       WHERE l.assigned_to = $1 
       ORDER BY l.created_at DESC`,
      [assigneeId]
    );
    return result.rows;
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      fields.push(`${key} = $${paramCount}`);
      if (key === 'communication_history' && updates[key]) {
        values.push(JSON.stringify(updates[key]));
      } else {
        values.push(updates[key]);
      }
      paramCount++;
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const result = await query(
      `UPDATE leads SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
      [...values, id]
    );

    return result.rows[0];
  }

  static async delete(id) {
    await query('DELETE FROM leads WHERE id = $1', [id]);
  }

  static async search(searchTerm) {
    const result = await query(
      `SELECT l.*, u.name as assigned_to_name 
       FROM leads l 
       LEFT JOIN users u ON l.assigned_to = u.id 
       WHERE l.name ILIKE $1 OR l.email ILIKE $1 OR l.phone ILIKE $1`,
      [`%${searchTerm}%`]
    );
    return result.rows;
  }

  static async updateStatus(id, status) {
    const result = await query(
      `UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }

  static async getCount() {
    const result = await query('SELECT COUNT(*) as count FROM leads');
    return result.rows[0].count;
  }

  static async getStats(period = null) {
    let whereClause = '';
    const params = [];

    if (period) {
      whereClause = 'WHERE created_at >= CURRENT_DATE - INTERVAL \'' + period + ' days\'';
    }

    const result = await query(`
      SELECT 
        COUNT(*) as total_leads,
        COUNT(*) FILTER (WHERE status = 'New') as new_leads,
        COUNT(*) FILTER (WHERE status = 'Contacted') as contacted_leads,
        COUNT(*) FILTER (WHERE status = 'Qualified') as qualified_leads,
        COUNT(*) FILTER (WHERE status = 'Converted') as converted_leads,
        COUNT(*) FILTER (WHERE status = 'Lost') as lost_leads
      FROM leads
      ${whereClause}
    `, params);
    return result.rows[0];
  }
}

module.exports = Lead;
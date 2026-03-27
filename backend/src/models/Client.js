const { query } = require('../config/database');

class Client {
  static async create(clientData) {
    const { name, email, phone, address, date_of_birth, joined_date } = clientData;
    
    const result = await query(
      `INSERT INTO clients (name, email, phone, address, date_of_birth, joined_date) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, name, email, phone, address, date_of_birth, joined_date, created_at`,
      [name, email, phone, address, date_of_birth, joined_date || new Date()]
    );
    
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT * FROM clients WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async getAll(limit = 10, offset = 0) {
    const result = await query(
      'SELECT * FROM clients ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  static async getByAgent(agentId) {
    const result = await query(
      `SELECT c.* FROM clients c 
       JOIN policies p ON c.id = p.client_id 
       WHERE p.agent_id = $1 
       GROUP BY c.id 
       ORDER BY c.created_at DESC`,
      [agentId]
    );
    return result.rows;
  }

  static async update(id, updates) {
    // Get old client record first to get old phone number
    const oldClientResult = await query(
      'SELECT phone FROM clients WHERE id = $1',
      [id]
    );
    const oldPhone = oldClientResult.rows[0]?.phone;

    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      fields.push(`${key} = $${paramCount}`);
      values.push(updates[key]);
      paramCount++;
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const result = await query(
      `UPDATE clients SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
      [...values, id]
    );

    const updatedClient = result.rows[0];

    // If phone number was updated, also update SMS logs recipient field
    if (updates.phone && oldPhone && updates.phone !== oldPhone) {
      await query(
        'UPDATE sms_logs SET recipient = $1 WHERE recipient = $2',
        [updates.phone, oldPhone]
      );
    }

    return updatedClient;
  }

  static async delete(id) {
    await query('DELETE FROM clients WHERE id = $1', [id]);
  }

  static async search(searchTerm) {
    const result = await query(
      `SELECT * FROM clients 
       WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1`,
      [`%${searchTerm}%`]
    );
    return result.rows;
  }

  static async getCount() {
    const result = await query('SELECT COUNT(*) as count FROM clients');
    return result.rows[0].count;
  }
}

module.exports = Client;
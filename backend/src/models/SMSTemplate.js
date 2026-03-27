const { query } = require('../config/database');

class SMSTemplate {
  static async create(templateData) {
    const { name, content } = templateData;
    
    const result = await query(
      `INSERT INTO sms_templates (name, content) 
       VALUES ($1, $2) 
       RETURNING *`,
      [name, content]
    );
    
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT * FROM sms_templates WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async getAll() {
    const result = await query(
      `SELECT * FROM sms_templates ORDER BY name ASC`
    );
    return result.rows;
  }

  static async update(id, templateData) {
    const { name, content } = templateData;
    const result = await query(
      `UPDATE sms_templates 
       SET name = $1, content = $2, updated_at = NOW() 
       WHERE id = $3 
       RETURNING *`,
      [name, content, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await query('DELETE FROM sms_templates WHERE id = $1', [id]);
  }
}

module.exports = SMSTemplate;

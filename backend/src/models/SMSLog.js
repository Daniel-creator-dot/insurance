const { query } = require('../config/database');

class SMSLog {
  static async create(smsData) {
    const { recipient, message, status } = smsData;
    
    const result = await query(
      `INSERT INTO sms_logs (recipient, message, status, sent_at) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, recipient, message, status, sent_at, created_at`,
      [recipient, message, status || 'Pending', status === 'Sent' ? new Date() : null]
    );
    
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT * FROM sms_logs WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async getAll(limit = 10, offset = 0) {
    const result = await query(
      `SELECT id, recipient, message, status, 
              COALESCE(sent_at, created_at) as sent_at, 
              created_at 
       FROM sms_logs 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  static async updateStatus(id, status) {
    const result = await query(
      `UPDATE sms_logs SET status = $1::varchar, sent_at = CASE WHEN $1::varchar = 'Sent' THEN NOW() ELSE sent_at END WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await query('DELETE FROM sms_logs WHERE id = $1', [id]);
  }

  static async getStats(period = null) {
    let whereClause = '';
    const params = [];

    if (period) {
      whereClause = 'WHERE created_at >= CURRENT_DATE - INTERVAL \'' + period + ' days\'';
    }

    const result = await query(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(*) FILTER (WHERE status = 'Sent') as sent_messages,
        COUNT(*) FILTER (WHERE status = 'Pending') as pending_messages,
        COUNT(*) FILTER (WHERE status = 'Failed') as failed_messages
      FROM sms_logs
      ${whereClause}
    `, params);
    return result.rows[0];
  }

  static async getCount() {
    const result = await query('SELECT COUNT(*) as count FROM sms_logs');
    return result.rows[0].count;
  }

  static async getByClient(clientId, limit = 10, offset = 0) {
    const result = await query(
      `SELECT id, recipient, message, status, 
              COALESCE(sent_at, created_at) as sent_at, 
              created_at 
       FROM sms_logs 
       WHERE recipient = $1 OR message LIKE '%' || $1 || '%'
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [clientId, limit, offset]
    );
    return result.rows;
  }

  static async getCountByClient(clientId) {
    const result = await query(
      'SELECT COUNT(*) as count FROM sms_logs WHERE recipient = $1 OR message LIKE \'%\' || $1 || \'%\'',
      [clientId]
    );
    return result.rows[0].count;
  }
}

module.exports = SMSLog;
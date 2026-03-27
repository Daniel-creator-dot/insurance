const { query } = require('../config/database');

class Account {
  static async create(accountData) {
    const { description, amount, type, category, agent_id } = accountData;

    const result = await query(
      `INSERT INTO accounts (description, amount, type, category, agent_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, description, amount, type, category, agent_id, created_at`,
      [description, amount, type, category, agent_id]
    );

    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      `SELECT a.*, u.name as agent_name 
       FROM accounts a 
       LEFT JOIN users u ON a.agent_id = u.id 
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async getAll(limit = 10, offset = 0) {
    const result = await query(
      `SELECT a.*, u.name as agent_name 
       FROM accounts a 
       LEFT JOIN users u ON a.agent_id = u.id 
       ORDER BY a.created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  static async getByAgent(agentId) {
    const result = await query(
      `SELECT a.*, u.name as agent_name 
       FROM accounts a 
       LEFT JOIN users u ON a.agent_id = u.id 
       WHERE a.agent_id = $1 
       ORDER BY a.created_at DESC`,
      [agentId]
    );
    return result.rows;
  }

  static async getByType(type) {
    const result = await query(
      `SELECT a.*, u.name as agent_name 
       FROM accounts a 
       LEFT JOIN users u ON a.agent_id = u.id 
       WHERE a.type = $1 
       ORDER BY a.created_at DESC`,
      [type]
    );
    return result.rows;
  }

  static async update(id, updates) {
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
      `UPDATE accounts SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
      [...values, id]
    );

    return result.rows[0];
  }

  static async delete(id) {
    await query('DELETE FROM accounts WHERE id = $1', [id]);
  }

  static async search(searchTerm) {
    const result = await query(
      `SELECT a.*, u.name as agent_name 
       FROM accounts a 
       LEFT JOIN users u ON a.agent_id = u.id 
       WHERE a.description ILIKE $1 OR a.category ILIKE $1`,
      [`%${searchTerm}%`]
    );
    return result.rows;
  }

  static async getStats(period = null) {
    let whereClause = '';
    const params = [];

    if (period) {
      whereClause = 'WHERE je.entry_date >= CURRENT_DATE - INTERVAL \'' + period + ' days\'';
    }

    // Generate P&L by looking at journal_entries where the debit/credit account belongs to 'revenue' or 'expense'
    const result = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN cr.type = 'revenue' THEN je.amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN dr.type = 'expense' THEN je.amount ELSE 0 END), 0) as total_expense,
        COALESCE(SUM(CASE WHEN cr.type = 'revenue' THEN je.amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN dr.type = 'expense' THEN je.amount ELSE 0 END), 0) as net_profit
      FROM journal_entries je
      LEFT JOIN chart_of_accounts cr ON je.credit_account = cr.code
      LEFT JOIN chart_of_accounts dr ON je.debit_account = dr.code
      ${whereClause}
    `, params);
    return result.rows[0];
  }

  static async getMonthlyStats(month, year) {
    const result = await query(`
      SELECT 
        COALESCE(SUM(CASE WHEN cr.type = 'revenue' THEN je.amount ELSE 0 END), 0) as monthly_income,
        COALESCE(SUM(CASE WHEN dr.type = 'expense' THEN je.amount ELSE 0 END), 0) as monthly_expense,
        COALESCE(SUM(CASE WHEN cr.type = 'revenue' THEN je.amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN dr.type = 'expense' THEN je.amount ELSE 0 END), 0) as monthly_profit
      FROM journal_entries je
      LEFT JOIN chart_of_accounts cr ON je.credit_account = cr.code
      LEFT JOIN chart_of_accounts dr ON je.debit_account = dr.code
      WHERE EXTRACT(MONTH FROM je.entry_date) = $1 
      AND EXTRACT(YEAR FROM je.entry_date) = $2
    `, [month, year]);
    return result.rows[0];
  }

  static async getAgentStats(agentId) {
    // Note: Agent-specific stats might be more complex relying on old accounts table, since journal entries don't natively map to agents
    // We'll retain the old table query for this specific function as it represents direct individual policy/commissions
    const result = await query(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as agent_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as agent_expense,
        SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as agent_profit
      FROM accounts 
      WHERE agent_id = $1
    `, [agentId]);
    return result.rows[0];
  }

  static async getCount() {
    const result = await query('SELECT COUNT(*) as count FROM accounts');
    return result.rows[0].count;
  }
}

module.exports = Account;
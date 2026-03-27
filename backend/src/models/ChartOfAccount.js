const { query } = require('../config/database');

class ChartOfAccount {
  static async create(data) {
    const { code, name, type, parent_id } = data;
    const result = await query(
      `INSERT INTO chart_of_accounts (code, name, type, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [code, name, type, parent_id || null]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(`SELECT * FROM chart_of_accounts WHERE id = $1`, [id]);
    return result.rows[0];
  }

  static async getAll(limit = 100, offset = 0) {
    const result = await query(
      `SELECT * FROM chart_of_accounts ORDER BY code ASC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let idx = 1;
    Object.keys(updates).forEach(key => {
      fields.push(`${key} = $${idx}`);
      values.push(updates[key]);
      idx++;
    });
    if (fields.length === 0) throw new Error('No fields to update');
    const result = await query(
      `UPDATE chart_of_accounts SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      [...values, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await query(`DELETE FROM chart_of_accounts WHERE id = $1`, [id]);
  }

  // Helper to ensure base accounts exist for integration
  static async seedStandardAccounts() {
    const standardAccounts = [
      { code: '1000', name: 'Bank / Cash', type: 'asset' },
      { code: '1200', name: 'Accounts Receivable', type: 'asset' },
      { code: '2000', name: 'Accounts Payable', type: 'liability' },
      { code: '4000', name: 'Commission Revenue', type: 'revenue' },
      { code: '5000', name: 'Salary Expense', type: 'expense' },
      { code: '5100', name: 'General Expenses', type: 'expense' }
    ];

    for (const acc of standardAccounts) {
      const exists = await query(`SELECT id FROM chart_of_accounts WHERE code = $1`, [acc.code]);
      if (exists.rows.length === 0) {
        await query(
          `INSERT INTO chart_of_accounts (code, name, type) VALUES ($1, $2, $3)`,
          [acc.code, acc.name, acc.type]
        );
        console.log(`Seeded standard account: ${acc.code} - ${acc.name}`);
      }
    }
  }
}

module.exports = ChartOfAccount;

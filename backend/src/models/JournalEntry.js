const { query } = require('../config/database');

class JournalEntry {
  static async create(data) {
    const { description, debit_account, credit_account, amount, entry_date } = data;
    const result = await query(
      `INSERT INTO journal_entries (description, debit_account, credit_account, amount, entry_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [description, debit_account, credit_account, amount, entry_date || new Date()]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(`SELECT * FROM journal_entries WHERE id = $1`, [id]);
    return result.rows[0];
  }

  static async getAll(limit = 10, offset = 0) {
    const result = await query(
      `SELECT * FROM journal_entries ORDER BY entry_date DESC, id DESC LIMIT $1 OFFSET $2`,
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
      `UPDATE journal_entries SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      [...values, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await query(`DELETE FROM journal_entries WHERE id = $1`, [id]);
  }
}

module.exports = JournalEntry;

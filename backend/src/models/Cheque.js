const { query } = require('../config/database');
const JournalEntry = require('./JournalEntry');

class Cheque {
  static async create(data) {
    const { payee, amount, status, issued_date, cleared_date } = data;
    const result = await query(
      `INSERT INTO cheques (payee, amount, status, issued_date, cleared_date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [payee, amount, status || 'Pending', issued_date || new Date(), cleared_date || null]
    );
    return result.rows[0];
  }

  static async getAll(limit = 10, offset = 0) {
    const result = await query(
      `SELECT * FROM cheques ORDER BY issued_date DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await query(`SELECT * FROM cheques WHERE id = $1`, [id]);
    return result.rows[0];
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
      `UPDATE cheques SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      [...values, id]
    );

    // If cheque was just marked as Cleared, create a Journal Entry
    if (updates.status === 'Cleared' || updates.status === 'cleared') {
      const cheque = result.rows[0];
      await JournalEntry.create({
        description: `Cheque Cleared to ${cheque.payee}`,
        debit_account: '5100', // General Expense Debit
        credit_account: '1000', // Bank Credit
        amount: cheque.amount,
        entry_date: new Date()
      });
    }

    return result.rows[0];
  }

  static async delete(id) {
    await query(`DELETE FROM cheques WHERE id = $1`, [id]);
  }
}

module.exports = Cheque;

const { query } = require('../config/database');
const JournalEntry = require('./JournalEntry');

class PaymentVoucher {
  static async create(data) {
    const { description, amount, status } = data;
    const result = await query(
      `INSERT INTO payment_vouchers (description, amount, status)
       VALUES ($1, $2, $3) RETURNING *`,
      [description, amount, status || 'Pending']
    );
    return result.rows[0];
  }

  static async getAll(limit = 10, offset = 0) {
    const result = await query(
      `SELECT * FROM payment_vouchers ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await query(`SELECT * FROM payment_vouchers WHERE id = $1`, [id]);
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
      `UPDATE payment_vouchers SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      [...values, id]
    );

    // If voucher was just marked as Paid, create a Journal Entry
    if (updates.status === 'Paid' || updates.status === 'paid') {
      const pv = result.rows[0];
      await JournalEntry.create({
        description: `Payment Voucher Paid: ${pv.description}`,
        debit_account: '1000', // Bank Debit 
        credit_account: '1200', // Accounts Receivable Credit
        amount: pv.amount,
        entry_date: new Date()
      });
    }

    return result.rows[0];
  }

  static async delete(id) {
    await query(`DELETE FROM payment_vouchers WHERE id = $1`, [id]);
  }
}

module.exports = PaymentVoucher;

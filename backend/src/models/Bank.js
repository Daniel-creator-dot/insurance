const { query } = require('../config/database');

class Bank {
  static async create(data) {
    const { name, account_number, balance } = data;
    const result = await query(
      `INSERT INTO banks (name, account_number, balance)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, account_number, balance || 0]
    );
    return result.rows[0];
  }

  static async getAll(limit = 10, offset = 0) {
    const result = await query(
      `SELECT * FROM banks ORDER BY name ASC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await query(`SELECT * FROM banks WHERE id = $1`, [id]);
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
      `UPDATE banks SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      [...values, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await query(`DELETE FROM banks WHERE id = $1`, [id]);
  }
}

module.exports = Bank;

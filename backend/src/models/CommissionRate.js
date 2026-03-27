const { query } = require('../config/database');

class CommissionRate {
  static async create(rateData) {
    const { class_of_business, agreed_rate } = rateData;
    const result = await query(
      `INSERT INTO commission_rates (class_of_business, agreed_rate) \
       VALUES ($1, $2) RETURNING id, class_of_business, agreed_rate, created_at, updated_at`,
      [class_of_business, agreed_rate]
    );
    return result.rows[0];
  }

  static async getAll() {
    const result = await query(`SELECT * FROM commission_rates ORDER BY class_of_business ASC`);
    return result.rows;
  }

  static async findById(id) {
    const result = await query(`SELECT * FROM commission_rates WHERE id = $1`, [id]);
    return result.rows[0];
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
      `UPDATE commission_rates SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
      [...values, id]
    );

    return result.rows[0];
  }

  static async delete(id) {
    await query('DELETE FROM commission_rates WHERE id = $1', [id]);
  }

  static async findByClass(classOfBusiness) {
    const result = await query(
      'SELECT * FROM commission_rates WHERE class_of_business = $1',
      [classOfBusiness]
    );
    return result.rows[0];
  }
}

module.exports = CommissionRate;
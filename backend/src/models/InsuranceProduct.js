const { query } = require('../config/database');

class InsuranceProduct {
  static async create(productData) {
    const { insurance_type, class_of_business, description, commission_rate, is_active } = productData;
    const result = await query(
      `INSERT INTO insurance_products (insurance_type, class_of_business, description, commission_rate, is_active) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [insurance_type, class_of_business, description, commission_rate, is_active ?? true]
    );
    return result.rows[0];
  }

  static async getAll() {
    const result = await query(
      `SELECT * FROM insurance_products WHERE is_active = true ORDER BY insurance_type, class_of_business ASC`
    );
    return result.rows;
  }

  static async getByInsuranceType(insuranceType) {
    const result = await query(
      `SELECT * FROM insurance_products 
       WHERE insurance_type = $1 AND is_active = true 
       ORDER BY class_of_business ASC`,
      [insuranceType]
    );
    return result.rows;
  }

  static async getInsuranceTypes() {
    const result = await query(
      `SELECT DISTINCT insurance_type FROM insurance_products 
       WHERE is_active = true 
       ORDER BY insurance_type ASC`
    );
    return result.rows.map(r => r.insurance_type);
  }

  static async findById(id) {
    const result = await query(
      `SELECT * FROM insurance_products WHERE id = $1`,
      [id]
    );
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
      `UPDATE insurance_products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
      [...values, id]
    );

    return result.rows[0];
  }

  static async delete(id) {
    await query('DELETE FROM insurance_products WHERE id = $1', [id]);
  }
}

module.exports = InsuranceProduct;

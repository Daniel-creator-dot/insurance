const { query } = require('../config/database');

class CompanySetting {
  static async get() {
    // Return the first record since there should only be one settings config
    const result = await query('SELECT * FROM company_settings ORDER BY id ASC LIMIT 1');
    if (result.rows.length === 0) {
      // Create defaults if not exists
      const defaultSettings = await query(`
        INSERT INTO company_settings (company_name, tax_id, office_address) 
        VALUES ('Kesbridge', 'TX-99281-B', 'Mathehko-Acca Prime care') 
        RETURNING *
      `);
      return defaultSettings.rows[0];
    }
    return result.rows[0];
  }

  static async update(updates) {
    const { company_name, tax_id, office_address } = updates;
    // Check if configuration exists
    const current = await this.get();
    
    const result = await query(
      `UPDATE company_settings 
       SET company_name = $1, tax_id = $2, office_address = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING *`,
      [company_name, tax_id, office_address, current.id]
    );

    return result.rows[0];
  }
}

module.exports = CompanySetting;

const { query } = require('../config/database');

class Reconciliation {
  static async create(data) {
    const { staff_id, month, payroll_run_id, amount, description } = data;
    const result = await query(
      `INSERT INTO reconciliations (staff_id, month, payroll_run_id, amount, description)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [staff_id, month, payroll_run_id, amount, description]
    );
    return result.rows[0];
  }

  static async findByStaffAndMonth(staffId, month) {
    const result = await query(
      `SELECT r.*, u.name as staff_name, pr.period_start, pr.period_end
       FROM reconciliations r
       JOIN users u ON r.staff_id = u.id
       LEFT JOIN payroll_runs pr ON r.payroll_run_id = pr.id
       WHERE r.staff_id = $1 AND r.month = $2`,
      [staffId, month]
    );
    return result.rows[0];
  }

  static async getByStaff(staffId, limit = 10, offset = 0) {
    const result = await query(
      `SELECT r.*, u.name as staff_name, pr.period_start, pr.period_end
       FROM reconciliations r
       JOIN users u ON r.staff_id = u.id
       LEFT JOIN payroll_runs pr ON r.payroll_run_id = pr.id
       WHERE r.staff_id = $1
       ORDER BY r.month DESC, r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [staffId, limit, offset]
    );
    return result.rows;
  }

  static async getByMonth(month) {
    const result = await query(
      `SELECT r.*, u.name as staff_name, pr.period_start, pr.period_end
       FROM reconciliations r
       JOIN users u ON r.staff_id = u.id
       LEFT JOIN payroll_runs pr ON r.payroll_run_id = pr.id
       WHERE r.month = $1
       ORDER BY u.name`,
      [month]
    );
    return result.rows;
  }

  static async getAll(limit = 10, offset = 0) {
    const result = await query(
      `SELECT r.*, u.name as staff_name, pr.period_start, pr.period_end
       FROM reconciliations r
       JOIN users u ON r.staff_id = u.id
       LEFT JOIN payroll_runs pr ON r.payroll_run_id = pr.id
       ORDER BY r.month DESC, r.created_at DESC
       LIMIT $1 OFFSET $2`,
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
      `UPDATE reconciliations SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      [...values, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await query(`DELETE FROM reconciliations WHERE id = $1`, [id]);
  }

  static async deleteByStaffAndMonth(staffId, month) {
    await query(`DELETE FROM reconciliations WHERE staff_id = $1 AND month = $2`, [staffId, month]);
  }
}

module.exports = Reconciliation;
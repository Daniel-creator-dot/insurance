const { query } = require('../config/database');

class PayrollEntry {
  static async create(data) {
    const { payroll_run_id, user_id, base_salary, commission_earned, bonuses, deductions, gross_pay, net_pay, payment_date } = data;
    const result = await query(
      `INSERT INTO payroll_entries (payroll_run_id, user_id, base_salary, commission_earned, bonuses, deductions, gross_pay, net_pay, payment_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [payroll_run_id, user_id, base_salary, commission_earned || 0, bonuses || 0, deductions || 0, gross_pay, net_pay, payment_date]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(`SELECT * FROM payroll_entries WHERE id = $1`, [id]);
    return result.rows[0];
  }

  static async getByPayrollRun(payrollRunId) {
    const result = await query(
      `SELECT pe.*, u.name as user_name, u.role
       FROM payroll_entries pe
       JOIN users u ON pe.user_id = u.id
       WHERE pe.payroll_run_id = $1
       ORDER BY u.name`,
      [payrollRunId]
    );
    return result.rows;
  }

  static async getByUser(userId, limit = 10, offset = 0) {
    const result = await query(
      `SELECT pe.*, pr.period_start, pr.period_end, pr.status
       FROM payroll_entries pe
       JOIN payroll_runs pr ON pe.payroll_run_id = pr.id
       WHERE pe.user_id = $1
       ORDER BY pr.period_end DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
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
      `UPDATE payroll_entries SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      [...values, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await query(`DELETE FROM payroll_entries WHERE id = $1`, [id]);
  }
}

module.exports = PayrollEntry;
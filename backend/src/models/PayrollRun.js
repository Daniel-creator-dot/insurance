const { query } = require('../config/database');
const PayrollEntry = require('./PayrollEntry');
const Reconciliation = require('./Reconciliation');
const JournalEntry = require('./JournalEntry');

class PayrollRun {
  static async create(data) {
    const {
      period_start,
      period_end,
      status = 'draft',
      total_gross = 0,
      total_deductions = 0,
      total_net = 0,
      processed_by = null,
      processed_at = null
    } = data;
    const result = await query(
      `INSERT INTO payroll_runs (
        period_start,
        period_end,
        status,
        total_gross,
        total_deductions,
        total_net,
        processed_by,
        processed_at
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        period_start,
        period_end,
        status,
        total_gross,
        total_deductions,
        total_net,
        processed_by,
        processed_at
      ]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(`SELECT * FROM payroll_runs WHERE id = $1`, [id]);
    return result.rows[0];
  }

  static async getAll(limit = 10, offset = 0) {
    const result = await query(
      `SELECT
        pr.id,
        pr.period_start,
        pr.period_end,
        pr.status,
        pr.total_gross,
        pr.total_deductions,
        pr.total_net,
        pr.processed_by,
        pr.processed_at,
        pr.created_at,
        u.name as processed_by_name,
        COUNT(pe.id)::int as employee_count
       FROM payroll_runs pr
       LEFT JOIN users u ON pr.processed_by = u.id
       LEFT JOIN payroll_entries pe ON pe.payroll_run_id = pr.id
       GROUP BY
        pr.id,
        pr.period_start,
        pr.period_end,
        pr.status,
        pr.total_gross,
        pr.total_deductions,
        pr.total_net,
        pr.processed_by,
        pr.processed_at,
        pr.created_at,
        u.name
       ORDER BY pr.created_at DESC
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
      `UPDATE payroll_runs SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
      [...values, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await query(`DELETE FROM payroll_runs WHERE id = $1`, [id]);
  }

  // Calculate payroll for a given period
  static async calculatePayroll(periodStart, periodEnd) {
    // Get all active users with their base salaries
    const usersResult = await query(
      `SELECT id, name, base_salary, commission_rate, role FROM users WHERE is_active = true`
    );
    const users = usersResult.rows;

    // Calculate commission earned by each user in this period
    const commissionsResult = await query(`
      SELECT
        p.agent_id as user_id,
        SUM(p.net_comm) as total_commission
      FROM policies p
      WHERE p.date_commission_paid >= $1 AND p.date_commission_paid <= $2
        AND p.agent_id IS NOT NULL
      GROUP BY p.agent_id
    `, [periodStart, periodEnd]);

    const commissions = {};
    commissionsResult.rows.forEach(row => {
      commissions[row.user_id] = parseFloat(row.total_commission || 0);
    });

    // Calculate payroll entries
    const payrollEntries = users.map(user => {
      const baseSalary = parseFloat(user.base_salary || 0);
      const commissionEarned = commissions[user.id] || 0;
      const grossPay = baseSalary + commissionEarned;
      const netPay = grossPay; // No deductions for now

      return {
        user_id: user.id,
        user_name: user.name,
        role: user.role,
        base_salary: baseSalary,
        commission_earned: commissionEarned,
        gross_pay: grossPay,
        net_pay: netPay
      };
    });

    // Calculate totals
    const totalGross = payrollEntries.reduce((sum, entry) => sum + entry.gross_pay, 0);
    const totalNet = payrollEntries.reduce((sum, entry) => sum + entry.net_pay, 0);

    return {
      period_start: periodStart,
      period_end: periodEnd,
      entries: payrollEntries,
      total_gross: totalGross,
      total_net: totalNet
    };
  }

  // Process payroll (create entries and accounting records)
  static async processPayroll(periodStart, periodEnd, processedBy) {
    const calculation = await PayrollRun.calculatePayroll(periodStart, periodEnd);

    // Create payroll run
    const payrollRun = await PayrollRun.create({
      period_start: periodStart,
      period_end: periodEnd,
      processed_by: processedBy,
      total_gross: calculation.total_gross,
      total_net: calculation.total_net,
      total_deductions: 0,
      status: 'processed',
      processed_at: new Date()
    });

    // Create payroll entries and reconciliation records
    const payrollEntries = [];
    for (const entry of calculation.entries) {
      const payrollEntry = await PayrollEntry.create({
        ...entry,
        payroll_run_id: payrollRun.id
      });
      payrollEntries.push(payrollEntry);

      // Create accounting entry for salary expense via Double-Entry Journal
      await JournalEntry.create({
        description: `Salary payment for ${periodStart} - ${periodEnd} (Staff: ${entry.user_name})`,
        debit_account: '5000', // Salary Expense
        credit_account: '1000', // Bank
        amount: entry.net_pay,
        entry_date: new Date()
      });

      // Create reconciliation record for this staff member and month
      const month = new Date(periodEnd).toISOString().slice(0, 7); // YYYY-MM format
      // Ensure re-processing payroll for same month doesn't violate UNIQUE(staff_id, month)
      await Reconciliation.deleteByStaffAndMonth(entry.user_id, month);
      await Reconciliation.create({
        staff_id: entry.user_id,
        month: month,
        payroll_run_id: payrollRun.id,
        amount: entry.net_pay,
        description: `Salary reconciliation for ${month}`
      });
    }

    return {
      payroll_run: payrollRun,
      entries: payrollEntries
    };
  }
}

module.exports = PayrollRun;

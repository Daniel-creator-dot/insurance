const { query } = require('../config/database');

class Policy {
  // Get the maximum allowed commission rate for a class of business
  static async getMaxCommissionRate(classOfBusiness) {
    if (!classOfBusiness) return null;
    
    const result = await query(
      `SELECT agreed_rate FROM commission_rates WHERE class_of_business = $1`,
      [classOfBusiness]
    );
    
    return result.rows.length > 0 ? result.rows[0].agreed_rate : null;
  }

  // Validate commission percent against max allowed rate
  static async validateCommissionPercent(classOfBusiness, commissionPercent) {
    const maxRate = await Policy.getMaxCommissionRate(classOfBusiness);
    
    if (!maxRate) {
      return {
        valid: false,
        message: `No commission rate found for class of business: ${classOfBusiness}`
      };
    }
    
    // Cast both to numbers before comparison to avoid string comparison issues
    const numCommissionPercent = parseFloat(commissionPercent);
    const numMaxRate = parseFloat(maxRate);
    
    if (numCommissionPercent > numMaxRate) {
      return {
        valid: false,
        message: `Commission rate ${commissionPercent}% exceeds maximum allowed rate of ${maxRate}% for ${classOfBusiness}`,
        maxRate: maxRate,
        requestedRate: commissionPercent
      };
    }
    
    return {
      valid: true,
      message: `Commission rate accepted`,
      maxRate: maxRate,
      requestedRate: commissionPercent
    };
  }

  static async create(policyData) {
    const { 
      policy_number, client_id, insurance_type, class_of_business, start_date, expiry_date, status, premium, agent_id,
      date_paid, outstanding_premium_paid, vehicle_number, staff_name, is_new_renewal, renewal_date,
      insurance_company, premium_amt_ghs, premium_sticker, commission_percent, commission_expected_ghs,
      with_75_percent, net_comm, date_commission_paid, overrider, net_overrider, date_overrider_paid
    } = policyData;
    
    // Validate commission percent if provided
    if (commission_percent && class_of_business) {
      const validation = await Policy.validateCommissionPercent(class_of_business, commission_percent);
      if (!validation.valid) {
        throw new Error(validation.message);
      }
    }
    
    const result = await query(
      `INSERT INTO policies (policy_number, client_id, insurance_type, class_of_business, start_date, expiry_date, status, premium, agent_id,
                             date_paid, outstanding_premium_paid, vehicle_number, staff_name, is_new_renewal, renewal_date,
                             insurance_company, premium_amt_ghs, premium_sticker, commission_percent, commission_expected_ghs,
                             with_75_percent, net_comm, date_commission_paid, overrider, net_overrider, date_overrider_paid) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26) 
       RETURNING id, policy_number, client_id, insurance_type, class_of_business, start_date, expiry_date, status, premium, agent_id, created_at,
                date_paid, outstanding_premium_paid, vehicle_number, staff_name, is_new_renewal, renewal_date,
                insurance_company, premium_amt_ghs, premium_sticker, commission_percent, commission_expected_ghs,
                with_75_percent, net_comm, date_commission_paid, overrider, net_overrider, date_overrider_paid`,
      [policy_number, client_id, insurance_type, class_of_business, start_date, expiry_date, status || 'Active', premium, agent_id,
       date_paid, outstanding_premium_paid, vehicle_number, staff_name, is_new_renewal, renewal_date,
       insurance_company, premium_amt_ghs, premium_sticker, commission_percent, commission_expected_ghs,
       with_75_percent, net_comm, date_commission_paid, overrider, net_overrider, date_overrider_paid]
    );
    
    const newPolicy = result.rows[0];

    // Create accounting entries for the policy
    await Policy.createAccountingEntries(newPolicy);

    return newPolicy;
  }

  // Create accounting entries when a policy is created
  static async createAccountingEntries(policy) {
    try {
      const premiumAmount = parseFloat(policy.premium_amt_ghs || policy.premium || 0);
      const commissionAmount = parseFloat(policy.net_comm || 0);

      // 1. Record premium income
      if (premiumAmount > 0) {
        await query(`
          INSERT INTO accounts (description, amount, type, category, agent_id)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          `Policy Premium - ${policy.policy_number}`,
          premiumAmount,
          'income',
          'Policy Premium',
          policy.agent_id
        ]);
      }

      // 2. Record commission expense (if commission is paid)
      if (commissionAmount > 0 && policy.date_commission_paid) {
        await query(`
          INSERT INTO accounts (description, amount, type, category, agent_id)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          `Commission Payment - ${policy.policy_number}`,
          commissionAmount,
          'expense',
          'Commission',
          policy.agent_id
        ]);
      }

      // 3. Create journal entries for double-entry bookkeeping
      if (premiumAmount > 0) {
        await query(`
          INSERT INTO journal_entries (description, debit_account, credit_account, amount, entry_date)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          `Policy Premium - ${policy.policy_number}`,
          'Cash/Bank',
          'Premium Income',
          premiumAmount,
          policy.date_paid || policy.created_at
        ]);
      }

      if (commissionAmount > 0 && policy.date_commission_paid) {
        await query(`
          INSERT INTO journal_entries (description, debit_account, credit_account, amount, entry_date)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          `Commission Expense - ${policy.policy_number}`,
          'Commission Expense',
          'Cash/Bank',
          commissionAmount,
          policy.date_commission_paid
        ]);
      }

    } catch (error) {
      console.error('Error creating accounting entries for policy:', error);
      // Don't throw error - policy creation should succeed even if accounting fails
    }
  }

  static async findById(id) {
    const result = await query(
      `SELECT p.*, c.name as client_name, u.name as agent_name 
       FROM policies p 
       LEFT JOIN clients c ON p.client_id = c.id 
       LEFT JOIN users u ON p.agent_id = u.id 
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async getAll(limit = 10, offset = 0) {
    const result = await query(
      `SELECT p.*, c.name as client_name, u.name as agent_name 
       FROM policies p 
       LEFT JOIN clients c ON p.client_id = c.id 
       LEFT JOIN users u ON p.agent_id = u.id 
       ORDER BY p.created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  static async getByAgent(agentId) {
    const result = await query(
      `SELECT p.*, c.name as client_name 
       FROM policies p 
       LEFT JOIN clients c ON p.client_id = c.id 
       WHERE p.agent_id = $1 
       ORDER BY p.created_at DESC`,
      [agentId]
    );
    return result.rows;
  }

  static async getByClient(clientId) {
    const result = await query(
      `SELECT p.*, u.name as agent_name 
       FROM policies p 
       LEFT JOIN users u ON p.agent_id = u.id 
       WHERE p.client_id = $1 
       ORDER BY p.created_at DESC`,
      [clientId]
    );
    return result.rows;
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Validate commission percent if being updated
    if (updates.commission_percent || updates.class_of_business) {
      // Fetch current policy to get existing values
      const currentPolicy = await Policy.findById(id);
      const classOfBusiness = updates.class_of_business || currentPolicy.class_of_business;
      const commissionPercent = updates.commission_percent || currentPolicy.commission_percent;
      
      if (commissionPercent && classOfBusiness) {
        const validation = await Policy.validateCommissionPercent(classOfBusiness, commissionPercent);
        if (!validation.valid) {
          throw new Error(validation.message);
        }
      }
    }

    Object.keys(updates).forEach(key => {
      fields.push(`${key} = $${paramCount}`);
      values.push(updates[key]);
      paramCount++;
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const result = await query(
      `UPDATE policies SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
      [...values, id]
    );

    return result.rows[0];
  }

  static async delete(id) {
    await query('DELETE FROM policies WHERE id = $1', [id]);
  }

  static async search(searchTerm) {
    const result = await query(
      `SELECT p.*, c.name as client_name, u.name as agent_name 
       FROM policies p 
       LEFT JOIN clients c ON p.client_id = c.id 
       LEFT JOIN users u ON p.agent_id = u.id 
       WHERE p.policy_number ILIKE $1 OR c.name ILIKE $1 OR p.insurance_type ILIKE $1 OR p.class_of_business ILIKE $1`,
      [`%${searchTerm}%`]
    );
    return result.rows;
  }

  static async getExpiringSoon(days = 30, agentId = null) {
    let queryText = `
      SELECT 
        p.*, 
        c.name as client_name, 
        c.name as "clientName",
        u.name as agent_name 
      FROM policies p 
      LEFT JOIN clients c ON p.client_id = c.id 
      LEFT JOIN users u ON p.agent_id = u.id 
      WHERE p.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'
      AND p.status = 'Active'
    `;
    const params = [];
    
    if (agentId) {
      queryText += ` AND p.agent_id = $1`;
      params.push(agentId);
    }
    
    queryText += ` ORDER BY p.expiry_date ASC`;
    
    const result = await query(queryText, params);
    return result.rows;
  }

  static async getByType(insuranceType) {
    const result = await query(
      `SELECT p.*, c.name as client_name, u.name as agent_name 
       FROM policies p 
       LEFT JOIN clients c ON p.client_id = c.id 
       LEFT JOIN users u ON p.agent_id = u.id 
       WHERE p.insurance_type = $1 
       ORDER BY p.created_at DESC`,
      [insuranceType]
    );
    return result.rows;
  }

  static async getCount() {
    const result = await query('SELECT COUNT(*) as count FROM policies');
    return result.rows[0].count;
  }

  static async getStats(period = null) {
    let whereClause = '';
    const params = [];

    if (period) {
      whereClause = 'WHERE created_at >= CURRENT_DATE - INTERVAL \'' + period + ' days\'';
    }

    const result = await query(`
      SELECT 
        COUNT(*) as total_policies,
        COUNT(*) FILTER (WHERE status = 'Active') as active_policies,
        COUNT(*) FILTER (WHERE status = 'Expired') as expired_policies,
        COUNT(*) FILTER (WHERE status = 'Pending') as pending_policies,
        SUM(premium) as total_premium
      FROM policies
      ${whereClause}
    `, params);
    return result.rows[0];
  }
}

module.exports = Policy;
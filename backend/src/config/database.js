const { Pool } = require('pg');
require('dotenv').config();

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'insurance',
  user: process.env.DB_USER || 'Admin',
  password: process.env.DB_PASSWORD || 'Admin',
  max: 20,  // Maximum pool size
  idleTimeoutMillis: 30000,  // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000,  // Connect timeout
  statement_timeout: 30000,  // Query timeout in milliseconds
});

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
});

// Database query helper with retry logic
const query = async (text, params, retries = 3) => {
  const start = Date.now();
  let lastError;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      if (duration > 5000) {
        console.warn(`Slow query detected (${duration}ms):`, text.substring(0, 50));
      }
      return res;
    } catch (error) {
      lastError = error;
      console.error(`Query attempt ${attempt}/${retries} failed:`, error.message);
      
      // Don't retry on syntax errors
      if (error.code && error.code.startsWith('42')) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt - 1) * 100));
      }
    }
  }
  
  throw lastError;
};

// Database initialization
const initDB = async () => {
  try {
    // Create tables if they don't exist
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        avatar VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        base_salary DECIMAL(10,2) DEFAULT 0, -- Monthly base salary
        commission_rate DECIMAL(5,2) DEFAULT 0, -- Additional commission rate for sales roles
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // If the users table pre-exists, CREATE TABLE IF NOT EXISTS won't add new columns.
    // Ensure payroll-related columns exist for older databases.
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS base_salary DECIMAL(10,2) DEFAULT 0`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 0`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(255)`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`);

    await query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        date_of_birth DATE,
        joined_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS policies (
        id SERIAL PRIMARY KEY,
        policy_number VARCHAR(50) UNIQUE NOT NULL,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        insurance_type VARCHAR(50) NOT NULL,
        class_of_business VARCHAR(255),
        start_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'Active',
        premium DECIMAL(10,2) NOT NULL,
        agent_id INTEGER REFERENCES users(id),
        date_paid DATE,
        outstanding_premium_paid VARCHAR(255),
        vehicle_number VARCHAR(50),
        staff_name VARCHAR(100),
        is_new_renewal VARCHAR(20),
        renewal_date DATE,
        insurance_company VARCHAR(100),
        premium_amt_ghs DECIMAL(10,2),
        premium_sticker DECIMAL(10,2),
        commission_percent NUMERIC,
        commission_expected_ghs NUMERIC,
        with_75_percent NUMERIC,
        net_comm NUMERIC,
        date_commission_paid DATE,
        overrider NUMERIC,
        net_overrider NUMERIC,
        date_overrider_paid DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        source VARCHAR(50),
        status VARCHAR(30) DEFAULT 'New',
        assigned_to INTEGER REFERENCES users(id),
        communication_history JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure any additional policy columns exist when migrating
    const policyAlterations = [
      'class_of_business VARCHAR(255)',
      'date_paid DATE',
      'outstanding_premium_paid VARCHAR(255)',
      'vehicle_number VARCHAR(50)',
      'staff_name VARCHAR(100)',
      'is_new_renewal VARCHAR(20)',
      'renewal_date DATE',
      'insurance_company VARCHAR(100)',
      'premium_amt_ghs DECIMAL(10,2)',
      'premium_sticker DECIMAL(10,2)',
      'commission_percent NUMERIC',
      'commission_expected_ghs NUMERIC',
      'with_75_percent NUMERIC',
      'net_comm NUMERIC',
      'date_commission_paid DATE',
      'overrider NUMERIC',
      'net_overrider NUMERIC',
      'date_overrider_paid DATE'
    ];

    for (const col of policyAlterations) {
      await query(`ALTER TABLE policies ADD COLUMN IF NOT EXISTS ${col}`);
    }

    await query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS communication_history JSONB DEFAULT '[]'`);

    await query(`
      CREATE TABLE IF NOT EXISTS sms_logs (
        id SERIAL PRIMARY KEY,
        recipient VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'Pending',
        sent_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS otps (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        otp VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        user_name VARCHAR(100) DEFAULT 'System',
        action TEXT NOT NULL,
        target TEXT,
        time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        icon VARCHAR(50),
        color VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS sms_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS insurance_products (
        id SERIAL PRIMARY KEY,
        insurance_type VARCHAR(100) NOT NULL,
        class_of_business VARCHAR(100) NOT NULL,
        description TEXT,
        commission_rate NUMERIC(5,2),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS sms_configs (
        id SERIAL PRIMARY KEY,
        provider VARCHAR(50) NOT NULL,
        api_key VARCHAR(255) NOT NULL,
        api_secret VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        sender_id VARCHAR(50),
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        description TEXT,
        amount DECIMAL(10,2) NOT NULL,
        type VARCHAR(20) NOT NULL, -- 'income' or 'expense'
        category VARCHAR(50),
        agent_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // support for accounting submodules
    await query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id SERIAL PRIMARY KEY,
        description TEXT,
        debit_account VARCHAR(100) NOT NULL,
        credit_account VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        entry_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS chart_of_accounts (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL, -- asset, liability, equity, revenue, expense
        parent_id INTEGER REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS cheques (
        id SERIAL PRIMARY KEY,
        payee VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'Pending',
        issued_date DATE DEFAULT CURRENT_DATE,
        cleared_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS payment_vouchers (
        id SERIAL PRIMARY KEY,
        description TEXT,
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'Pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS banks (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        account_number VARCHAR(100) UNIQUE NOT NULL,
        balance DECIMAL(14,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS commission_rates (
        id SERIAL PRIMARY KEY,
        class_of_business VARCHAR(255) UNIQUE NOT NULL,
        agreed_rate NUMERIC(5,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS payroll_runs (
        id SERIAL PRIMARY KEY,
        period_start DATE NOT NULL, -- Start of payroll period (e.g., 2026-03-01 for March payroll)  
        period_end DATE NOT NULL,   -- End of payroll period (e.g., 2026-03-31 for March payroll)
        status VARCHAR(20) DEFAULT 'draft', -- draft, processed, paid
        total_gross DECIMAL(12,2) DEFAULT 0,
        total_deductions DECIMAL(12,2) DEFAULT 0, 
        total_net DECIMAL(12,2) DEFAULT 0,
        processed_by INTEGER REFERENCES users(id),
        processed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS payroll_entries (
        id SERIAL PRIMARY KEY,
        payroll_run_id INTEGER REFERENCES payroll_runs(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        base_salary DECIMAL(10,2) NOT NULL,
        commission_earned DECIMAL(10,2) DEFAULT 0, -- Commission from policies in this period
        bonuses DECIMAL(10,2) DEFAULT 0, -- Any additional bonuses
        deductions DECIMAL(10,2) DEFAULT 0, -- Tax, insurance, etc. (for future expansion) 
        gross_pay DECIMAL(10,2) NOT NULL, -- base + commission + bonuses
        net_pay DECIMAL(10,2) NOT NULL, -- gross - deductions
        payment_date DATE, -- When salary was actually paid
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS reconciliations (
        id SERIAL PRIMARY KEY,
        staff_id INTEGER REFERENCES users(id) NOT NULL,
        month VARCHAR(7) NOT NULL, -- Format: YYYY-MM (e.g., 2026-03)
        payroll_run_id INTEGER REFERENCES payroll_runs(id),
        amount DECIMAL(12,2) NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(staff_id, month)
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS company_settings (
        id SERIAL PRIMARY KEY,
        company_name VARCHAR(255) DEFAULT 'Kesbridge',
        tax_id VARCHAR(100) DEFAULT 'TX-99281-B',
        office_address TEXT DEFAULT 'Mathehko-Acca Prime care',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

module.exports = {
  query,
  initDB,
  pool
};
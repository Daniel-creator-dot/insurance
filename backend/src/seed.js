const { query } = require('./config/database');
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('Seeding database...');

    // Clear existing data (in correct dependency order)
    await query('DELETE FROM activities');
    await query('DELETE FROM sms_templates');
    await query('DELETE FROM insurance_products');
    await query('DELETE FROM journal_entries');
    await query('DELETE FROM accounts');
    await query('DELETE FROM sms_logs');
    await query('DELETE FROM policies');
    await query('DELETE FROM leads');
    await query('DELETE FROM clients');
    await query('DELETE FROM otps');
    await query('DELETE FROM users');

    // Seed Users
    const saltRounds = 10;
    
    const superAdminPassword = await bcrypt.hash('admin123', saltRounds);
    const marketerPassword = await bcrypt.hash('marketer123', saltRounds);
    const agentPassword = await bcrypt.hash('agent123', saltRounds);
    const accountantPassword = await bcrypt.hash('accountant123', saltRounds);

    const users = [
      {
        name: 'John Admin',
        email: 'admin@insurify.com',
        password: superAdminPassword,
        role: 'SUPER_ADMIN',
        base_salary: 5000.00,
        commission_rate: 0.00
      },
      {
        name: 'Sarah Marketer',
        email: 'sarah@insurify.com',
        password: marketerPassword,
        role: 'MARKETER',
        base_salary: 3000.00,
        commission_rate: 0.05
      },
      {
        name: 'Mike Agent',
        email: 'mike@insurify.com',
        password: agentPassword,
        role: 'SALES_AGENT',
        base_salary: 2500.00,
        commission_rate: 0.10
      },
      {
        name: 'Lisa Accountant',
        email: 'lisa@insurify.com',
        password: accountantPassword,
        role: 'ACCOUNTANT',
        base_salary: 3500.00,
        commission_rate: 0.00
      }
    ];

    for (const user of users) {
      await query(
        'INSERT INTO users (name, email, password, role, base_salary, commission_rate) VALUES ($1, $2, $3, $4, $5, $6)',
        [user.name, user.email, user.password, user.role, user.base_salary, user.commission_rate]
      );
    }

    // Seed Clients
    const clients = [
      { name: 'Alice Johnson', email: 'alice@example.com', phone: '+233241234567', address: '123 Main St, Accra', date_of_birth: '1985-06-15' },
      { name: 'Robert Brown', email: 'robert@example.com', phone: '+233242345678', address: '456 High St, Kumasi', date_of_birth: '1978-03-22' },
      { name: 'Michael Scott', email: 'michael@example.com', phone: '+233243456789', address: '789 Office Rd, Takoradi', date_of_birth: '1982-11-05' },
      { name: 'Pam Beesly', email: 'pam@example.com', phone: '+233244567890', address: '321 Reception Ave, Cape Coast', date_of_birth: '1990-08-14' },
      { name: 'Jim Halpert', email: 'jim@example.com', phone: '+233245678901', address: '654 Sales Blvd, Tamale', date_of_birth: '1987-10-01' },
      { name: 'Dwight Schrute', email: 'dwight@example.com', phone: '+233246789012', address: '987 Farm Ln, Sunyani', date_of_birth: '1975-01-20' },
      { name: 'Kelly Kapoor', email: 'kelly@example.com', phone: '+233247890123', address: '147 Tech St, Ho', date_of_birth: '1992-05-30' },
      { name: 'Ryan Howard', email: 'ryan@example.com', phone: '+233248901234', address: '258 Startup Way, Koforidua', date_of_birth: '1989-12-10' },
      { name: 'Angela Martin', email: 'angela@example.com', phone: '+233249012345', address: '369 Accountant Rd, Nsawam', date_of_birth: '1970-09-18' },
      { name: 'Oscar Martinez', email: 'oscar@example.com', phone: '+233250123456', address: '741 Finance Ave, Tema', date_of_birth: '1983-07-25' }
    ];

    for (const client of clients) {
      await query(
        'INSERT INTO clients (name, email, phone, address, date_of_birth) VALUES ($1, $2, $3, $4, $5)',
        [client.name, client.email, client.phone, client.address, client.date_of_birth]
      );
    }

    // ensure policies table has all required extra columns
    await query(`ALTER TABLE policies ADD COLUMN IF NOT EXISTS class_of_business VARCHAR(255)`);

    // fix existing records: set class_of_business to insurance_type if null
    await query(`UPDATE policies SET class_of_business = insurance_type WHERE class_of_business IS NULL`);
    await query(`ALTER TABLE policies ADD COLUMN IF NOT EXISTS date_paid DATE`);
    await query(`ALTER TABLE policies ADD COLUMN IF NOT EXISTS outstanding_premium_paid VARCHAR(255)`);
    await query(`ALTER TABLE policies ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(50)`);
    await query(`ALTER TABLE policies ADD COLUMN IF NOT EXISTS staff_name VARCHAR(100)`);
    await query(`ALTER TABLE policies ADD COLUMN IF NOT EXISTS is_new_renewal VARCHAR(20)`);
    await query(`ALTER TABLE policies ADD COLUMN IF NOT EXISTS renewal_date DATE`);
    await query(`ALTER TABLE policies ADD COLUMN IF NOT EXISTS insurance_company VARCHAR(100)`);
    await query(`ALTER TABLE policies ADD COLUMN IF NOT EXISTS premium_amt_ghs DECIMAL(10,2)`);
    await query(`ALTER TABLE policies ADD COLUMN IF NOT EXISTS premium_sticker DECIMAL(10,2)`);
    await query(`ALTER TABLE policies ADD COLUMN IF NOT EXISTS commission_percent NUMERIC`);
    await query(`ALTER TABLE policies ADD COLUMN IF NOT EXISTS commission_expected_ghs NUMERIC`);
    await query(`ALTER TABLE policies ADD COLUMN IF NOT EXISTS with_75_percent NUMERIC`);
    await query(`ALTER TABLE policies ADD COLUMN IF NOT EXISTS net_comm NUMERIC`);
    await query(`ALTER TABLE policies ADD COLUMN IF NOT EXISTS date_commission_paid DATE`);
    await query(`ALTER TABLE policies ADD COLUMN IF NOT EXISTS overrider NUMERIC`);
    await query(`ALTER TABLE policies ADD COLUMN IF NOT EXISTS net_overrider NUMERIC`);
    await query(`ALTER TABLE policies ADD COLUMN IF NOT EXISTS date_overrider_paid DATE`);

    // Seed Policies
    const policies = [
      { policy_number: 'POL-1001', insurance_type: 'Health', start_date: '2024-01-01', expiry_date: '2025-01-01', status: 'Active', premium: 1200.00, client_id: 1, agent_id: 3 },
      { policy_number: 'POL-1002', insurance_type: 'Life', start_date: '2024-02-15', expiry_date: '2025-02-15', status: 'Active', premium: 2500.00, client_id: 2, agent_id: 3 },
      { policy_number: 'POL-1003', insurance_type: 'Auto', start_date: '2024-03-10', expiry_date: '2025-03-10', status: 'Active', premium: 800.00, client_id: 3, agent_id: 3 },
      { policy_number: 'POL-1004', insurance_type: 'Home', start_date: '2024-04-05', expiry_date: '2025-04-05', status: 'Active', premium: 1500.00, client_id: 4, agent_id: 3 },
      { policy_number: 'POL-1005', insurance_type: 'Health', start_date: '2024-05-20', expiry_date: '2025-05-20', status: 'Active', premium: 1100.00, client_id: 5, agent_id: 3 },
      { policy_number: 'POL-1006', insurance_type: 'Life', start_date: '2024-06-12', expiry_date: '2025-06-12', status: 'Active', premium: 2200.00, client_id: 6, agent_id: 3 },
      { policy_number: 'POL-1007', insurance_type: 'Auto', start_date: '2024-07-08', expiry_date: '2025-07-08', status: 'Active', premium: 900.00, client_id: 7, agent_id: 3 },
      { policy_number: 'POL-1008', insurance_type: 'Home', start_date: '2024-08-22', expiry_date: '2025-08-22', status: 'Active', premium: 1300.00, client_id: 8, agent_id: 3 },
      { policy_number: 'POL-1009', insurance_type: 'Health', start_date: '2024-09-14', expiry_date: '2025-09-14', status: 'Active', premium: 1400.00, client_id: 9, agent_id: 3 },
      { policy_number: 'POL-1010', insurance_type: 'Life', start_date: '2024-10-30', expiry_date: '2025-10-30', status: 'Active', premium: 2800.00, client_id: 10, agent_id: 3 },
      { policy_number: 'POL-1011', insurance_type: 'Auto', start_date: '2024-11-25', expiry_date: '2025-11-25', status: 'Active', premium: 750.00, client_id: 1, agent_id: 3 },
      { policy_number: 'POL-1012', insurance_type: 'Home', start_date: '2024-12-18', expiry_date: '2025-12-18', status: 'Active', premium: 1600.00, client_id: 2, agent_id: 3 }
    ];

    for (const policy of policies) {
      await query(
        'INSERT INTO policies (policy_number, client_id, insurance_type, class_of_business, start_date, expiry_date, status, premium, agent_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [policy.policy_number, policy.client_id, policy.insurance_type, policy.class_of_business || null, policy.start_date, policy.expiry_date, policy.status, policy.premium, policy.agent_id]
      );
    }

    // Seed Leads
    const leads = [
      { name: 'John Doe', email: 'john.doe@example.com', phone: '+233261234567', source: 'Website', status: 'New', assigned_to: 2 },
      { name: 'Jane Smith', email: 'jane.smith@example.com', phone: '+233262345678', source: 'Referral', status: 'Contacted', assigned_to: 2 },
      { name: 'Bob Wilson', email: 'bob.wilson@example.com', phone: '+233263456789', source: 'Social Media', status: 'Qualified', assigned_to: 2 },
      { name: 'Carol Davis', email: 'carol.davis@example.com', phone: '+233264567890', source: 'Email Campaign', status: 'Converted', assigned_to: 2 },
      { name: 'David Taylor', email: 'david.taylor@example.com', phone: '+233265678901', source: 'Website', status: 'Lost', assigned_to: 2 },
      { name: 'Eva Brown', email: 'eva.brown@example.com', phone: '+233266789012', source: 'Referral', status: 'New', assigned_to: 2 },
      { name: 'Frank Miller', email: 'frank.miller@example.com', phone: '+233267890123', source: 'Social Media', status: 'Contacted', assigned_to: 2 },
      { name: 'Grace Wilson', email: 'grace.wilson@example.com', phone: '+233268901234', source: 'Email Campaign', status: 'Qualified', assigned_to: 2 }
    ];

    for (const lead of leads) {
      await query(
        'INSERT INTO leads (name, email, phone, source, status, assigned_to) VALUES ($1, $2, $3, $4, $5, $6)',
        [lead.name, lead.email, lead.phone, lead.source, lead.status, lead.assigned_to]
      );
    }

    // Seed Accounts
    const accounts = [
      { description: 'Policy Premium - Health Insurance', amount: 1200.00, type: 'income', category: 'Policy Premium', agent_id: 3 },
      { description: 'Policy Premium - Life Insurance', amount: 2500.00, type: 'income', category: 'Policy Premium', agent_id: 3 },
      { description: 'Policy Premium - Auto Insurance', amount: 800.00, type: 'income', category: 'Policy Premium', agent_id: 3 },
      { description: 'Commission Payment - Sales Agent', amount: 350.00, type: 'expense', category: 'Commission', agent_id: 3 },
      { description: 'Office Rent', amount: 1500.00, type: 'expense', category: 'Office Expense' },
      { description: 'Utilities', amount: 200.00, type: 'expense', category: 'Office Expense' },
      { description: 'Marketing Campaign', amount: 1000.00, type: 'expense', category: 'Marketing' },
      { description: 'Software Subscription', amount: 150.00, type: 'expense', category: 'Technology' },
      { description: 'Policy Premium - Home Insurance', amount: 1500.00, type: 'income', category: 'Policy Premium', agent_id: 3 },
      { description: 'Commission Payment - Sales Agent', amount: 200.00, type: 'expense', category: 'Commission', agent_id: 3 }
    ];

    for (const account of accounts) {
      await query(
        'INSERT INTO accounts (description, amount, type, category, agent_id) VALUES ($1, $2, $3, $4, $5)',
        [account.description, account.amount, account.type, account.category, account.agent_id || null]
      );
    }

    // Seed SMS Logs
    const smsLogs = [
      { recipient: '+233241234567', message: 'Your policy POL-1001 expires on 2025-01-01. Please contact us for renewal.', status: 'Sent' },
      { recipient: '+233242345678', message: 'Thank you for choosing our life insurance policy. Your coverage is active.', status: 'Sent' },
      { recipient: '+233243456789', message: 'Reminder: Your auto insurance payment is due next week.', status: 'Pending' },
      { recipient: '+233244567890', message: 'Welcome to Insurify! Your home insurance policy is now active.', status: 'Sent' },
      { recipient: '+233245678901', message: 'We have a special offer on health insurance. Contact us for details.', status: 'Failed' }
    ];

    for (const sms of smsLogs) {
      await query(
        'INSERT INTO sms_logs (recipient, message, status, sent_at) VALUES ($1, $2, $3, $4)',
        [sms.recipient, sms.message, sms.status, sms.status === 'Sent' ? new Date() : null]
      );
    }

    // Commission rates table (broker maximum rates)
    await query(`
      CREATE TABLE IF NOT EXISTS commission_rates (
        id SERIAL PRIMARY KEY,
        class_of_business VARCHAR(255) UNIQUE NOT NULL,
        agreed_rate NUMERIC NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const commissionRates = [
      { class_of_business: 'Bonds', agreed_rate: 20 },
      { class_of_business: 'Fire', agreed_rate: 21 },
      { class_of_business: 'Contractors All Risk', agreed_rate: 20 },
      { class_of_business: 'Engineering', agreed_rate: 20 },
      { class_of_business: 'Accident', agreed_rate: 20 },
      { class_of_business: 'Marine Cargo', agreed_rate: 12.5 },
      { class_of_business: 'Marine Hull', agreed_rate: 12.5 },
      { class_of_business: 'Motor Comprehensive', agreed_rate: 16.5 },
      { class_of_business: 'Motor Third Party', agreed_rate: 10 },
      { class_of_business: "Workmen's Compensation", agreed_rate: 15 }
    ];

    for (const rate of commissionRates) {
      await query(
        'INSERT INTO commission_rates (class_of_business, agreed_rate) VALUES ($1, $2) ON CONFLICT (class_of_business) DO NOTHING',
        [rate.class_of_business, rate.agreed_rate]
      );
    }

    for (const sms of smsLogs) {
      await query(
        'INSERT INTO sms_logs (recipient, message, status, sent_at) VALUES ($1, $2, $3, $4)',
        [sms.recipient, sms.message, sms.status, sms.status === 'Sent' ? new Date() : null]
      );
    }

    // Seed SMS Templates
    const smsTemplates = [
      { name: 'Policy Renewal Reminder', content: 'Dear client, your policy {{policy_number}} is expiring on {{expiry_date}}. Please contact us for renewal.' },
      { name: 'Welcome Message', content: 'Welcome to Insurify! Your account has been successfully created. We are happy to serve you.' },
      { name: 'Payment Received', content: 'We have received your payment for policy {{policy_number}}. Thank you for your business.' },
      { name: 'Lead Follow-up', content: 'Hi {{name}}, we are following up on your inquiry about our insurance products. Are you still interested?' }
    ];

    for (const template of smsTemplates) {
      await query(
        'INSERT INTO sms_templates (name, content) VALUES ($1, $2)',
        [template.name, template.content]
      );
    }

    // Seed Insurance Products
    const insuranceProducts = [
      { insurance_type: 'Health', class_of_business: 'Individual Health', description: 'Health insurance for individuals', commission_rate: 15.00 },
      { insurance_type: 'Health', class_of_business: 'Corporate Health', description: 'Group health insurance for companies', commission_rate: 12.50 },
      { insurance_type: 'Life', class_of_business: 'Term Life', description: 'Life insurance for a specific term', commission_rate: 20.00 },
      { insurance_type: 'Auto', class_of_business: 'Comprehensive', description: 'Full coverage auto insurance', commission_rate: 16.50 },
      { insurance_type: 'Auto', class_of_business: 'Third Party', description: 'Basic liability auto insurance', commission_rate: 10.00 }
    ];

    for (const product of insuranceProducts) {
      await query(
        'INSERT INTO insurance_products (insurance_type, class_of_business, description, commission_rate) VALUES ($1, $2, $3, $4)',
        [product.insurance_type, product.class_of_business, product.description, product.commission_rate]
      );
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

seedDatabase();
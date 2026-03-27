const { query, initDB } = require('./src/config/database');

const seedAccountsData = async () => {
  try {
    console.log('Initializing database tables...');
    await initDB();
    console.log('Seeding accounts data...');

    // Seed accounts table (existing)
    await query(`
      INSERT INTO accounts (description, amount, type, category, agent_id) VALUES
      ('Policy Premium POL-8821', 1200.00, 'income', 'Policy Premium', 1),
      ('Office Rent Payment', 2500.00, 'expense', 'Office Expense', 1),
      ('Agent Commission - John Doe', 450.00, 'expense', 'Commission', 2),
      ('Policy Premium POL-1029', 2500.00, 'income', 'Policy Premium', 2),
      ('Marketing Expenses', 800.00, 'expense', 'Marketing', 1),
      ('Insurance Claim Payout', 1500.00, 'expense', 'Claims', 1),
      ('New Policy Sale - Motor', 3000.00, 'income', 'Policy Premium', 2),
      ('Staff Salary - March', 2000.00, 'expense', 'Salary', 1)
    `);

    // Seed journal_entries
    await query(`
      INSERT INTO journal_entries (description, debit_account, credit_account, amount, entry_date) VALUES
      ('Policy Premium Received', 'Cash', 'Premium Income', 1200.00, '2026-03-01'),
      ('Office Rent Paid', 'Rent Expense', 'Cash', 2500.00, '2026-03-02'),
      ('Commission Paid', 'Commission Expense', 'Cash', 450.00, '2026-03-03'),
      ('Premium Income', 'Cash', 'Premium Income', 2500.00, '2026-03-04'),
      ('Marketing Expense', 'Marketing Expense', 'Cash', 800.00, '2026-03-05')
    `);

    // Seed chart_of_accounts
    await query(`
      INSERT INTO chart_of_accounts (code, name, type) VALUES
      ('1000', 'Cash', 'debit'),
      ('2000', 'Accounts Receivable', 'debit'),
      ('3000', 'Premium Income', 'credit'),
      ('4000', 'Commission Expense', 'debit'),
      ('5000', 'Rent Expense', 'debit'),
      ('6000', 'Marketing Expense', 'debit'),
      ('7000', 'Claims Expense', 'debit'),
      ('8000', 'Salary Expense', 'debit')
    `);

    // Seed cheques
    await query(`
      INSERT INTO cheques (payee, amount, status, issued_date) VALUES
      ('Office Landlord', 2500.00, 'Cleared', '2026-03-02'),
      ('Marketing Agency', 800.00, 'Pending', '2026-03-05'),
      ('Staff Member', 2000.00, 'Pending', '2026-03-10')
    `);

    // Seed payment_vouchers
    await query(`
      INSERT INTO payment_vouchers (description, amount, status) VALUES
      ('Policy Premium POL-8821', 1200.00, 'Paid'),
      ('Policy Premium POL-1029', 2500.00, 'Pending'),
      ('New Policy Sale - Motor', 3000.00, 'Paid')
    `);

    // Seed banks
    await query(`
      INSERT INTO banks (name, account_number, balance) VALUES
      ('Ghana Commercial Bank', '1234567890', 15000.00),
      ('Ecobank Ghana', '0987654321', 25000.00)
    `);

    console.log('Accounts data seeded successfully!');
  } catch (error) {
    console.error('Error seeding accounts data:', error);
    process.exit(1);
  }
};

seedAccountsData();
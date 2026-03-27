const { query } = require('./src/config/database');

const commissionRatesData = [
  { class_of_business: 'Bonds', agreed_rate: 20 },
  { class_of_business: 'Fire', agreed_rate: 21 },
  { class_of_business: 'Contractors All Risk', agreed_rate: 20 },
  { class_of_business: 'Engineering', agreed_rate: 20 },
  { class_of_business: 'Accident', agreed_rate: 20 },
  { class_of_business: 'Marine Cargo', agreed_rate: 12.5 },
  { class_of_business: 'Marine Hull', agreed_rate: 12.5 },
  { class_of_business: 'Motor Comprehensive', agreed_rate: 16.5 },
  { class_of_business: 'Motor Third Party', agreed_rate: 10 },
  { class_of_business: 'Workmen\'s Compensation', agreed_rate: 15 }
];

async function seedCommissionRates() {
  try {
    console.log('Starting commission rates seed...');
    
    // Create table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS commission_rates (
        id SERIAL PRIMARY KEY,
        class_of_business VARCHAR(255) UNIQUE NOT NULL,
        agreed_rate NUMERIC(5,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Commission rates table ready');
    
    // First, clear existing records (optional - comment out if you want to keep existing)
    // await query('DELETE FROM commission_rates');
    
    for (const rate of commissionRatesData) {
      const checkResult = await query(
        `SELECT id FROM commission_rates WHERE class_of_business = $1`,
        [rate.class_of_business]
      );
      
      if (checkResult.rows.length === 0) {
        const result = await query(
          `INSERT INTO commission_rates (class_of_business, agreed_rate) 
           VALUES ($1, $2) 
           RETURNING *`,
          [rate.class_of_business, rate.agreed_rate]
        );
        console.log(`✓ Added: ${rate.class_of_business} - ${rate.agreed_rate}%`);
      } else {
        console.log(`⊘ Already exists: ${rate.class_of_business}`);
      }
    }
    
    console.log('\n✅ Commission rates seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seedCommissionRates();

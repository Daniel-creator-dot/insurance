const { query } = require('./src/config/database');

const addIsActiveColumnSQL = `
  ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
`;

const addPhoneNumberColumnSQL = `
  ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
`;

const addAvatarColumnSQL = `
  ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar TEXT;
`;

const createOTPsTableSQL = `
  CREATE TABLE IF NOT EXISTS otps (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    otp VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

const updateClassSQL = `
  -- ensure older policies have a class_of_business
  ALTER TABLE policies ADD COLUMN IF NOT EXISTS class_of_business VARCHAR(255);
  UPDATE policies SET class_of_business = insurance_type WHERE class_of_business IS NULL;
`;

async function runMigration() {
  try {
    console.log('Adding is_active column to users table...');
    await query(addIsActiveColumnSQL);
    console.log('is_active column added successfully!');

    console.log('Adding phone_number column to users table...');
    await query(addPhoneNumberColumnSQL);
    console.log('phone_number column added successfully!');

    console.log('Adding avatar column to users table...');
    await query(addAvatarColumnSQL);
    console.log('avatar column added successfully!');

    console.log('Creating otps table...');
    await query(createOTPsTableSQL);
    console.log('otps table created successfully!');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();

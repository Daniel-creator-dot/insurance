const { query } = require('../src/config/database');

async function main() {
  const res = await query(
    `SELECT column_name, data_type
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'users'
       AND column_name IN ('base_salary', 'commission_rate')
     ORDER BY column_name`
  );
  console.log(res.rows);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


const { query } = require('./src/config/database');

async function main() {
    try {
        const result = await query('SELECT * FROM journal_entries LIMIT 5');
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

main();

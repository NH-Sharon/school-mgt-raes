const fs = require('fs');
const path = require('path');
require('dotenv').config();
const pool = require('../config/database');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  await pool.query(sql);
  console.log('Schema applied.');

  const migration = fs.readFileSync(path.join(__dirname, 'migrate-srs.sql'), 'utf-8');
  await pool.query(migration);
  console.log('SRS migration applied.');

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

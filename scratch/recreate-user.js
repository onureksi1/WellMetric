const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function main() {
  const client = new Client('postgres://wellanalytics:changeme@localhost:5432/wellanalytics_db');
  await client.connect();

  const email = 'onur@3bitz.com';
  const pass = '40241000';
  const hash = await bcrypt.hash(pass, 10);

  // 1. Delete existing
  await client.query("DELETE FROM users WHERE email = $1", [email]);
  console.log(`User ${email} deleted.`);

  // 2. Insert new
  const query = `
    INSERT INTO users (id, email, password_hash, full_name, role, is_active, language, created_at)
    VALUES (gen_random_uuid(), $1, $2, $3, $4, true, 'tr', NOW())
  `;
  await client.query(query, [email, hash, 'Onur Ekşi', 'consultant']);
  console.log(`User ${email} recreated with password ${pass}.`);

  await client.end();
}

main();

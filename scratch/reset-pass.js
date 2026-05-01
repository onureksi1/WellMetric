const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function main() {
  const client = new Client('postgres://wellanalytics:changeme@localhost:5432/wellanalytics_db');
  await client.connect();

  const pass = 'Test123!';
  const hash = await bcrypt.hash(pass, 10);

  // Update onur@3bitz.com
  await client.query("UPDATE users SET password_hash = $1 WHERE email = 'onur@3bitz.com'", [hash]);
  console.log('Password updated for onur@3bitz.com');

  await client.end();
}

main();

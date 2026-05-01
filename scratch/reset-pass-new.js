const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function main() {
  const client = new Client('postgres://wellanalytics:changeme@localhost:5432/wellanalytics_db');
  await client.connect();

  const pass = '40241000';
  const hash = await bcrypt.hash(pass, 10);

  await client.query("UPDATE users SET password_hash = $1 WHERE email = 'onur@3bitz.com'", [hash]);
  console.log('Password updated for onur@3bitz.com to 40241000');

  await client.end();
}

main();

const bcrypt = require('bcryptjs');

async function run() {
  const hash = await bcrypt.hash('Admin123!', 12);
  console.log(hash);
}

run();

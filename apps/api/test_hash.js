const bcrypt = require('bcryptjs');

async function test() {
  const hash = '$2a$12$sW9slgGSU2hdr7jsAeeguOi8p.iFH0bFjpWv2RAIrpLO08d45VJrW';
  const result = await bcrypt.compare('Admin123!', hash);
  console.log('Match:', result);
}

test();

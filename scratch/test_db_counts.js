const { DataSource } = require('typeorm');

async function test() {
  const ds = new DataSource({
    type: 'postgres',
    url: 'postgres://wellanalytics:changeme@localhost:5432/wellanalytics_db',
  });

  await ds.initialize();
  
  const employees = await ds.query('SELECT COUNT(*) FROM employees WHERE is_active = true');
  console.log('Active employees:', employees[0].count);
  
  const users = await ds.query("SELECT COUNT(*) FROM users WHERE role = 'employee' AND is_active = true");
  console.log('Active users (role=employee):', users[0].count);
  
  await ds.destroy();
}

test();

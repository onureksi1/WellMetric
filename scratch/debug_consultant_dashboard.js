const { DataSource } = require('typeorm');

async function debug() {
  const ds = new DataSource({
    type: 'postgres',
    url: 'postgres://wellanalytics:changeme@localhost:5432/wellanalytics_db',
  });

  await ds.initialize();
  
  const consultantId = 'caed7502-8393-4421-9e3e-78cf340b52bd';
  
  const companies = await ds.query('SELECT id, name FROM companies WHERE consultant_id = $1 AND is_active = true', [consultantId]);
  console.log('Companies found:', companies);
  
  const companyIds = companies.map(c => c.id);
  
  if (companyIds.length > 0) {
    const employeeCount = await ds.query(
      'SELECT COUNT(*)::int as count FROM employees WHERE company_id = ANY($1) AND is_active = true',
      [companyIds]
    );
    console.log('Employee count result:', employeeCount);
  } else {
    console.log('No companies found for this consultant');
  }
  
  await ds.destroy();
}

debug();

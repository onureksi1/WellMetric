const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createTestAccount() {
  const client = new Client({
    connectionString: 'postgres://wellanalytics:changeme@localhost:5432/wellanalytics_db'
  });

  try {
    await client.connect();

    const companyId = uuidv4();
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash('HrAdmin123!', 10);

    // 1. Create Company
    await client.query(`
      INSERT INTO companies (id, name, slug, plan, contact_email, is_active, settings)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      companyId, 
      'Test Corp', 
      'test-corp', 
      'growth', 
      'contact@testcorp.com', 
      true, 
      JSON.stringify({
        default_language: 'tr',
        benchmark_visible: true,
        employee_accounts: true,
        anonymity_threshold: 5
      })
    ]);

    // 2. Create HR Admin User
    await client.query(`
      INSERT INTO users (id, company_id, email, password_hash, full_name, role, is_active, language)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      userId,
      companyId,
      'hr@testcorp.com',
      hashedPassword,
      'Test HR Yöneticisi',
      'hr_admin',
      true,
      'tr'
    ]);

    console.log('Test Company and HR Admin created successfully!');
    console.log('Company ID:', companyId);
    console.log('User ID:', userId);
    console.log('Email: hr@testcorp.com');
    console.log('Password: HrAdmin123!');

  } catch (err) {
    console.error('Error creating test account:', err);
  } finally {
    await client.end();
  }
}

createTestAccount();

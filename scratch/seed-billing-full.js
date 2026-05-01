const { Client } = require('pg');

async function main() {
  const client = new Client('postgres://wellanalytics:changeme@localhost:5432/wellanalytics_db');
  await client.connect();

  const userId = '79c0d7dc-b452-4460-beaf-d9ff7564eec9';

  // 0. Seed Credit Types
  console.log('Seeding credit types...');
  await client.query(`
    INSERT INTO credit_types (key, label_tr, label_en, icon, color, sort_order)
    VALUES 
      ('ai_credit', 'AI Analiz Kredisi', 'AI Analysis Credit', 'Brain', '#6C3A8E', 1),
      ('mail_credit', 'Mail Kredisi', 'Mail Credit', 'Mail', '#1A5C3A', 2)
    ON CONFLICT (key) DO NOTHING
  `);

  // 1. Add Credit Packages
  console.log('Adding credit packages...');
  await client.query(`
    INSERT INTO product_packages (key, type, label_tr, label_en, price_monthly, currency, credits, sort_order)
    VALUES 
      ('credit_small', 'credit', '1.000 AI Kredisi', '1,000 AI Credits', 99, 'TRY', '{"ai_credit": 1000}', 10),
      ('credit_medium', 'credit', '5.000 AI Kredisi', '5,000 AI Credits', 399, 'TRY', '{"ai_credit": 5000}', 11),
      ('credit_large', 'credit', '10.000 AI Kredisi', '10,000 AI Credits', 699, 'TRY', '{"ai_credit": 10000}', 12)
    ON CONFLICT (key) DO NOTHING
  `);

  // 2. Create Active Subscription
  console.log('Creating active subscription...');
  await client.query(`
    INSERT INTO subscriptions (id, consultant_id, package_key, status, interval, current_period_start, current_period_end)
    VALUES (gen_random_uuid(), $1, 'growth_monthly', 'active', 'monthly', NOW(), NOW() + interval '1 month')
  `, [userId]);

  // 3. Set Credit Balances
  console.log('Setting credit balances...');
  await client.query(`
    INSERT INTO credit_balances (consultant_id, credit_type_key, balance, used_this_month, last_reset_at)
    VALUES 
      ($1, 'ai_credit', 4250, 750, NOW()),
      ($1, 'mail_credit', 21400, 3600, NOW())
    ON CONFLICT (consultant_id, credit_type_key) DO UPDATE 
    SET balance = EXCLUDED.balance, used_this_month = EXCLUDED.used_this_month
  `, [userId]);

  // 4. Generate Usage History (Last 30 days)
  console.log('Generating usage history...');
  for (let i = 0; i < 20; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const amount = -(Math.floor(Math.random() * 50) + 10);
    await client.query(`
      INSERT INTO credit_transactions (id, consultant_id, credit_type_key, amount, type, description, created_at)
      VALUES (gen_random_uuid(), $1, 'ai_credit', $2, 'usage', 'AI Analiz Sorgusu', NOW() - interval '${daysAgo} days')
    `, [userId, amount]);
  }

  // 5. Create an Invoice
  console.log('Creating an invoice...');
  await client.query(`
    INSERT INTO payments (id, consultant_id, amount, currency, status, provider, invoice_url, created_at)
    VALUES (gen_random_uuid(), $1, 799, 'TRY', 'completed', 'stripe', 'https://example.com/invoice.pdf', NOW() - interval '1 day')
  `, [userId]);

  console.log('Seed completed successfully for user', userId);
  await client.end();
}

main();

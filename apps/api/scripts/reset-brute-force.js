#!/usr/bin/env node

// Kullanım:
// node scripts/reset-brute-force.js              → tümünü sil
// node scripts/reset-brute-force.js email onur@sirket.com
// node scripts/reset-brute-force.js ip 192.168.1.1

const Redis = require('ioredis');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
});

async function run() {
  const [,, type, value] = process.argv;

  let pattern;

  if (!type || type === 'all') {
    pattern = 'bf:*';
    console.log('Tüm brute-force kayıtları siliniyor...');
  } else if (type === 'email') {
    if (!value) { console.error('Email gerekli'); process.exit(1); }
    pattern = `bf:*:*:${value}`;
    console.log(`${value} için kayıtlar siliniyor...`);
  } else if (type === 'ip') {
    if (!value) { console.error('IP gerekli'); process.exit(1); }
    pattern = `bf:*:${value}:*`;
    console.log(`${value} IP için kayıtlar siliniyor...`);
  } else {
    console.error('Kullanım: node reset-brute-force.js [all|email|ip] [değer]');
    process.exit(1);
  }

  const keys = await redis.keys(pattern);

  if (keys.length === 0) {
    console.log('Silinecek kayıt bulunamadı.');
    await redis.quit();
    return;
  }

  await redis.del(...keys);
  console.log(`✓ ${keys.length} kayıt silindi:`);
  keys.forEach(k => console.log('  -', k));

  await redis.quit();
}

run().catch(err => {
  console.error('Hata:', err.message);
  process.exit(1);
});

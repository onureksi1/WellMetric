const crypto = require('crypto');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

console.log('--- WellAnalytics Production Secrets Generator ---');
console.log('Copy these to your production .env file:\n');
console.log(`ENCRYPTION_KEY=${crypto.randomBytes(16).toString('hex')} # 32 character hex key`);
console.log(`JWT_SECRET=${generateSecret(48)}`);
console.log(`JWT_REFRESH_SECRET=${generateSecret(48)}`);
console.log('\n---------------------------------------------------');

const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = 'default-32-character-dummy-key-abc!'; // .env'den aldım
const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32), 'utf-8');

function decrypt(text) {
  if (!text || !text.includes(':')) return text;
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    return text;
  }
}

const encrypted = process.argv[2] || "88b8d6f3bf99193f5d404521107802e8:3a1a0a5b64d269fd063842c65310f0a7cde23f029346698c07fa801f17b8ad996344b3d6b5db82d5484482e06589e081";
console.log(decrypt(encrypted));

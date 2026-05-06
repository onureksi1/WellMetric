
const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY_RAW = 'default-32-character-dummy-key-abc!';
const encryptionKey = Buffer.from(ENCRYPTION_KEY_RAW.padEnd(32, '0').slice(0, 32), 'utf-8');

function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
        let decrypted = decipher.update(encryptedText, undefined, 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (e) {
        return 'DECRYPTION_FAILED: ' + e.message;
    }
}

// THE NEW DB VALUE
const dbValue = 'b0463a5f99dfdbbdcd7f69c24be47971:d25aeefd853dafe18703b9e27b21861b0c259ec284c70ee6cf6ccb5564d408d005bb35694e446ef363d2525e31ff66ea49f1f618c77c11f3933b5cb4ce537a1e8d72de6c207bfd9cb97e091715b9f88dbb2c1d4c6485710bdb3a93af9b58d43f8cf5052dbe694653a74a9db9a06f1300';

const decrypted = decrypt(dbValue);
console.log('Decrypted result:', decrypted);

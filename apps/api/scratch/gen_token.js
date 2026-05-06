const jwt = require('jsonwebtoken');

const payload = {
  sub: '40245aa3-35ab-45b1-a8c1-bf119e9c032c',
  company_id: null,
  role: 'super_admin',
  consultant_id: null
};

// Explicitly using the exact string from .env
const secret = 'wellanalytics_ultra_secret_key_2026_!'; 
const token = jwt.sign(payload, secret, { expiresIn: '1h' });

console.log(token);

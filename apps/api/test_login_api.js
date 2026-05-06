const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('http://localhost:3001/api/v1/auth/login', {
      email: 'admin@wellanalytics.com',
      password: 'Admin123!'
    });
    console.log('Login Success:', res.data.user.role);
  } catch (err) {
    console.error('Login Failed:', err.response?.status, err.response?.data);
  }
}

testLogin();

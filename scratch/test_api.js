const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://localhost:3001/api/v1/admin/companies', {
      headers: {
        // I'll skip auth for now just to see if it even reaches the service
        // or I'll try to find a way to mock the auth
      }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error(err.response?.data || err.message);
  }
}

test();

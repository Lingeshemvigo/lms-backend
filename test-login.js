const axios = require('axios');

const testLogin = async () => {
  const loginData = {
    email: 'test@example.com',
    password: 'password123'
  };

  console.log('Attempting to login with data:', JSON.stringify(loginData, null, 2));
  
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\nLogin successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Test authenticated endpoint
    if (response.data.token) {
      console.log('\nTesting authenticated endpoint /api/auth/me...');
      const meResponse = await axios.get('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${response.data.token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('User profile:', JSON.stringify(meResponse.data, null, 2));
    }
  } catch (error) {
    console.error('\nLogin failed!');
    
    if (error.response) {
      console.error('Server responded with error:');
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Request details:', error.request);
    } else {
      console.error('Error setting up the request:', error.message);
    }
  }
};

// Run the test
console.log('Starting login test...\n');
testLogin(); 
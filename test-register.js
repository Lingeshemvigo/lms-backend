const axios = require('axios');

const testRegistration = async () => {
  const userData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123'
  };

  console.log('Attempting to register user with data:', JSON.stringify(userData, null, 2));
  
  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', userData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('\nRegistration successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('\nRegistration failed!');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Server responded with error:');
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
      console.error('Request details:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up the request:', error.message);
    }
    
    if (error.config) {
      console.error('\nRequest configuration that caused the error:');
      console.error('URL:', error.config.url);
      console.error('Method:', error.config.method);
      console.error('Headers:', JSON.stringify(error.config.headers, null, 2));
      console.error('Data:', JSON.stringify(error.config.data, null, 2));
    }
  }
};

// Run the test
console.log('Starting registration test...\n');
testRegistration(); 
const axios = require('axios');

const testCategories = async () => {
  try {
    console.log('Testing categories API...');
    
    const response = await axios.get('http://localhost:5000/api/categories');
    console.log('\nCategories API Response:', JSON.stringify(response.data, null, 2));
    
    if (!response.data.success) {
      console.error('API indicated failure:', response.data.message);
      return;
    }
    
    const categories = response.data.data;
    if (!Array.isArray(categories)) {
      console.error('Categories is not an array:', typeof categories);
      return;
    }
    
    console.log(`\nFound ${categories.length} categories:`);
    categories.forEach(category => {
      console.log(`- ${category.name} (${category._id})`);
    });
    
  } catch (error) {
    console.error('\nError testing categories API:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
};

// Run the test
testCategories(); 
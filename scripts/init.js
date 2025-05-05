const mongoose = require('mongoose');
const initCategories = require('./initCategories');
const initLevels = require('./initLevels');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';

const init = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Initialize data
    await initCategories();
    await initLevels();

    console.log('Initialization completed successfully');
  } catch (error) {
    console.error('Initialization failed:', error);
    process.exit(1);
  } finally {
    // Always disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
  process.exit(1);
});

init(); 
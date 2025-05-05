require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Level = require('../models/Level');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';

const initLevels = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete existing levels
    await Level.deleteMany({});
    console.log('Cleared existing levels');

    // Create new levels
    const levels = [
      {
        name: 'Beginner',
        description: 'Suitable for those who are just starting out',
        order: 1,
        isActive: true
      },
      {
        name: 'Intermediate',
        description: 'For learners with some prior experience',
        order: 2,
        isActive: true
      },
      {
        name: 'Advanced',
        description: 'For experienced learners seeking to master the subject',
        order: 3,
        isActive: true
      }
    ];

    const createdLevels = await Level.insertMany(levels);
    console.log('Created levels:', createdLevels);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('Error initializing levels:', error);
    process.exit(1);
  }
};

initLevels(); 
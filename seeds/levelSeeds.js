const mongoose = require('mongoose');
const Level = require('../models/Level');

const levels = [
  {
    name: 'Beginner',
    description: 'Perfect for those who are just starting out',
    order: 1,
    status: 'active'
  },
  {
    name: 'Intermediate',
    description: 'For learners with some prior experience',
    order: 2,
    status: 'active'
  },
  {
    name: 'Advanced',
    description: 'For experienced learners looking to master the subject',
    order: 3,
    status: 'active'
  }
];

const seedLevels = async () => {
  try {
    // Clear existing levels
    await Level.deleteMany({});
    
    // Insert new levels
    await Level.insertMany(levels);
    
    console.log('Levels seeded successfully');
  } catch (error) {
    console.error('Error seeding levels:', error);
  }
};

module.exports = seedLevels; 
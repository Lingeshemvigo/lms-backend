const mongoose = require('mongoose');
const CourseLevel = require('../models/CourseLevel');

const levels = [
  {
    name: 'Beginner',
    slug: 'beginner',
    description: 'Suitable for those new to the subject',
    order: 1
  },
  {
    name: 'Intermediate',
    slug: 'intermediate',
    description: 'For learners with basic knowledge',
    order: 2
  },
  {
    name: 'Advanced',
    slug: 'advanced',
    description: 'For experienced practitioners',
    order: 3
  }
];

const initLevels = async () => {
  try {
    // First, clear existing levels to avoid duplicate key errors
    await CourseLevel.deleteMany({});
    
    // Then create all levels
    await Promise.all(
      levels.map(level => 
        CourseLevel.create(level)
      )
    );
    
    console.log('Course levels initialized successfully');
  } catch (error) {
    console.error('Error initializing course levels:', error);
  }
};

module.exports = initLevels; 
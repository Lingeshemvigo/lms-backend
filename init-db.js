const mongoose = require('mongoose');
const CourseLevel = require('./models/CourseLevel');
const Category = require('./models/Category');
require('dotenv').config();

const initialCourseLevels = [
  {
    name: 'Beginner',
    description: 'Suitable for complete beginners with no prior experience',
    order: 1
  },
  {
    name: 'Intermediate',
    description: 'For learners with basic understanding of the subject',
    order: 2
  },
  {
    name: 'Advanced',
    description: 'For experienced learners looking to master advanced concepts',
    order: 3
  }
];

const initialCategories = [
  {
    name: 'Programming',
    description: 'Software development and coding courses'
  },
  {
    name: 'Design',
    description: 'Graphic design and UI/UX courses'
  },
  {
    name: 'Business',
    description: 'Business and entrepreneurship courses'
  },
  {
    name: 'Marketing',
    description: 'Digital marketing and SEO courses'
  },
  {
    name: 'Data Science',
    description: 'Data analysis and machine learning courses'
  }
];

async function initDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully\n');

    // Initialize Course Levels
    const levelCount = await CourseLevel.countDocuments();
    if (levelCount === 0) {
      console.log('Initializing course levels...');
      await CourseLevel.insertMany(initialCourseLevels);
      console.log('Course levels initialized successfully');
    } else {
      console.log(`Found ${levelCount} existing course levels`);
    }

    // Initialize Categories
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log('\nInitializing categories...');
      await Category.insertMany(initialCategories);
      console.log('Categories initialized successfully');
    } else {
      console.log(`\nFound ${categoryCount} existing categories`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the initialization
initDatabase(); 
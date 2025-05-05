const mongoose = require('mongoose');
const Category = require('../models/Category');
const CourseLevel = require('../models/CourseLevel');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const defaultCategories = [
  {
    name: 'Web Development',
    description: 'Learn web development technologies and frameworks'
  },
  {
    name: 'Mobile Development',
    description: 'Build mobile applications for iOS and Android'
  },
  {
    name: 'Data Science',
    description: 'Learn data analysis, machine learning, and AI'
  },
  {
    name: 'Business',
    description: 'Business, entrepreneurship, and management courses'
  },
  {
    name: 'Design',
    description: 'Graphic design, UI/UX, and digital art'
  },
  {
    name: 'Marketing',
    description: 'Digital marketing, SEO, and social media'
  }
];

const defaultLevels = [
  {
    name: 'Beginner',
    description: 'No prior knowledge required',
    order: 1
  },
  {
    name: 'Intermediate',
    description: 'Basic knowledge required',
    order: 2
  },
  {
    name: 'Advanced',
    description: 'Comprehensive knowledge required',
    order: 3
  },
  {
    name: 'Expert',
    description: 'Advanced knowledge and experience required',
    order: 4
  }
];

async function initializeMetadata() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Initialize categories
    for (const category of defaultCategories) {
      await Category.findOneAndUpdate(
        { name: category.name },
        category,
        { upsert: true, new: true }
      );
    }
    console.log('Categories initialized successfully');

    // Initialize course levels
    for (const level of defaultLevels) {
      await CourseLevel.findOneAndUpdate(
        { name: level.name },
        level,
        { upsert: true, new: true }
      );
    }
    console.log('Course levels initialized successfully');

    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error initializing metadata:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeMetadata(); 
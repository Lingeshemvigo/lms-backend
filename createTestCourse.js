// Script to create a test course in MongoDB
const mongoose = require('mongoose');

// Hardcoded MongoDB URI - use the same one from our checkCourses script
const MONGODB_URI = 'mongodb://localhost:27017/lms';

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    createTestCourse();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Load the Models
const Course = require('./models/Course');
const Category = require('./models/Category');
const Level = require('./models/Level');
const User = require('./models/User');

// Function to create a test course
async function createTestCourse() {
  try {
    // First check if we have at least one category, level, and user
    const categoryCount = await Category.countDocuments();
    const levelCount = await Level.countDocuments();
    const userCount = await User.countDocuments();

    if (categoryCount === 0 || levelCount === 0 || userCount === 0) {
      console.log('Missing required data:');
      console.log(`- Categories: ${categoryCount}`);
      console.log(`- Levels: ${levelCount}`);
      console.log(`- Users: ${userCount}`);
      console.log('Cannot create a test course without these requirements');
      mongoose.connection.close();
      return;
    }

    // Get first category, level, and an admin user
    const category = await Category.findOne();
    const level = await Level.findOne();
    const admin = await User.findOne({ role: 'admin' });

    if (!category || !level || !admin) {
      console.log('Missing required references:');
      console.log(`- Category: ${category ? 'Found' : 'Missing'}`);
      console.log(`- Level: ${level ? 'Found' : 'Missing'}`);
      console.log(`- Admin user: ${admin ? 'Found' : 'Missing'}`);
      console.log('Cannot create a test course without these references');
      mongoose.connection.close();
      return;
    }

    // Create a new test course
    const testCourse = new Course({
      title: 'Test Course NEW',
      description: 'This is a test course created by the script',
      instructor: admin._id,
      thumbnail: 'https://via.placeholder.com/300x200?text=Test+Course',
      price: 49.99,
      category: category._id,
      level: level._id,
      language: 'English',
      duration: 120,
      status: 'published', // Set as published
      sections: [
        {
          title: 'Introduction',
          description: 'Getting started with the course',
          order: 1,
          lessons: [
            {
              title: 'Welcome to the course',
              description: 'Introduction to the course',
              content: 'This is the content of the first lesson',
              duration: 10,
              order: 1,
              type: 'video'
            }
          ]
        }
      ]
    });

    // Save the course
    await testCourse.save();
    console.log('Test course created successfully:');
    console.log(`- ID: ${testCourse._id}`);
    console.log(`- Title: ${testCourse.title}`);
    console.log(`- Status: ${testCourse.status}`);
  } catch (error) {
    console.error('Error creating test course:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
} 
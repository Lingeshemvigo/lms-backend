// Script to create a test course with proper level assignment
const mongoose = require('mongoose');

// Hardcoded MongoDB URI - use the same one from our previous scripts
const MONGODB_URI = 'mongodb://localhost:27017/lms';

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    createTestCourseWithLevel();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Load the Models
const Course = require('./models/Course');
const Category = require('./models/Category');
const CourseLevel = require('./models/CourseLevel');
const User = require('./models/User');

// Function to create a test course
async function createTestCourseWithLevel() {
  try {
    // First check if we have at least one category, level, and user
    const categoryCount = await Category.countDocuments();
    const levelCount = await CourseLevel.countDocuments();
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
    const level = await CourseLevel.findOne();
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

    console.log('Creating test course with:');
    console.log(`- Category: ${category.name} (${category._id})`);
    console.log(`- Level: ${level.name} (${level._id})`);
    console.log(`- Instructor: ${admin.name} (${admin._id})`);

    // Create a new test course
    const testCourse = new Course({
      title: 'Test Course with Level',
      description: 'This is a test course created to verify level assignment',
      instructor: admin._id,
      thumbnail: 'https://fastly.picsum.photos/id/29/4000/2670.jpg?hmac=rCbRAl24fzrOWy-2Ztp1iI8nJ3JNnUlXwzf8hHvOKxQ',
      price: 49.99,
      category: category._id,
      level: level._id,
      language: 'English',
      duration: 120,
      status: 'published',
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
    console.log(`- Level: ${level.name}`);

    // Verify the course with populated level
    const verifiedCourse = await Course.findById(testCourse._id)
      .populate('level', 'name')
      .populate('category', 'name')
      .populate('instructor', 'name');
    
    console.log('\nVerified course with populated fields:');
    console.log(`- Level: ${verifiedCourse.level ? verifiedCourse.level.name : 'Not populated!'}`);
    console.log(`- Category: ${verifiedCourse.category ? verifiedCourse.category.name : 'Not populated!'}`);
    console.log(`- Instructor: ${verifiedCourse.instructor ? verifiedCourse.instructor.name : 'Not populated!'}`);
  } catch (error) {
    console.error('Error creating test course:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
} 
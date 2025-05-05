// Script to check courses in MongoDB
const mongoose = require('mongoose');

// Hardcoded MongoDB URI - try default local development URI
const MONGODB_URI = 'mongodb://localhost:27017/lms';

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    checkCourses();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Load the Course model
const Course = require('./models/Course');

// Function to check courses
async function checkCourses() {
  try {
    // Find all courses regardless of status
    const courses = await Course.find()
      .select('_id title status instructor createdAt')
      .sort({ createdAt: -1 });

    console.log(`Total courses found in database: ${courses.length}`);
    
    if (courses.length > 0) {
      console.log('\nCourses by status:');
      const published = courses.filter(c => c.status === 'published').length;
      const draft = courses.filter(c => c.status === 'draft').length;
      const archived = courses.filter(c => c.status === 'archived').length;
      const noStatus = courses.filter(c => !c.status).length;
      
      console.log(`- Published: ${published}`);
      console.log(`- Draft: ${draft}`);
      console.log(`- Archived: ${archived}`);
      console.log(`- No Status: ${noStatus}`);
      
      console.log('\nList of all courses:');
      courses.forEach((course, index) => {
        console.log(`${index + 1}. ${course.title} (${course._id}) - Status: ${course.status || 'NONE'}`);
      });
    } else {
      console.log('No courses found in database!');
    }
  } catch (error) {
    console.error('Error checking courses:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
} 
// Script to test the admin endpoints
const mongoose = require('mongoose');
// Optional packages - don't fail if not available
let dotenv;
try {
  dotenv = require('dotenv');
  dotenv.config();
} catch (e) {
  console.log('dotenv not installed, continuing without it');
}

// Hardcoded MongoDB URI - try default local development URI
const MONGODB_URI = 'mongodb://localhost:27017/lms';

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    testAdminEndpoints();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Load the Course model
const Course = require('./models/Course');
const User = require('./models/User');

// Function to test admin endpoints
async function testAdminEndpoints() {
  try {
    console.log('\n=== TESTING ADMIN ENDPOINTS ===\n');
    
    // First check if there are courses in the database
    const totalCourses = await Course.countDocuments();
    console.log(`Total courses in database: ${totalCourses}`);
    
    if (totalCourses === 0) {
      console.log('No courses found in database! Please create some courses first.');
      mongoose.connection.close();
      return;
    }
    
    // Find admin user to get token
    console.log('\nLooking for an admin user...');
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('No admin user found! Please create an admin user first.');
      mongoose.connection.close();
      return;
    }
    
    console.log(`Found admin user: ${adminUser.name} (${adminUser.email})`);
    
    // Test direct database query
    console.log('\nTesting direct database query for courses:');
    const dbCourses = await Course.find();
    console.log(`Direct DB query found ${dbCourses.length} courses`);
    
    // Count by status
    const published = dbCourses.filter(c => c.status === 'published').length;
    const draft = dbCourses.filter(c => c.status === 'draft').length;
    const archived = dbCourses.filter(c => c.status === 'archived').length;
    console.log(`- Published: ${published}`);
    console.log(`- Draft: ${draft}`);
    console.log(`- Archived: ${archived}`);
    
    // Print out all courses
    console.log('\nCourse details:');
    dbCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title} (Status: ${course.status}, ID: ${course._id})`);
    });
    
    console.log('\nTest complete!');
  } catch (error) {
    console.error('Error testing admin endpoints:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
} 
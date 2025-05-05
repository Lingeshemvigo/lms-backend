// Script to diagnose course level population issues
const mongoose = require('mongoose');

// Hardcoded MongoDB URI
const MONGODB_URI = 'mongodb://localhost:27017/lms';

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    diagnoseCourseLevel();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Load the Models
const Course = require('./models/Course');
const CourseLevel = require('./models/CourseLevel');

// Function to diagnose course level issues
async function diagnoseCourseLevel() {
  try {
    // Check if CourseLevel model is defined and accessible
    console.log('Checking CourseLevel model...');
    console.log(`Model name: ${CourseLevel.modelName}`);
    
    // Verify collection name
    console.log(`Collection name: ${CourseLevel.collection.name}`);
    
    // Get all course levels
    const levels = await CourseLevel.find().sort({ order: 1 });
    console.log(`\nFound ${levels.length} course levels in the database:`);
    levels.forEach(level => {
      console.log(`- ${level.name} (${level._id})`);
    });
    
    // Get all courses
    const courses = await Course.find().lean();
    console.log(`\nFound ${courses.length} courses in total`);
    
    // Check if course schema matches expected structure
    const courseSchema = Course.schema;
    console.log('\nCourse schema level field:');
    console.log(courseSchema.paths.level);
    
    // Check if courses have level field
    console.log('\nLevel IDs in courses:');
    courses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title}`);
      console.log(`   Level: ${course.level ? course.level.toString() : 'null'}`);
    });
    
    // Test population
    console.log('\nTesting course level population...');
    const populatedCourses = await Course.find()
      .populate({
        path: 'level',
        model: 'CourseLevel',
        select: 'name description'
      })
      .lean();
    
    console.log('Populated course levels:');
    populatedCourses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title}`);
      if (course.level) {
        console.log(`   Level: ${JSON.stringify(course.level)}`);
      } else {
        console.log(`   Level: null`);
      }
    });

    // Try explicit population with model name
    console.log('\nTesting explicit population with CourseLevel model...');
    const firstCourse = await Course.findOne();
    if (firstCourse) {
      const explicitPopulation = await Course.findById(firstCourse._id)
        .populate({
          path: 'level',
          model: 'CourseLevel'
        });
      
      console.log('Result of explicit population:');
      console.log(explicitPopulation.level);
    }

  } catch (error) {
    console.error('Error diagnosing course level:', error);
  } finally {
    mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
} 
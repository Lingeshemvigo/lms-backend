// Script to update course levels to valid IDs
const mongoose = require('mongoose');

// MongoDB connection URI
const MONGODB_URI = 'mongodb://localhost:27017/lms';

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected');
    updateCourseLevels();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Load required models
const Course = require('./models/Course');
const CourseLevel = require('./models/CourseLevel');

// Update course levels to valid IDs
async function updateCourseLevels() {
  try {
    // Get available levels
    const levels = await CourseLevel.find();
    
    if (levels.length === 0) {
      console.log('No course levels found in the database!');
      mongoose.connection.close();
      return;
    }
    
    console.log('Available levels:');
    levels.forEach(level => {
      console.log(`- ${level.name} (${level._id})`);
    });
    
    // Get count of courses with null levels
    const nullLevelCourses = await Course.countDocuments({ level: null });
    console.log(`\nFound ${nullLevelCourses} courses with null level`);
    
    // Get count of courses with invalid levels
    const coursesWithAnyLevel = await Course.find();
    console.log(`Total courses: ${coursesWithAnyLevel.length}`);
    
    // Count courses by level id
    const levelCounts = {};
    levels.forEach(level => {
      levelCounts[level._id] = 0;
    });
    levelCounts['null'] = 0;
    levelCounts['invalid'] = 0;
    
    for (const course of coursesWithAnyLevel) {
      if (!course.level) {
        levelCounts['null']++;
      } else {
        const levelId = course.level.toString();
        const levelExists = levels.some(l => l._id.toString() === levelId);
        if (levelExists) {
          levelCounts[levelId] = (levelCounts[levelId] || 0) + 1;
        } else {
          levelCounts['invalid']++;
        }
      }
    }
    
    console.log('\nCourses by level:');
    for (const [levelId, count] of Object.entries(levelCounts)) {
      if (levelId === 'null') {
        console.log(`- Null level: ${count} courses`);
      } else if (levelId === 'invalid') {
        console.log(`- Invalid level ID: ${count} courses`);
      } else {
        const levelName = levels.find(l => l._id.toString() === levelId)?.name || 'Unknown';
        console.log(`- ${levelName} (${levelId}): ${count} courses`);
      }
    }
    
    // Update courses with null or invalid levels to the first available level (Beginner)
    console.log(`\nUpdating courses with null or invalid levels to "${levels[0].name}"...`);
    
    const updateResult = await Course.updateMany(
      { $or: [{ level: null }, { level: { $nin: levels.map(l => l._id) } }] },
      { $set: { level: levels[0]._id } }
    );
    
    console.log(`Updated ${updateResult.modifiedCount} courses to level "${levels[0].name}"`);
    
    // Verify the update
    const remainingNullLevels = await Course.countDocuments({ level: null });
    console.log(`\nRemaining courses with null level: ${remainingNullLevels}`);
    
  } catch (error) {
    console.error('Error updating course levels:', error);
  } finally {
    mongoose.connection.close();
    console.log('\nMongoDB connection closed');
  }
} 
const mongoose = require('mongoose');
const CourseLevel = require('./models/CourseLevel');
const Category = require('./models/Category');
require('dotenv').config();

async function checkDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB successfully\n');

    // Check Course Levels
    console.log('Checking Course Levels:');
    console.log('----------------------');
    const levels = await CourseLevel.find().sort({ order: 1 });
    if (levels.length === 0) {
      console.log('No course levels found in database');
    } else {
      console.log(`Found ${levels.length} course levels:`);
      levels.forEach(level => {
        console.log(`- ${level.name} (${level.slug}): ${level.description}`);
      });
    }

    console.log('\nChecking Categories:');
    console.log('-------------------');
    const categories = await Category.find().sort({ name: 1 });
    if (categories.length === 0) {
      console.log('No categories found in database');
    } else {
      console.log(`Found ${categories.length} categories:`);
      categories.forEach(category => {
        console.log(`- ${category.name} (${category.slug}): ${category.description}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the check
checkDatabase(); 
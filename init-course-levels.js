const mongoose = require('mongoose');
const CourseLevel = require('./models/CourseLevel');
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

async function initCourseLevels() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    const count = await CourseLevel.countDocuments();
    if (count === 0) {
      console.log('No course levels found. Creating initial levels...');
      await CourseLevel.insertMany(initialCourseLevels);
      console.log('Initial course levels created successfully');
    } else {
      console.log(`Found ${count} existing course levels`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

initCourseLevels(); 
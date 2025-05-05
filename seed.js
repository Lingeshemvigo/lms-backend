const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const seedLevels = require('./seeds/levelSeeds');

// Load environment variables
dotenv.config();

// Import models
const User = require('./models/User');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');
const Payment = require('./models/Payment');
const Category = require('./models/Category');
const Level = require('./models/Level');

// Sample data
const users = [
  { name: 'Test User', email: 'test@test.com', password: 'test123', role: 'user' },
  { name: 'John Doe', email: 'john@example.com', password: 'password123', role: 'user' },
  { name: 'Jane Smith', email: 'jane@example.com', password: 'password123', role: 'user' },
  { name: 'Professor Wilson', email: 'prof@example.com', password: 'password123', role: 'instructor' },
  { name: 'Admin User', email: 'admin@example.com', password: 'password123', role: 'admin' },
];

const courses = [
  { title: 'Intro to React', description: 'Learn React basics', category: 'Web Development', level: 'Beginner', language: 'English', price: 49.99, thumbnail: 'https://via.placeholder.com/150', featured: true },
  { title: 'Advanced JavaScript', description: 'Deep dive into JS', category: 'Programming', level: 'Advanced', language: 'English', price: 59.99, thumbnail: 'https://via.placeholder.com/150', featured: false },
];

// Seed levels
const seedLevels = async () => {
  try {
    await Level.deleteMany({});

    const levels = [
      {
        name: 'Beginner',
        description: 'Suitable for those who are just starting out',
        order: 1,
        isActive: true
      },
      {
        name: 'Intermediate',
        description: 'For learners with some prior experience',
        order: 2,
        isActive: true
      },
      {
        name: 'Advanced',
        description: 'For experienced learners seeking to master the subject',
        order: 3,
        isActive: true
      }
    ];

    const createdLevels = await Level.insertMany(levels);
    console.log('Levels seeded successfully:', createdLevels);
    return createdLevels;
  } catch (error) {
    console.error('Error seeding levels:', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lms', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB...');

    // Run seeds
    await seedLevels();

    // Clear collections
    await User.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    await Payment.deleteMany({});
    await Category.deleteMany({});
    await Level.deleteMany({});
    console.log('Existing data cleared');

    // Seed categories and levels
    const webDevCategory = await Category.create({ name: 'Web Development' });
    const programmingCategory = await Category.create({ name: 'Programming' });
    console.log('Categories created');
    const beginnerLevel = await Level.create({ name: 'Beginner', order: 1 });
    const advancedLevel = await Level.create({ name: 'Advanced', order: 2 });
    console.log('Levels created');

    // Create users
    const createdUsers = [];
    for (const u of users) {
      const newUser = new User({ ...u });
      await newUser.save();
      createdUsers.push(newUser);
    }
    console.log('Users created');

    // Find instructor
    const instructor = createdUsers.find(u => u.role === 'instructor');

    // Create courses
    const createdCourses = [];
    const categoryMap = { 'Web Development': webDevCategory._id, 'Programming': programmingCategory._id };
    const levelMap = { 'Beginner': beginnerLevel._id, 'Advanced': advancedLevel._id };
    for (const c of courses) {
      const newCourse = await Course.create({
        title: c.title,
        description: c.description,
        thumbnail: c.thumbnail,
        language: c.language,
        featured: c.featured,
        price: c.price,
        category: categoryMap[c.category],
        level: levelMap[c.level],
        instructor: instructor._id,
        status: 'published'
      });
      createdCourses.push(newCourse);
    }
    console.log('Courses created');

    // Enroll students and create payments
    const students = createdUsers.filter(u => u.role === 'user');
    for (const student of students) {
      for (const course of createdCourses) {
        await Enrollment.create({ student: student._id, course: course._id, progress: 0, status: 'active' });
        await Payment.create({
          student: student._id,
          course: course._id,
          amount: course.price,
          status: 'completed',
          paymentIntentId: `pi_${Math.random().toString(36).substr(2,9)}`,
          transactionId: `txn_${Math.random().toString(36).substr(2,9)}`
        });
      }
    }
    console.log('Enrollments and payments created');

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase(); 
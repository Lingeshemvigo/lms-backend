const mongoose = require('mongoose');
const Course = require('./models/Course');

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/lms', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected');

    // Create a few test courses if none exist
    const count = await Course.countDocuments();
    if (count === 0) {
      console.log('Creating test courses...');
      const courses = [
        {
          title: 'Introduction to JavaScript',
          description: 'Learn the basics of JavaScript programming',
          instructor: mongoose.Types.ObjectId(),
          thumbnail: 'https://via.placeholder.com/300x200?text=JavaScript',
          price: 49.99,
          category: mongoose.Types.ObjectId(),
          level: mongoose.Types.ObjectId(),
          language: 'English',
          status: 'published'
        },
        {
          title: 'Advanced React Development',
          description: 'Master React with advanced techniques',
          instructor: mongoose.Types.ObjectId(),
          thumbnail: 'https://via.placeholder.com/300x200?text=React',
          price: 79.99,
          category: mongoose.Types.ObjectId(),
          level: mongoose.Types.ObjectId(),
          language: 'English',
          status: 'published'
        },
        {
          title: 'Node.js for Beginners',
          description: 'Build server-side applications with Node.js',
          instructor: mongoose.Types.ObjectId(),
          thumbnail: 'https://via.placeholder.com/300x200?text=Node.js',
          price: 59.99,
          category: mongoose.Types.ObjectId(),
          level: mongoose.Types.ObjectId(),
          language: 'English',
          status: 'draft'
        }
      ];

      await Course.insertMany(courses);
      console.log('Test courses created successfully');
    } else {
      console.log(`${count} courses already exist`);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

connectDB(); 
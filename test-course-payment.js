/**
 * Test script for course payments
 * This script will fetch courses and test payment intent creation
 */

// Load required models
const mongoose = require('mongoose');
const Course = require('./models/Course');
require('dotenv').config();

// Get Stripe key from environment with fallback
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_51RCdjQPvc4BWJxoTN2LTBpTRdwNdP7IzMcT67cfQn1r3XXAjrsWints9osNM1uGtBWe56tWcIq5pX3BzEeXrMkrJ00TnjuIXHV';
const stripe = require('stripe')(STRIPE_KEY);

console.log('Stripe configured with key:', STRIPE_KEY.substring(0, 8) + '...');

// MongoDB connection string (from .env)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all published courses
    const courses = await Course.find({ status: 'published' })
      .select('_id title price')
      .limit(5);
    
    if (courses.length === 0) {
      console.log('No published courses found. Creating a test course...');
      
      // Find an instructor
      const User = require('./models/User');
      const instructor = await User.findOne({ role: 'instructor' });
      
      if (!instructor) {
        console.log('No instructor found. Please create an instructor user first.');
        return;
      }
      
      // Find or create a category
      const Category = require('./models/Category');
      let category = await Category.findOne();
      if (!category) {
        category = new Category({ name: 'Test Category' });
        await category.save();
      }
      
      // Find or create a level
      const Level = require('./models/Level');
      let level = await Level.findOne();
      if (!level) {
        level = new Level({ name: 'Beginner' });
        await level.save();
      }
      
      // Create a test course
      const testCourse = new Course({
        title: 'Test Payment Course',
        description: 'A test course for payment processing',
        instructor: instructor._id,
        thumbnail: 'https://via.placeholder.com/300',
        price: 19.99,
        category: category._id,
        level: level._id,
        language: 'English',
        status: 'published'
      });
      
      await testCourse.save();
      console.log('Created test course:', testCourse._id);
      courses.push(testCourse);
    }
    
    console.log('Available courses:');
    courses.forEach((course, index) => {
      console.log(`${index + 1}. ${course.title} - $${course.price} (ID: ${course._id})`);
    });
    
    // Test payment intent creation with the first course
    if (courses.length > 0) {
      const testCourse = courses[0];
      console.log(`\nTesting payment intent creation for "${testCourse.title}"`);
      
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(testCourse.price * 100), // Convert to cents
          currency: 'usd',
          payment_method_types: ['card'],
          metadata: {
            courseId: testCourse._id.toString(),
            courseTitle: testCourse.title
          }
        });
        
        console.log('Payment intent created successfully:');
        console.log('- Intent ID:', paymentIntent.id);
        console.log('- Client Secret:', paymentIntent.client_secret);
        console.log('\nUse the following course ID for testing:');
        console.log(testCourse._id.toString());
      } catch (error) {
        console.error('Error creating payment intent:', error.message);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

main().catch(console.error); 
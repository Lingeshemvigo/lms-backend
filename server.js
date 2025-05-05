const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Create Express app
const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware
app.use(express.json());

// Request logging middleware with more details
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', {
    authorization: req.headers.authorization ? 'Bearer token present' : 'No token',
    contentType: req.headers['content-type'],
    origin: req.headers.origin
  });
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Set default MongoDB URI if environment variable is not set
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';

// MongoDB connection with detailed logging
const connectDB = async () => {
  try {
    console.log('MongoDB URI:', MONGODB_URI);
    console.log('Attempting to connect to MongoDB...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    
    console.log('MongoDB Connected Successfully');
    console.log('Connection State:', mongoose.connection.readyState);
    console.log('Database Name:', mongoose.connection.name);
    
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/instructors', require('./routes/instructors'));
app.use('/api/users', require('./routes/users'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/course-levels', require('./routes/course-levels'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/students', require('./routes/students'));
app.use('/api/levels', require('./routes/levels'));
app.use('/api/dashboard', require('./routes/dashboard'));

// 404 handler
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

const PORT = process.env.PORT || 5000;

// Configure Stripe with proper key management
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_51RCdjQPvc4BWJxoTN2LTBpTRdwNdP7IzMcT67cfQn1r3XXAjrsWints9osNM1uGtBWe56tWcIq5pX3BzEeXrMkrJ00TnjuIXHV';
const stripe = require('stripe')(STRIPE_SECRET_KEY);

console.log('Stripe configured with key:', STRIPE_SECRET_KEY.substring(0, 8) + '...');

// Start server only after MongoDB connects
mongoose.connection.once('open', () => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('MongoDB Connection State:', mongoose.connection.readyState);
  });
}); 
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
console.log('JWT_SECRET configured:', JWT_SECRET ? 'Yes (masked)' : 'No');

// List of public routes that don't require authentication
const publicRoutes = [
  { path: '/api/courses', method: 'GET' },
  { path: /^\/api\/courses\/[^/]+$/, method: 'GET' }, // Matches /api/courses/:id
  { path: '/api/categories', method: 'GET' },
  { path: '/api/course-levels', method: 'GET' },
  { path: '/api/auth/login', method: 'POST' },
  { path: '/api/auth/register', method: 'POST' }
];

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  console.log(`Auth middleware for ${req.method} ${req.path}`);
  
  try {
    // Check if the route is public
    const isPublicRoute = publicRoutes.some(route => {
      if (route.path instanceof RegExp) {
        return route.path.test(req.path) && route.method === req.method;
      }
      return route.path === req.path && route.method === req.method;
    });

    if (isPublicRoute) {
      console.log('Public route, skipping auth check');
      return next();
    }

    const authHeader = req.header('Authorization');
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    try {
      console.log('Verifying token...');
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Token decoded successfully. User ID:', decoded.id);
      
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        console.log('User not found in database');
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      console.log('User authenticated:', user._id, user.email, 'Role:', user.role);
      req.user = user;
      next();
    } catch (error) {
      console.error('Token verification error:', error.name, error.message);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired'
        });
      }

      throw error;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Middleware to check if user is instructor or admin
const isInstructorOrAdmin = (req, res, next) => {
  try {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'instructor')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Instructor or admin privileges required.'
      });
    }
    next();
  } catch (error) {
    console.error('InstructorOrAdmin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export middleware functions
module.exports = { auth, isAdmin, isInstructorOrAdmin }; 
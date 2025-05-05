const User = require('../models/User');
const jwt = require('jsonwebtoken');

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d'; // Changed to 7 days for better session management

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    console.log('Registration request received:', { body: req.body });
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      console.log('Missing required fields:', { name, email, password });
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('User already exists:', email);
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    console.log('Creating new user');
    const user = await User.create({
      name,
      email,
      password
    });

    console.log('User created successfully:', { userId: user._id });
    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Create user response object without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      enrolledCourses: user.enrolledCourses,
      createdAt: user.createdAt
    };

    console.log('Registration successful:', { userId: user._id });
    res.status(201).json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    console.log('Login request received:', { email: req.body.email });
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing credentials:', { email: !!email, password: !!password });
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    console.log('Finding user by email');
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('Checking password for user:', user.email);
    const isMatch = await user.matchPassword(password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('Generating token for user:', user._id);
    const token = jwt.sign(
      { id: user._id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Create user response object without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      enrolledCourses: user.enrolledCourses,
      createdAt: user.createdAt
    };

    console.log('Login successful:', { userId: user._id });
    res.json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    console.log('Get me request received:', { userId: req.user.id });
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      console.log('User not found:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('User found:', { userId: user._id });
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get me error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Refresh JWT token
// @route   POST /api/auth/refresh-token
exports.refreshToken = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'No token provided'
    });
  }

  try {
    // Verify existing token (ignore expiration for refresh? here we allow expired too)
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // If expired or invalid
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Issue new token
    const newToken = jwt.sign(
      { id: user._id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token: newToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during token refresh'
    });
  }
}; 
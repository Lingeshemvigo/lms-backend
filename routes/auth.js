const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const authController = require('../controllers/authController');

// Register a new user
router.post('/register', authController.register);

// Login user
router.post('/login', authController.login);

// Refresh JWT token
router.post('/refresh-token', authController.refreshToken);

// Get current user
router.get('/me', auth, authController.getMe);

// Change password
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Find user
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Current password is incorrect' 
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ 
      success: true,
      message: 'Password updated successfully' 
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message 
    });
  }
});

module.exports = router; 
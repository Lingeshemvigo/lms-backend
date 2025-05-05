const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { auth } = require('../middleware/auth');

// Note: Instructor course routes are now handled in courses.js
// This file can be used for other instructor-specific routes

module.exports = router; 
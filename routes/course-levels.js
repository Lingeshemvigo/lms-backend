const express = require('express');
const router = express.Router();
const CourseLevel = require('../models/CourseLevel');
const { auth, isAdmin } = require('../middleware/auth');

// Get all course levels
router.get('/', async (req, res) => {
  console.log('GET /api/course-levels - Handler started');
  try {
    const levels = await CourseLevel.find({ active: true }).sort({ order: 1 });
    console.log(`Found ${levels.length} course levels`);
    res.json({
      success: true,
      data: levels
    });
  } catch (error) {
    console.error('Error fetching course levels:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course levels',
      error: error.message
    });
  }
});

// Get a single course level
router.get('/:id', async (req, res) => {
  try {
    const level = await CourseLevel.findById(req.params.id);
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Course level not found'
      });
    }
    res.json({
      success: true,
      data: level
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching course level',
      error: error.message
    });
  }
});

// Create a new course level (admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const level = new CourseLevel(req.body);
    await level.save();
    res.status(201).json({
      success: true,
      data: level
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating course level',
      error: error.message
    });
  }
});

// Update a course level (admin only)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const level = await CourseLevel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Course level not found'
      });
    }
    res.json({
      success: true,
      data: level
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating course level',
      error: error.message
    });
  }
});

// Delete a course level (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const level = await CourseLevel.findByIdAndDelete(req.params.id);
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Course level not found'
      });
    }
    res.json({
      success: true,
      data: level
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting course level',
      error: error.message
    });
  }
});

module.exports = router; 
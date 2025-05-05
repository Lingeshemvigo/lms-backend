const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const mongoose = require('mongoose');
const { auth, isAdmin } = require('../middleware/auth');

// Test route
router.get('/test', (req, res) => {
  console.log('GET /api/categories/test - Test route hit');
  res.json({ 
    success: true,
    message: 'Categories route is working',
    mongoState: mongoose.connection.readyState
  });
});

// Get all categories
router.get('/', async (req, res) => {
  console.log('GET /api/categories - Handler started');
  
  // Check MongoDB connection state first
  const connectionState = mongoose.connection.readyState;
  console.log('Current MongoDB connection state:', connectionState);
  
  if (connectionState !== 1) {
    console.error('MongoDB not connected. Connection state:', connectionState);
    return res.status(500).json({
      success: false,
      message: 'Database connection not ready'
    });
  }

  try {
    console.log('Attempting to fetch categories from database...');
    const categories = await Category.find().lean().sort({ name: 1 });
    console.log(`Found ${categories.length} categories`);
    
    if (!categories || categories.length === 0) {
      console.log('No categories found in database');
      return res.json({
        success: true,
        data: []
      });
    }
    
    console.log('Categories found:', JSON.stringify(categories, null, 2));
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error in GET /api/categories:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

// Get a single category
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
});

// Create a new category (admin only)
router.post('/', auth, isAdmin, async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
});

// Update a category (admin only)
router.put('/:id', auth, isAdmin, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
});

// Delete a category (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
});

module.exports = router; 
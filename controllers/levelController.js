const Level = require('../models/Level');

// @desc    Get all levels
// @route   GET /api/levels
exports.getAllLevels = async (req, res) => {
  try {
    const levels = await Level.find({ isActive: true }).sort({ order: 1 });
    res.json({
      success: true,
      data: levels
    });
  } catch (error) {
    console.error('Error fetching levels:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch levels',
      error: error.message
    });
  }
};

// @desc    Get single level
// @route   GET /api/levels/:id
exports.getLevel = async (req, res) => {
  try {
    const level = await Level.findById(req.params.id);
    
    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found'
      });
    }

    res.json({
      success: true,
      data: level
    });
  } catch (error) {
    console.error('Error fetching level:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch level',
      error: error.message
    });
  }
};

// @desc    Create new level
// @route   POST /api/levels
exports.createLevel = async (req, res) => {
  try {
    const level = await Level.create(req.body);
    res.status(201).json({
      success: true,
      data: level
    });
  } catch (error) {
    console.error('Error creating level:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create level',
      error: error.message
    });
  }
};

// @desc    Update level
// @route   PUT /api/levels/:id
exports.updateLevel = async (req, res) => {
  try {
    const level = await Level.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found'
      });
    }

    res.json({
      success: true,
      data: level
    });
  } catch (error) {
    console.error('Error updating level:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update level',
      error: error.message
    });
  }
};

// @desc    Delete level
// @route   DELETE /api/levels/:id
exports.deleteLevel = async (req, res) => {
  try {
    const level = await Level.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!level) {
      return res.status(404).json({
        success: false,
        message: 'Level not found'
      });
    }

    res.json({
      success: true,
      message: 'Level deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting level:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete level',
      error: error.message
    });
  }
}; 
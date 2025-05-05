const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const {
  getAllLevels,
  getLevel,
  createLevel,
  updateLevel,
  deleteLevel
} = require('../controllers/levelController');

// Public routes
router.get('/', getAllLevels);
router.get('/:id', getLevel);

// Protected routes (admin only)
router.post('/', auth, isAdmin, createLevel);
router.put('/:id', auth, isAdmin, updateLevel);
router.delete('/:id', auth, isAdmin, deleteLevel);

module.exports = router; 
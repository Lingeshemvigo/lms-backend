const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const studentController = require('../controllers/studentController');

// All routes require authentication and admin privileges
router.use(auth, isAdmin);

// Get all students
router.get('/', studentController.getAllStudents);

// Get single student
router.get('/:id', studentController.getStudent);

// Update student
router.put('/:id', studentController.updateStudent);

// Delete student
router.delete('/:id', studentController.deleteStudent);

module.exports = router; 
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// @desc    Get all students
// @route   GET /api/students
exports.getAllStudents = async (req, res) => {
  try {
    const { search } = req.query;
    let query = { role: 'user' };

    // Add search functionality
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(query)
      .select('name email status createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students',
      error: error.message
    });
  }
};

// @desc    Get student details
// @route   GET /api/students/:id
exports.getStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id)
      .select('name email status createdAt');

    if (!student || student.role !== 'user') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get student's enrollments
    const enrollments = await Enrollment.find({ student: student._id })
      .populate({
        path: 'course',
        select: 'title category level status',
        populate: [
          { path: 'category', select: 'name' },
          { path: 'level', select: 'name' }
        ]
      });

    res.json({
      success: true,
      data: {
        ...student.toObject(),
        enrollments: enrollments
      }
    });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student details',
      error: error.message
    });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
exports.updateStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student || student.role !== 'user') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Only allow updating certain fields
    const allowedUpdates = ['name', 'email', 'status'];
    const updates = Object.keys(req.body)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {});

    const updatedStudent = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('name email status createdAt');

    res.json({
      success: true,
      data: updatedStudent
    });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update student',
      error: error.message
    });
  }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
exports.deleteStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student || student.role !== 'user') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Delete all enrollments for this student
    await Enrollment.deleteMany({ student: student._id });
    
    // Delete the student
    await student.remove();

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete student',
      error: error.message
    });
  }
}; 
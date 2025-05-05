const express = require('express');
const router = express.Router();
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { auth, isAdmin, isInstructorOrAdmin } = require('../middleware/auth');
const Payment = require('../models/Payment');

// Get all enrollments (admin only)
router.get('/admin/all', auth, isAdmin, async (req, res) => {
  try {
    console.log('Admin fetching all enrollments');
    const enrollments = await Enrollment.find()
      .populate({
        path: 'course',
        select: 'title description thumbnail category level status price',
        populate: [
          { path: 'category', select: 'name' },
          { path: 'level', select: 'name' }
        ]
      })
      .populate('user', 'name email')
      .sort({ enrolledAt: -1 });

    res.json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    console.error('Error fetching all enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollments',
      error: error.message
    });
  }
});

// Get enrollments by course (admin only)
router.get('/course/:courseId', auth, isAdmin, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const enrollments = await Enrollment.find({ course: req.params.courseId })
      .populate('user', 'name email')
      .sort({ enrolledAt: -1 });

    res.json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    console.error('Error fetching course enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course enrollments',
      error: error.message
    });
  }
});

// Get enrollments by course for instructors
router.get('/instructor/course/:courseId', auth, isInstructorOrAdmin, async (req, res) => {
  try {
    console.log(`Instructor accessing enrollments for course: ${req.params.courseId}`);
    
    // Find the course
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Verify instructor owns this course (admin can access any course)
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      console.log('Access denied: Instructor does not own this course');
      console.log('Course instructor:', course.instructor.toString());
      console.log('Request user:', req.user._id.toString());
      
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access enrollments for this course'
      });
    }

    // Get enrollments for this course
    const enrollments = await Enrollment.find({ course: req.params.courseId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${enrollments.length} enrollments for course ${req.params.courseId}`);

    res.json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    console.error('Error fetching instructor course enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course enrollments',
      error: error.message
    });
  }
});

// Get current user's enrollments
router.get('/', auth, async (req, res) => {
  try {
    console.log('Getting enrollments for user:', req.user._id);
    
    // For admin, return all enrollments if requested
    if (req.user.role === 'admin' && req.query.all === 'true') {
      const allEnrollments = await Enrollment.find()
        .populate({
          path: 'course',
          select: 'title description thumbnail category level status price',
          populate: [
            { path: 'category', select: 'name' },
            { path: 'level', select: 'name' }
          ]
        })
        .populate('user', 'name email')
        .sort({ enrolledAt: -1 });

      return res.json({
        success: true,
        data: allEnrollments
      });
    }

    // For regular users, return their own enrollments
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate({
        path: 'course',
        select: 'title description thumbnail category level status price',
        populate: [
          { path: 'category', select: 'name' },
          { path: 'level', select: 'name' }
        ]
      })
      .sort({ enrolledAt: -1 });

    console.log('Found enrollments:', enrollments.length);
    
    res.json({
      success: true,
      data: enrollments
    });
  } catch (error) {
    console.error('Error fetching user enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollments',
      error: error.message
    });
  }
});

// Create a new enrollment
router.post('/', auth, async (req, res) => {
  try {
    console.log('Enrollment request for course:', req.body.courseId);
    const { courseId } = req.body;
    
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }
    
    console.log('Course ID:', courseId);
    // Check if course exists and is published
    const course = await Course.findOne({
      _id: courseId,
      status: 'published'
    });
    
    console.log('Found course:', course?.title);
    
    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found or not available for enrollment' 
      });
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId
    });
    
    if (existingEnrollment) {
      if (existingEnrollment.status === 'active' || existingEnrollment.status === 'completed') {
        return res.status(400).json({ 
          success: false,
          message: 'You are already enrolled in this course' 
        });
      } else {
        // Reactivate enrollment if it exists but is not active
        existingEnrollment.status = 'active';
        await existingEnrollment.save();
        return res.status(200).json({
          success: true,
          message: 'Enrollment reactivated',
          data: existingEnrollment
        });
      }
    }
    
    let payment;
    // Handle free and paid courses
    if (course.price > 0) {
      payment = await Payment.findOne({
        user: req.user._id,
        course: courseId,
        status: 'completed'
      });
      
      if (!payment) {
        return res.status(402).json({ 
          success: false,
          message: 'Payment required to enroll in this course',
          courseId: course._id,
          price: course.price
        });
      }
    } else {
      // Create a free payment record for free courses
      payment = new Payment({
        student: req.user._id,
        course: courseId,
        amount: 0,
        paymentMethod: 'free',
        transactionId: `FREE-${Date.now()}-${req.user._id}`,
        status: 'completed'
      });
      await payment.save();
    }
    
    // Create enrollment
    const enrollment = new Enrollment({
      user: req.user._id,
      course: courseId,
      payment: payment._id,
      enrolledAt: new Date(),
      status: 'active',
      progress: 0,
      completedLessons: []
    });
    
    console.log('Creating enrollment:', enrollment);
    
    await enrollment.save();
    
    // Update course enrolled students count
    course.enrollments = (course.enrollments || 0) + 1;
    await course.save();
    
    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in the course',
      data: enrollment
    });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create enrollment',
      error: error.message
    });
  }
});

// Update enrollment progress
router.put('/:id/progress', auth, async (req, res) => {
  try {
    const { progress, completedLessons } = req.body;
    
    const enrollment = await Enrollment.findById(req.params.id);
    
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }
    
    // Check if user is the student
    if (enrollment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this enrollment'
      });
    }
    
    // Update enrollment
    enrollment.progress = progress;
    enrollment.completedLessons = completedLessons;
    enrollment.lastAccessedAt = Date.now();
    
    // Check if course is completed
    if (progress === 100 && enrollment.status !== 'completed') {
      enrollment.status = 'completed';
      enrollment.completedAt = Date.now();
    }
    
    await enrollment.save();
    
    res.json({
      success: true,
      data: enrollment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Direct enrollment for free courses
router.post('/direct-enroll/:courseId', auth, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const course = await Course.findOne({ _id: courseId, status: 'published' });
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found or not available' });
    }
    
    const existingEnrollment = await Enrollment.findOne({ user: req.user._id, course: courseId });
    if (existingEnrollment) {
      return res.status(200).json({ success: true, data: existingEnrollment });
    }
    
    const enrollment = new Enrollment({
      user: req.user._id,
      course: courseId,
      enrolledAt: new Date(),
      status: 'active',
      progress: 0,
      completedLessons: []
    });
    
    await enrollment.save();
    course.enrolledStudents = (course.enrolledStudents || 0) + 1;
    await course.save();
    
    res.status(201).json({ success: true, data: enrollment });
  } catch (error) {
    console.error('Direct enrollment error:', error);
    res.status(500).json({ success: false, message: 'Failed to enroll', error: error.message });
  }
});

module.exports = router; 
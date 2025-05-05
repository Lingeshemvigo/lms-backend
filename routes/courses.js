const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const { auth, isAdmin, isInstructorOrAdmin } = require('../middleware/auth');
const Enrollment = require('../models/Enrollment');
const courseController = require('../controllers/courseController');
const courseContentController = require('../controllers/courseContentController');
const mongoose = require('mongoose');

// Direct test route for payment testing - GET a valid course ID
router.get('/test/payment-course', async (req, res) => {
  try {
    // Look for published courses first
    let course = await Course.findOne({ status: 'published' }).select('_id title price');
    
    // If no published course exists, create one
    if (!course) {
      // Try to publish a draft course
      const draftCourse = await Course.findOne({ status: 'draft' });
      
      if (draftCourse) {
        draftCourse.status = 'published';
        await draftCourse.save();
        course = draftCourse;
      } else {
        // Create a new test course
        const newCourse = new Course({
          title: 'Test Payment Course',
          description: 'This course was automatically created for payment testing',
          instructor: '651f9cad49df4c13b32ce0a9', // Default instructor ID
          thumbnail: 'https://via.placeholder.com/300x200?text=Test+Course',
          price: 9.99,
          category: '651f9cad49df4c13b32ce0a5', // Default category ID
          level: '651f9cad49df4c13b32ce0a6', // Default level ID
          language: 'English',
          duration: 60,
          status: 'published'
        });
        
        await newCourse.save();
        course = newCourse;
      }
    }
    
    res.json({
      success: true,
      message: 'Course available for payment testing',
      data: {
        courseId: course._id,
        title: course.title,
        price: course.price
      }
    });
  } catch (error) {
    console.error('Error fetching test course:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get course for payment testing',
      error: error.message
    });
  }
});

// Test route for getting published courses for payment testing
router.get('/test/published', async (req, res) => {
  try {
    const courses = await Course.find({ status: 'published' })
      .select('_id title price status')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: courses.length,
      message: 'Use these course IDs for payment testing',
      data: courses
    });
  } catch (error) {
    console.error('Error fetching published courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch published courses',
      error: error.message
    });
  }
});

// Test route to ensure there's at least one published course
router.get('/test/ensure-published', courseController.ensurePublishedCourse);

// Instructor routes
router.get('/instructor/:instructorId', auth, isInstructorOrAdmin, courseController.getCoursesByInstructor);

// Course CRUD routes
router.post('/', auth, isInstructorOrAdmin, courseController.createCourse);
router.put('/:id', auth, isInstructorOrAdmin, courseController.updateCourse);
router.delete('/:id', auth, isInstructorOrAdmin, courseController.deleteCourse);

// Admin routes
router.get('/admin-list', auth, isAdmin, courseController.getAllCourses);
router.get('/admin/all', auth, isAdmin, async (req, res) => {
  try {
    console.log('Admin fetching all courses via /admin/all');
    
    // Verify admin authorization first
    if (req.user.role !== 'admin') {
      console.log(`User ${req.user._id} tried to access admin route but has role: ${req.user.role}`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access admin resources'
      });
    }
    
    console.log('Admin user confirmed, fetching all courses...');
    
    // Fetch all courses with NO filters
    const courses = await Course.find() 
      .populate('instructor', 'name email')
      .populate('category', 'name')
      .populate('level', 'name')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${courses.length} courses in total`);
    
    // Process courses to ensure level data is properly populated
    const processedCourses = courses.map(course => {
      // Convert to plain object to allow modifications
      const courseObj = course.toObject();
      
      // If level is missing or null, add default level data
      if (!courseObj.level) {
        console.log(`Course ${courseObj.title} is missing level data, adding placeholder`);
        courseObj.level = { _id: 'none', name: 'Not Set' };
      }
      
      return courseObj;
    });
    
    // Log more details for debugging
    if (processedCourses.length > 0) {
      console.log('Courses by status:');
      const published = processedCourses.filter(c => c.status === 'published').length;
      const draft = processedCourses.filter(c => c.status === 'draft').length;
      const archived = processedCourses.filter(c => c.status === 'archived').length;
      const other = processedCourses.filter(c => !['published', 'draft', 'archived'].includes(c.status)).length;
      
      console.log(`- Published: ${published}`);
      console.log(`- Draft: ${draft}`);
      console.log(`- Archived: ${archived}`);
      console.log(`- Other/Unknown: ${other}`);
      
      // List all courses with their status and level
      console.log('All courses:');
      processedCourses.forEach((course, index) => {
        console.log(`${index + 1}. ${course.title} (${course._id}) - Status: ${course.status}, Level: ${course.level?.name || 'Not Set'}`);
      });
    }
    
    res.json({
      success: true,
      count: processedCourses.length,
      data: processedCourses
    });
  } catch (error) {
    console.error('Error fetching all courses for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: error.message
    });
  }
});
router.put('/:id/publish', auth, isAdmin, courseController.publishCourse);
router.put('/:id/unpublish', auth, isAdmin, courseController.unpublishCourse);

// Course content routes
router.get('/:courseId/content', auth, courseContentController.getCourseContent);
router.post('/:courseId/sections', auth, isInstructorOrAdmin, courseContentController.addSection);
router.put('/:courseId/sections/:sectionId', auth, isInstructorOrAdmin, courseContentController.updateSection);
router.delete('/:courseId/sections/:sectionId', auth, isInstructorOrAdmin, courseContentController.deleteSection);
router.post('/:courseId/sections/:sectionId/lessons', auth, isInstructorOrAdmin, courseContentController.addLesson);

// Student routes
router.get('/enrolled', auth, async (req, res) => {
  try {
    console.log('Getting enrolled courses for user:', req.user._id);
    const enrollments = await Enrollment.find({ 
      user: req.user._id,
      status: { $in: ['active', 'completed'] }
    })
      .populate({
        path: 'course',
        select: 'title description thumbnail category level status price sections',
        populate: [
          { path: 'category', select: 'name' },
          { path: 'level', select: 'name' },
          { path: 'instructor', select: 'name email' }
        ]
      })
      .sort({ enrolledAt: -1 });

    console.log('Found enrollments:', enrollments.length);

    // Map enrollments to courses and add enrollment data
    const courses = enrollments.map(enrollment => ({
      ...enrollment.course.toObject(),
      enrollment: {
        status: enrollment.status,
        progress: enrollment.progress,
        completedLessons: enrollment.completedLessons,
        enrolledAt: enrollment.enrolledAt
      }
    }));

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrolled courses',
      error: error.message
    });
  }
});

// Public routes:
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourse);
router.post('/:id/comments', auth, courseController.addComment);
router.get('/:id/comments', courseController.getComments);

// Update course content
router.put('/:courseId/content', auth, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { sections } = req.body;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is admin or the course instructor
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this course'
      });
    }

    // Validate sections structure
    if (!sections) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sections structure'
      });
    }

    // Update course content
    course.sections = sections;
    await course.save();

    res.json({
      success: true,
      message: 'Course sections updated successfully',
      data: course
    });
  } catch (error) {
    console.error('Error updating course content:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating course content',
      error: error.message
    });
  }
});

// Get course content
router.get('/:courseId/content', auth, async (req, res) => {
  try {
    const { courseId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid course ID'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: { sections: course.sections || [] }
    });
  } catch (error) {
    console.error('Error fetching course content:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching course content',
      error: error.message
    });
  }
});

module.exports = router;
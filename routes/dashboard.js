const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Payment = require('../models/Payment');
const { auth } = require('../middleware/auth');

// Get dashboard data
router.get('/', auth, async (req, res) => {
  try {
    console.log('Fetching dashboard data for user:', req.user._id, 'role:', req.user.role);
    
    if (req.user.role === 'admin') {
      // Admin dashboard
      const [
        totalCourses,
        publishedCourses,
        totalUsers,
        students,
        instructors,
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        payments,
        recentEnrollments
      ] = await Promise.all([
        Course.countDocuments(),
        Course.countDocuments({ status: 'published' }),
        User.countDocuments(),
        User.countDocuments({ role: 'user' }),
        User.countDocuments({ role: 'instructor' }),
        Enrollment.countDocuments(),
        Enrollment.countDocuments({ status: 'active' }),
        Enrollment.countDocuments({ status: 'completed' }),
        Payment.find({ status: 'completed' }),
        Enrollment.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('user', 'name email')
          .populate('course', 'title')
      ]);

      // Calculate total revenue from completed payments
      const totalRevenue = payments.reduce((total, payment) => total + (payment.amount || 0), 0);

      // Get course statistics
      const courseStats = await Course.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      return res.json({
        success: true,
        data: {
          courses: {
            total: totalCourses,
            published: publishedCourses,
            stats: courseStats
          },
          users: {
            total: totalUsers,
            students: students,
            instructors: instructors
          },
          enrollments: {
            total: totalEnrollments,
            active: activeEnrollments,
            completed: completedEnrollments,
            recent: recentEnrollments
          },
          revenue: {
            total: totalRevenue,
            currency: 'USD'
          }
        }
      });
    } else {
      // Student dashboard
      const [
        enrolledCourses,
        completedCourses,
        inProgressCourses,
        recentActivity
      ] = await Promise.all([
        Enrollment.countDocuments({ 
          user: req.user._id 
        }),
        Enrollment.countDocuments({ 
          user: req.user._id,
          status: 'completed'
        }),
        Enrollment.countDocuments({ 
          user: req.user._id,
          status: 'active'
        }),
        Enrollment.find({ 
          user: req.user._id 
        })
        .sort({ lastAccessedAt: -1 })
        .limit(5)
        .populate({
          path: 'course',
          select: 'title thumbnail',
          populate: [
            { path: 'instructor', select: 'name' }
          ]
        })
      ]);

      // Get course progress statistics
      const courseProgress = await Enrollment.find({
        user: req.user._id,
        status: 'active'
      })
      .select('course progress')
      .populate('course', 'title');

      return res.json({
        success: true,
        data: {
          courses: {
            enrolled: enrolledCourses,
            completed: completedCourses,
            inProgress: inProgressCourses,
            progress: courseProgress
          },
          recentActivity: recentActivity
        }
      });
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

module.exports = router; 
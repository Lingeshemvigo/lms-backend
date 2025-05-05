const express = require('express');
const router = express.Router();
// Define the Stripe key from environment with fallback
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_51RCdjQPvc4BWJxoTN2LTBpTRdwNdP7IzMcT67cfQn1r3XXAjrsWints9osNM1uGtBWe56tWcIq5pX3BzEeXrMkrJ00TnjuIXHV';
// Initialize stripe once
const stripe = require('stripe')(STRIPE_KEY);
const { auth, isAdmin } = require('../middleware/auth');
const Course = require('../models/Course');
const Payment = require('../models/Payment');
const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const { processPayment, getPaymentHistory, getPaymentById, processDirectEnrollment } = require('../controllers/paymentController');

// Get all payments (admin only)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('student', 'name email')
      .populate('course', 'title thumbnail price')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
});

// Get student payments
router.get('/student', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.user._id })
      .populate('course', 'title thumbnail price')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching student payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
});

// Get payments for a specific course
router.get('/course/:courseId', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ course: req.params.courseId })
      .populate('student', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Validate payment intent creation request
const validatePaymentIntent = async (req, res, next) => {
  try {
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Course is not available for enrollment'
      });
    }

    const existingEnrollment = await Enrollment.findOne({
      user: req.user._id,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    req.course = course;
    next();
  } catch (error) {
    next(error);
  }
};

// Create a payment intent
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { courseId } = req.body;
    console.log('Payment intent request received for courseId:', courseId);
    console.log('User from auth:', req.user ? req.user._id : 'No user found');

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Skip enrollment check for testing purposes
    // This allows us to create multiple payment intents for the same course
    
    console.log('Creating payment intent for course:', course.title, 'ID:', course._id, 'Price:', course.price);
    console.log('User making payment:', req.user._id, req.user.email);

    // Check if Stripe is properly initialized
    if (!stripe) {
      console.error('Stripe is not properly initialized');
      return res.status(500).json({
        success: false,
        message: 'Payment service not properly configured',
        error: 'Missing Stripe configuration'
      });
    }

    let paymentIntent;
    let paymentRecord;

    try {
      // Create payment intent with additional parameters
      console.log('Attempting to create Stripe payment intent');
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(course.price * 100), // Convert to cents
        currency: 'usd',
        payment_method_types: ['card'],
        capture_method: 'automatic',
        confirm: false,
        setup_future_usage: 'off_session',
        metadata: {
          courseId: course._id.toString(),
          userId: req.user._id.toString(),
          courseTitle: course.title
        },
        description: `Course enrollment: ${course.title}`,
        receipt_email: req.user.email
      });

      console.log('Payment intent created successfully:', paymentIntent.id);

      try {
        // Create payment record with automatically generated transaction ID
        console.log('Creating payment record in database');
        
        paymentRecord = new Payment({
          student: req.user._id, 
          course: course._id,
          amount: course.price,
          paymentMethod: 'credit_card',
          paymentIntentId: paymentIntent.id,
          status: 'pending',
          metadata: {
            courseTitle: course.title,
            studentEmail: req.user.email
          }
        });

        // Save the payment record
        await paymentRecord.save();
        
        console.log('Payment record created successfully:', {
          id: paymentRecord._id,
          transactionId: paymentRecord.transactionId,
          paymentIntentId: paymentRecord.paymentIntentId
        });

        return res.json({
          success: true,
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
        });
      } catch (dbError) {
        console.error('Database error creating payment record. Error:', dbError.message);
        console.error('Stack trace:', dbError.stack);
        
        if (dbError.name === 'ValidationError') {
          console.error('Validation errors:', JSON.stringify(dbError.errors));
        }
        
        // Only cancel the payment intent if it was created successfully
        if (paymentIntent && paymentIntent.id) {
          try {
            await stripe.paymentIntents.cancel(paymentIntent.id);
            console.log('Payment intent canceled due to database error:', paymentIntent.id);
          } catch (cancelError) {
            console.error('Error canceling payment intent:', cancelError.message);
          }
        }
        
        return res.status(500).json({
          success: false,
          message: 'Failed to create payment record',
          error: dbError.message
        });
      }
    } catch (stripeError) {
      console.error('Stripe API error:', stripeError.message);
      console.error('Stripe error details:', stripeError);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment intent with Stripe',
        error: stripeError.message
      });
    }
  } catch (error) {
    console.error('Payment intent creation error:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
});

// Confirm payment and create enrollment
router.post('/confirm', auth, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment intent ID is required'
      });
    }

    // Find the pending payment
    const payment = await Payment.findOne({ paymentIntentId });
    if (!payment) {
      // Check if a completed payment with this intent ID already exists
      const completedPayment = await Payment.findOne({ 
        paymentIntentId,
        status: 'completed'
      });
      
      if (completedPayment) {
        // Payment was already processed, check if enrollment exists
        const enrollment = await Enrollment.findOne({
          user: req.user._id,
          course: completedPayment.course
        });
        
        if (enrollment) {
          return res.json({
            success: true,
            message: 'Payment was already processed and enrollment exists',
            data: { payment: completedPayment, enrollment }
          });
        } else {
          // Unusual case: payment was completed but enrollment is missing
          // Create the enrollment
          const newEnrollment = new Enrollment({
            user: req.user._id,
            course: completedPayment.course,
            payment: completedPayment._id,
            enrolledAt: new Date(),
            status: 'active',
            progress: 0
          });
          
          await newEnrollment.save();
          
          // Update course student count
          await Course.findByIdAndUpdate(
            completedPayment.course,
            { $inc: { enrolledStudents: 1 } }
          );
          
          return res.json({
            success: true,
            message: 'Created enrollment for already processed payment',
            data: { payment: completedPayment, enrollment: newEnrollment }
          });
        }
      }
      
      return res.status(404).json({
        success: false,
        message: 'Payment record not found'
      });
    }

    // Verify that the user is the owner of the payment
    if (payment.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to confirm this payment'
      });
    }

    if (payment.status === 'completed') {
      // Check if enrollment exists
      const enrollment = await Enrollment.findOne({
        user: req.user._id,
        course: payment.course
      });
      
      if (enrollment) {
        return res.json({
          success: true,
          message: 'Payment was already processed and enrollment exists',
          data: { payment, enrollment }
        });
      } else {
        // Create enrollment if it doesn't exist yet
        const newEnrollment = new Enrollment({
          user: req.user._id,
          course: payment.course,
          payment: payment._id,
          enrolledAt: new Date(),
          status: 'active',
          progress: 0
        });
        
        await newEnrollment.save();
        
        // Update course student count
        await Course.findByIdAndUpdate(
          payment.course,
          { $inc: { enrolledStudents: 1 } }
        );
        
        return res.json({
          success: true,
          message: 'Created enrollment for already processed payment',
          data: { payment, enrollment: newEnrollment }
        });
      }
    }

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (!paymentIntent || paymentIntent.status !== 'succeeded') {
      payment.status = 'failed';
      payment.errorMessage = 'Payment verification failed';
      await payment.save();
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: req.user._id,
      course: payment.course
    });

    if (existingEnrollment) {
      // If already enrolled, mark payment as completed
      payment.status = 'completed';
      payment.transactionId = paymentIntent.id;
      await payment.save();
      
      return res.json({
        success: true,
        message: 'Payment confirmed. You were already enrolled in this course',
        data: { payment, enrollment: existingEnrollment }
      });
    }

    // Update payment status
    payment.status = 'completed';
    payment.transactionId = paymentIntent.id;
    await payment.save();

    // Create enrollment - ensure we use the authenticated user's ID
    const enrollment = new Enrollment({
      user: req.user._id,
      course: payment.course,
      payment: payment._id,
      enrolledAt: new Date(),
      status: 'active',
      progress: 0
    });

    try {
      await enrollment.save();
    } catch (enrollmentError) {
      console.error('Error creating enrollment:', enrollmentError);
      
      // If it's a duplicate key error, the user might already be enrolled
      if (enrollmentError.code === 11000) {
        // Find the existing enrollment
        const existingEnrollment = await Enrollment.findOne({
          user: req.user._id,
          course: payment.course
        });
        
        if (existingEnrollment) {
          return res.json({
            success: true,
            message: 'Payment confirmed. You were already enrolled in this course',
            data: { payment, enrollment: existingEnrollment }
          });
        } else {
          return res.status(400).json({
            success: false,
            message: 'You are already enrolled in this course but enrollment record is missing',
            error: enrollmentError.message
          });
        }
      }
      
      // For other errors, re-throw to be caught by the outer try-catch
      throw enrollmentError;
    }

    // Update course enrolled students count
    await Course.findByIdAndUpdate(
      payment.course,
      { $inc: { enrolledStudents: 1 } }
    );

    res.json({
      success: true,
      message: 'Payment confirmed and enrollment created successfully',
      data: { payment, enrollment }
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment and create enrollment',
      error: error.message
    });
  }
});

// Process a new payment
router.post('/', auth, processPayment);

// Get payment history for authenticated user
router.get('/history', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.user._id })
      .populate('course', 'title thumbnail price')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
});

// Get payment statistics (admin only)
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const paymentsByMonth = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);
    
    res.json({
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      paymentsByMonth
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific payment details
router.get('/:id', auth, async (req, res, next) => {
  try {
    // Skip stats request - it's handled by a specific route
    if (req.params.id === 'stats') {
      return next();
    }
    
    const payment = await Payment.findById(req.params.id)
      .populate('course', 'title thumbnail price')
      .populate('student', 'name email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if user is authorized to view this payment
    if (payment.student._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message
    });
  }
});

// Direct enrollment without payment
router.post('/enroll', auth, async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user._id;

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ 
        success: false, 
        message: 'Course not found' 
      });
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({ 
        success: false, 
        message: 'You are already enrolled in this course' 
      });
    }

    // Create payment record
    const payment = new Payment({
      student: userId,
      course: courseId,
      amount: 0, // Free enrollment
      paymentMethod: 'free',
      transactionId: `FREE-${Date.now()}-${userId}`,
      status: 'completed'
    });

    await payment.save();

    // Create enrollment
    const enrollment = new Enrollment({
      user: userId,
      course: courseId,
      payment: payment._id,
      enrolledAt: new Date(),
      status: 'active',
      progress: 0
    });

    await enrollment.save();

    // Update course enrolled students count
    await Course.findByIdAndUpdate(
      courseId,
      { $inc: { enrolledStudents: 1 } }
    );

    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in the course',
      data: {
        enrollment,
        payment
      }
    });
  } catch (error) {
    console.error('Error processing enrollment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process enrollment',
      error: error.message
    });
  }
});

module.exports = router; 
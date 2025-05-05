const Payment = require('../models/Payment');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51RCdjQPvc4BWJxoTN2LTBpTRdwNdP7IzMcT67cfQn1r3XXAjrsWints9osNM1uGtBWe56tWcIq5pX3BzEeXrMkrJ00TnjuIXHV');

// Process a new payment
exports.processPayment = async (req, res) => {
  try {
    console.log('Processing payment request:', req.body);
    const { courseId, amount, paymentMethod } = req.body;
    let { transactionId } = req.body;
    const userId = req.user._id; // Ensure we use _id, not id which may be undefined

    // Validate course exists
    const course = await Course.findById(courseId);
    if (!course) {
      console.log(`Course not found: ${courseId}`);
      return res.status(404).json({ message: 'Course not found' });
    }
    
    console.log(`Course found: ${course.title}, price: ${course.price}`);
    
    // For payments without a transactionId, create a temporary one
    if (!transactionId) {
      console.log('No transaction ID provided, creating pending payment with temporary ID');
      
      // Generate a temporary ID that's unique
      transactionId = `temp_payment_${Date.now()}_${userId}_${courseId}`;
      console.log('Generated temporary transaction ID:', transactionId);
      
      // Create payment with temporary transaction ID
      const payment = new Payment({
        student: userId,
        course: courseId,
        amount,
        paymentMethod,
        transactionId: transactionId, // Assign temporary ID
        status: 'pending',
        date: new Date()
      });

      await payment.save();
      console.log('Pending payment created:', payment._id);

      res.status(201).json({
        message: 'Payment pending. Transaction ID required to complete.',
        payment
      });
    } else {
      console.log('Transaction ID provided, creating completed payment');
      // Complete payment with transaction ID
      const payment = new Payment({
        student: userId,
        course: courseId,
        amount,
        paymentMethod,
        transactionId,
        status: 'completed',
        date: new Date()
      });

      await payment.save();
      console.log('Completed payment created:', payment._id);

      // Create enrollment record
      const enrollment = new Enrollment({
        user: userId,
        course: courseId,
        payment: payment._id,
        enrolledAt: new Date(),
        status: 'active'
      });

      try {
        await enrollment.save();
        console.log('Enrollment created:', enrollment._id);

        res.status(201).json({
          message: 'Payment processed successfully',
          payment,
          enrollment
        });
      } catch (enrollmentError) {
        console.error('Error creating enrollment:', enrollmentError);
        
        // If it's a duplicate key error, the user might already be enrolled
        if (enrollmentError.code === 11000) {
          return res.status(400).json({
            success: false,
            message: 'You are already enrolled in this course',
            payment: payment
          });
        }
        
        // For other errors, throw to be caught by the outer try-catch
        throw enrollmentError;
      }
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Failed to create payment intent', error: error.message });
  }
};

// Get payment history for authenticated user
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const payments = await Payment.find({ user: userId })
      .populate('course', 'title price')
      .sort({ date: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Error fetching payment history', error: error.message });
  }
};

// Get specific payment details
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('course', 'title price')
      .populate('user', 'name email');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Check if the user is authorized to view this payment
    if (payment.user._id.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this payment' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Error fetching payment details:', error);
    res.status(500).json({ message: 'Error fetching payment details', error: error.message });
  }
}; 
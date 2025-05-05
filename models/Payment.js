const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'free'],
    default: 'credit_card'
  },
  transactionId: {
    type: String,
    default: function() {
      // Generate a unique ID using timestamp, random string and course/student if available
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 10);
      const courseId = this.course ? this.course.toString().substring(0, 5) : '';
      const studentId = this.student ? this.student.toString().substring(0, 5) : '';
      return `temp_${timestamp}_${random}_${courseId}_${studentId}`;
    }
  },
  paymentIntentId: {
    type: String
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  date: {
    type: Date,
    default: Date.now
  },
  refundReason: String,
  refundDate: Date,
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Add pre-save middleware to ensure transaction ID is never null
paymentSchema.pre('save', function(next) {
  // Generate transaction ID if it doesn't exist
  if (!this.transactionId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const courseId = this.course ? this.course.toString().substring(0, 5) : '';
    const studentId = this.student ? this.student.toString().substring(0, 5) : '';
    this.transactionId = `temp_${timestamp}_${random}_${courseId}_${studentId}`;
  }
  next();
});

// Index for faster queries
paymentSchema.index({ student: 1, course: 1 });

// Create a unique index on transactionId, but allow null values to exist
// This sparse: true option means documents without transactionId won't be indexed
paymentSchema.index(
  { transactionId: 1 }, 
  { 
    unique: true,
    sparse: true
  }
);

// Index for payment intent ID lookups
paymentSchema.index({ paymentIntentId: 1 }, { sparse: true });

module.exports = mongoose.model('Payment', paymentSchema); 
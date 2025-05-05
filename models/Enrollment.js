const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'completed', 'dropped', 'refunded'],
    default: 'active'
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completedLessons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson'
  }],
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
}, {
  timestamps: true
});

// Ensure a user can only enroll once in a course
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

// Index for faster queries
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ user: 1, status: 1 });

// Add a method to check if the enrollment is complete
enrollmentSchema.methods.isCompleted = function() {
  return this.status === 'completed' || this.progress === 100;
};

// Add a method to update progress
enrollmentSchema.methods.updateProgress = function(completedLessonsCount, totalLessonsCount) {
  this.progress = Math.round((completedLessonsCount / totalLessonsCount) * 100);
  if (this.progress === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completedAt = new Date();
  }
  return this.save();
};

// Middleware to update lastAccessedAt on every save
enrollmentSchema.pre('save', function(next) {
  this.lastAccessedAt = new Date();
  next();
});

module.exports = mongoose.model('Enrollment', enrollmentSchema); 
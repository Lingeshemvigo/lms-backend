const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 0
  },
  order: {
    type: Number,
    default: 0
  },
  type: {
    type: String,
    enum: ['video', 'document', 'quiz', 'assignment'],
    required: true
  }
});

const sectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  },
  lessons: [lessonSchema]
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  level: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseLevel',
    required: true
  },
  language: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 0
  },
  totalLessons: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0
  },
  enrollments: {
    type: Number,
    default: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  sections: {
    type: [sectionSchema],
    default: []
  },
  comments: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'hidden', 'deleted'],
      default: 'active'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Add text index for search
courseSchema.index({ title: 'text', description: 'text' });

// Pre-save middleware to update totalLessons
courseSchema.pre('save', function(next) {
  if (this.sections) {
    this.totalLessons = this.sections.reduce((total, section) => {
      return total + (section.lessons ? section.lessons.length : 0);
    }, 0);
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema); 
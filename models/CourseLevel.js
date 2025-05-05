const mongoose = require('mongoose');

const courseLevelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot be more than 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    index: true
  },
  order: {
    type: Number,
    default: 0,
    index: true
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Create slug from name before saving
courseLevelSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
  }
  next();
});

// Ensure indexes are created
courseLevelSchema.set('autoIndex', true);

const CourseLevel = mongoose.model('CourseLevel', courseLevelSchema);

module.exports = CourseLevel; 
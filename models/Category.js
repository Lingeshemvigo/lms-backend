const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create slug from name before saving
categorySchema.pre('save', function(next) {
  this.slug = this.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
  next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category; 
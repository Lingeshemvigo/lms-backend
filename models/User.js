const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'instructor', 'admin'],
    default: 'user'
  },
  profilePicture: {
    type: String,
    default: ''
  },
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  try {
    console.log('Pre-save hook triggered for user:', this.email);
    
    if (!this.isModified('password')) {
      console.log('Password not modified, skipping hashing');
      return next();
    }

    console.log('Generating salt for password hashing');
    const salt = await bcrypt.genSalt(10);
    console.log('Salt generated, hashing password');
    this.password = await bcrypt.hash(this.password, salt);
    console.log('Password hashed successfully');
    next();
  } catch (error) {
    console.error('Error in pre-save hook:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    next(error);
  }
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    console.log('Comparing passwords for user:', this.email);
    
    if (!enteredPassword) {
      console.log('No password provided for comparison');
      return false;
    }

    if (!this.password) {
      console.log('No hashed password found for user');
      return false;
    }

    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log('Password comparison result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('Error comparing passwords:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
};

module.exports = mongoose.model('User', UserSchema); 
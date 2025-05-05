const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
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
  permissions: [{
    type: String,
    required: true
  }],
  userCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Update userCount when users are added/removed
roleSchema.methods.updateUserCount = async function() {
  const User = mongoose.model('User');
  this.userCount = await User.countDocuments({ role: this.name });
  await this.save();
};

const Role = mongoose.model('Role', roleSchema);

module.exports = Role; 
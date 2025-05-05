const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  general: {
    siteName: {
      type: String,
      default: 'Learning Management System'
    },
    siteDescription: {
      type: String,
      default: 'A comprehensive learning management system'
    },
    contactEmail: {
      type: String,
      default: 'support@example.com'
    },
    supportPhone: {
      type: String,
      default: '+1234567890'
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    }
  },
  email: {
    smtpHost: {
      type: String,
      default: ''
    },
    smtpPort: {
      type: String,
      default: ''
    },
    smtpUser: {
      type: String,
      default: ''
    },
    smtpPassword: {
      type: String,
      default: ''
    },
    senderName: {
      type: String,
      default: 'LMS System'
    },
    senderEmail: {
      type: String,
      default: 'noreply@example.com'
    }
  },
  payment: {
    currency: {
      type: String,
      default: 'USD'
    },
    stripePublicKey: {
      type: String,
      default: ''
    },
    stripeSecretKey: {
      type: String,
      default: ''
    },
    paypalClientId: {
      type: String,
      default: ''
    },
    paypalSecret: {
      type: String,
      default: ''
    }
  },
  notification: {
    enableEmailNotifications: {
      type: Boolean,
      default: true
    },
    enablePushNotifications: {
      type: Boolean,
      default: false
    },
    notifyOnNewEnrollment: {
      type: Boolean,
      default: true
    },
    notifyOnNewReview: {
      type: Boolean,
      default: true
    },
    notifyOnPayment: {
      type: Boolean,
      default: true
    }
  },
  profile: {
    enablePublicProfile: {
      type: Boolean,
      default: true
    },
    showEmail: {
      type: Boolean,
      default: false
    },
    showPhone: {
      type: Boolean,
      default: false
    },
    showSocialLinks: {
      type: Boolean,
      default: true
    },
    defaultProfilePrivacy: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'public'
    },
    allowProfileComments: {
      type: Boolean,
      default: true
    },
    enableProfileCustomization: {
      type: Boolean,
      default: true
    }
  },
  security: {
    enableTwoFactor: {
      type: Boolean,
      default: false
    },
    passwordMinLength: {
      type: Number,
      default: 8
    },
    passwordRequireSpecial: {
      type: Boolean,
      default: true
    },
    sessionTimeout: {
      type: Number,
      default: 30
    },
    maxLoginAttempts: {
      type: Number,
      default: 5
    }
  },
  storage: {
    provider: {
      type: String,
      enum: ['local', 'aws', 'google', 'azure'],
      default: 'local'
    },
    awsAccessKey: {
      type: String,
      default: ''
    },
    awsSecretKey: {
      type: String,
      default: ''
    },
    awsBucket: {
      type: String,
      default: ''
    },
    awsRegion: {
      type: String,
      default: ''
    }
  },
  appearance: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'light'
    },
    primaryColor: {
      type: String,
      default: '#1976d2'
    },
    secondaryColor: {
      type: String,
      default: '#dc004e'
    },
    enableDarkMode: {
      type: Boolean,
      default: true
    },
    showLogo: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Setting', SettingSchema); 
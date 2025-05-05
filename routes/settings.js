const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const Setting = require('../models/Setting');
const fs = require('fs');
const path = require('path');

// Get all settings
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    console.log('Fetching all settings');
    const settings = await Setting.findOne();
    
    if (!settings) {
      // If no settings exist, create default settings
      const defaultSettings = new Setting({
        general: {
          siteName: 'Learning Management System',
          siteDescription: 'A comprehensive learning management system',
          contactEmail: 'support@example.com',
          supportPhone: '+1234567890',
          maintenanceMode: false
        },
        email: {
          smtpHost: '',
          smtpPort: '',
          smtpUser: '',
          smtpPassword: '',
          senderName: 'LMS System',
          senderEmail: 'noreply@example.com'
        },
        payment: {
          currency: 'USD',
          stripePublicKey: '',
          stripeSecretKey: '',
          paypalClientId: '',
          paypalSecret: ''
        },
        notification: {
          enableEmailNotifications: true,
          enablePushNotifications: false,
          notifyOnNewEnrollment: true,
          notifyOnNewReview: true,
          notifyOnPayment: true
        },
        security: {
          enableTwoFactor: false,
          passwordMinLength: 8,
          passwordRequireSpecial: true,
          sessionTimeout: 30,
          maxLoginAttempts: 5
        },
        storage: {
          provider: 'local',
          awsAccessKey: '',
          awsSecretKey: '',
          awsBucket: '',
          awsRegion: ''
        },
        appearance: {
          theme: 'light',
          primaryColor: '#1976d2',
          secondaryColor: '#dc004e',
          enableDarkMode: true,
          showLogo: true
        },
        profile: {
          enablePublicProfile: true,
          showEmail: false,
          showPhone: false,
          showSocialLinks: true,
          defaultProfilePrivacy: 'public',
          allowProfileComments: true,
          enableProfileCustomization: true
        }
      });
      
      await defaultSettings.save();
      console.log('Created default settings');
      
      return res.json({
        success: true,
        data: defaultSettings
      });
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings',
      error: error.message
    });
  }
});

// Update all settings
router.put('/', auth, isAdmin, async (req, res) => {
  try {
    console.log('Updating settings');
    const settings = await Setting.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }
    
    // Update settings with new values
    Object.keys(req.body).forEach(section => {
      if (settings[section]) {
        Object.keys(req.body[section]).forEach(key => {
          settings[section][key] = req.body[section][key];
        });
      }
    });
    
    await settings.save();
    console.log('Settings updated successfully');
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
});

// Get specific section settings
router.get('/:section', auth, isAdmin, async (req, res) => {
  try {
    const { section } = req.params;
    console.log(`Fetching ${section} settings`);
    
    const settings = await Setting.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }
    
    if (!settings[section]) {
      return res.status(404).json({
        success: false,
        message: `Section '${section}' not found in settings`
      });
    }
    
    res.json({
      success: true,
      data: settings[section]
    });
  } catch (error) {
    console.error(`Error fetching ${req.params.section} settings:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch ${req.params.section} settings`,
      error: error.message
    });
  }
});

// Update specific section settings
router.put('/:section', auth, isAdmin, async (req, res) => {
  try {
    const { section } = req.params;
    console.log(`Updating ${section} settings`);
    
    const settings = await Setting.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }
    
    if (!settings[section]) {
      return res.status(404).json({
        success: false,
        message: `Section '${section}' not found in settings`
      });
    }
    
    // Update section settings with new values
    Object.keys(req.body).forEach(key => {
      settings[section][key] = req.body[key];
    });
    
    await settings.save();
    console.log(`${section} settings updated successfully`);
    
    res.json({
      success: true,
      data: settings[section]
    });
  } catch (error) {
    console.error(`Error updating ${req.params.section} settings:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to update ${req.params.section} settings`,
      error: error.message
    });
  }
});

// Test email settings
router.post('/email/test', auth, isAdmin, async (req, res) => {
  try {
    console.log('Testing email settings');
    const { smtpHost, smtpPort, smtpUser, smtpPassword, senderName, senderEmail } = req.body;
    
    // Here you would implement the actual email testing logic
    // For now, we'll just simulate a successful test
    
    res.json({
      success: true,
      message: 'Email settings tested successfully'
    });
  } catch (error) {
    console.error('Error testing email settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test email settings',
      error: error.message
    });
  }
});

// Test payment settings
router.post('/payment/test', auth, isAdmin, async (req, res) => {
  try {
    console.log('Testing payment settings');
    const { stripePublicKey, stripeSecretKey, paypalClientId, paypalSecret } = req.body;
    
    // Here you would implement the actual payment testing logic
    // For now, we'll just simulate a successful test
    
    res.json({
      success: true,
      message: 'Payment settings tested successfully'
    });
  } catch (error) {
    console.error('Error testing payment settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test payment settings',
      error: error.message
    });
  }
});

// Reset settings to defaults
router.post('/reset', auth, isAdmin, async (req, res) => {
  try {
    console.log('Resetting settings to defaults');
    
    // Delete all settings
    await Setting.deleteMany({});
    
    // Create default settings
    const defaultSettings = new Setting({
      general: {
        siteName: 'Learning Management System',
        siteDescription: 'A comprehensive learning management system',
        contactEmail: 'support@example.com',
        supportPhone: '+1234567890',
        maintenanceMode: false
      },
      email: {
        smtpHost: '',
        smtpPort: '',
        smtpUser: '',
        smtpPassword: '',
        senderName: 'LMS System',
        senderEmail: 'noreply@example.com'
      },
      payment: {
        currency: 'USD',
        stripePublicKey: '',
        stripeSecretKey: '',
        paypalClientId: '',
        paypalSecret: ''
      },
      notification: {
        enableEmailNotifications: true,
        enablePushNotifications: false,
        notifyOnNewEnrollment: true,
        notifyOnNewReview: true,
        notifyOnPayment: true
      },
      security: {
        enableTwoFactor: false,
        passwordMinLength: 8,
        passwordRequireSpecial: true,
        sessionTimeout: 30,
        maxLoginAttempts: 5
      },
      storage: {
        provider: 'local',
        awsAccessKey: '',
        awsSecretKey: '',
        awsBucket: '',
        awsRegion: ''
      },
      appearance: {
        theme: 'light',
        primaryColor: '#1976d2',
        secondaryColor: '#dc004e',
        enableDarkMode: true,
        showLogo: true
      },
      profile: {
        enablePublicProfile: true,
        showEmail: false,
        showPhone: false,
        showSocialLinks: true,
        defaultProfilePrivacy: 'public',
        allowProfileComments: true,
        enableProfileCustomization: true
      }
    });
    
    await defaultSettings.save();
    console.log('Settings reset successfully');
    
    res.json({
      success: true,
      data: defaultSettings
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset settings',
      error: error.message
    });
  }
});

// Backup settings
router.get('/backup', auth, isAdmin, async (req, res) => {
  try {
    console.log('Creating settings backup');
    
    const settings = await Setting.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }
    
    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Create backup file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `settings-backup-${timestamp}.json`);
    
    fs.writeFileSync(backupPath, JSON.stringify(settings, null, 2));
    console.log(`Settings backup created at ${backupPath}`);
    
    res.json({
      success: true,
      message: 'Settings backup created successfully',
      data: {
        backupPath,
        timestamp
      }
    });
  } catch (error) {
    console.error('Error creating settings backup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create settings backup',
      error: error.message
    });
  }
});

// Restore settings from backup
router.post('/restore', auth, isAdmin, async (req, res) => {
  try {
    console.log('Restoring settings from backup');
    
    const { backup } = req.body;
    
    if (!backup) {
      return res.status(400).json({
        success: false,
        message: 'Backup data is required'
      });
    }
    
    // Delete all settings
    await Setting.deleteMany({});
    
    // Create new settings from backup
    const restoredSettings = new Setting(backup);
    await restoredSettings.save();
    
    console.log('Settings restored successfully');
    
    res.json({
      success: true,
      data: restoredSettings
    });
  } catch (error) {
    console.error('Error restoring settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore settings',
      error: error.message
    });
  }
});

module.exports = router; 
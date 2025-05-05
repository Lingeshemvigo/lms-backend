/**
 * Script to repair payment records with null or missing transactionIds
 * Run this script with: node db/repair-payments.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database connection URL from environment variables
const DB_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';

// Connect to MongoDB
mongoose.connect(DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Get the Payment model
const Payment = require('../models/Payment');

async function repairPaymentRecords() {
  try {
    console.log('Starting payment records repair...');
    
    // Find all payments with null or undefined transactionId
    const paymentsToFix = await Payment.find({
      $or: [
        { transactionId: null },
        { transactionId: { $exists: false } }
      ]
    });
    
    console.log(`Found ${paymentsToFix.length} payment records to fix`);
    
    // Update each payment with a unique transactionId
    for (const payment of paymentsToFix) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 10);
      const courseId = payment.course ? payment.course.toString().substring(0, 5) : '';
      const studentId = payment.student ? payment.student.toString().substring(0, 5) : '';
      
      const newTransactionId = `repair_${timestamp}_${random}_${courseId}_${studentId}`;
      
      payment.transactionId = newTransactionId;
      await payment.save();
      
      console.log(`Updated payment ${payment._id} with new transactionId: ${newTransactionId}`);
    }
    
    console.log('Payment repair completed successfully');
  } catch (error) {
    console.error('Error repairing payments:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the repair function
repairPaymentRecords(); 
/**
 * Script to clean up duplicate payment records in the database
 * Run with: node db/cleanup-duplicate-payments.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database connection URL
const DB_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';

async function cleanupDuplicatePayments() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(DB_URL);
    console.log('Connected to MongoDB successfully');

    const db = mongoose.connection.db;
    const paymentsCollection = db.collection('payments');

    // Find duplicates for the same student and course combination
    console.log('Finding potential duplicate payments...');
    
    // First, get combinations with multiple payment records
    const duplicateCombinations = await paymentsCollection.aggregate([
      {
        $group: {
          _id: { student: "$student", course: "$course" },
          count: { $sum: 1 },
          ids: { $push: "$_id" }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]).toArray();

    console.log(`Found ${duplicateCombinations.length} student-course combinations with multiple payment records`);

    let totalDuplicatesRemoved = 0;

    // For each combination, keep the most recent complete payment and mark others for deletion
    for (const combo of duplicateCombinations) {
      console.log(`Processing duplicate set for student: ${combo._id.student}, course: ${combo._id.course}`);
      
      // Get all the payment records for this combination
      const payments = await paymentsCollection.find({
        student: combo._id.student,
        course: combo._id.course
      }).sort({ createdAt: -1 }).toArray();
      
      console.log(`Found ${payments.length} payments for this combination`);
      
      // Keep track of which payment to keep
      let paymentToKeep = null;
      
      // First, look for a successful/completed payment
      for (const payment of payments) {
        if (payment.status === 'completed') {
          paymentToKeep = payment;
          break;
        }
      }
      
      // If no completed payment, keep the most recent one
      if (!paymentToKeep && payments.length > 0) {
        paymentToKeep = payments[0];
      }
      
      // Mark the rest for deletion
      const paymentsToDelete = payments.filter(payment => 
        payment._id.toString() !== paymentToKeep._id.toString()
      );
      
      console.log(`Keeping payment ${paymentToKeep._id}, removing ${paymentsToDelete.length} duplicates`);
      
      // Delete the duplicates
      if (paymentsToDelete.length > 0) {
        const deleteIds = paymentsToDelete.map(p => p._id);
        const deleteResult = await paymentsCollection.deleteMany({
          _id: { $in: deleteIds }
        });
        
        console.log(`Deleted ${deleteResult.deletedCount} duplicate payments`);
        totalDuplicatesRemoved += deleteResult.deletedCount;
      }
    }

    // Check for any remaining null transaction IDs and fix them
    const nullTxnPayments = await paymentsCollection.find({ transactionId: null }).toArray();
    if (nullTxnPayments.length > 0) {
      console.log(`Found ${nullTxnPayments.length} payments with null transactionId that need fixing`);
      
      for (const payment of nullTxnPayments) {
        const newTxnId = `cleanup_${payment._id}_${Date.now()}`;
        await paymentsCollection.updateOne(
          { _id: payment._id },
          { $set: { transactionId: newTxnId } }
        );
        console.log(`Updated payment ${payment._id} with new transactionId: ${newTxnId}`);
      }
    } else {
      console.log('No payments with null transactionId found');
    }

    console.log(`Cleanup complete. Removed ${totalDuplicatesRemoved} duplicate payment records.`);
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the cleanup
cleanupDuplicatePayments().catch(console.error); 
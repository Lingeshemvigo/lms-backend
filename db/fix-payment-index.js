/**
 * Script to fix the payment collection index for transactionId
 * This script drops the existing index and recreates it correctly
 * Run with: node db/fix-payment-index.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Database connection URL from environment variables
const DB_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017/lms';

async function fixPaymentIndex() {
  try {
    console.log('Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(DB_URL);
    console.log('Connected to MongoDB successfully');
    
    // Get a reference to the payments collection
    const db = mongoose.connection.db;
    const paymentsCollection = db.collection('payments');
    
    // List all indexes to find the transactionId index
    console.log('Listing current indexes...');
    const indexes = await paymentsCollection.indexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));
    
    // Find the transactionId index if it exists
    const transactionIdIndex = indexes.find(index => 
      index.key && index.key.transactionId !== undefined
    );
    
    if (transactionIdIndex) {
      console.log(`Found transactionId index: ${transactionIdIndex.name}`);
      
      // Drop the existing index
      console.log('Dropping the existing transactionId index...');
      await paymentsCollection.dropIndex(transactionIdIndex.name);
      console.log('Index dropped successfully');
    } else {
      console.log('No existing transactionId index found');
    }
    
    // Create a new index with sparse: true
    console.log('Creating new sparse index on transactionId...');
    await paymentsCollection.createIndex(
      { transactionId: 1 }, 
      { 
        unique: true, 
        sparse: true,
        name: "transactionId_1_sparse"
      }
    );
    console.log('New sparse index created successfully');
    
    // Verify the new index was created
    const updatedIndexes = await paymentsCollection.indexes();
    console.log('Updated indexes:', JSON.stringify(updatedIndexes, null, 2));
    
    // Fix null values in existing documents
    console.log('Fixing any documents with null transactionId...');
    const result = await paymentsCollection.updateMany(
      { transactionId: null },
      [{ 
        $set: { 
          transactionId: { 
            $concat: [
              "fixed_",
              { $toString: "$_id" },
              "_",
              { $toString: { $toLong: new Date() } }
            ] 
          } 
        }
      }]
    );
    
    console.log(`Fixed ${result.modifiedCount} documents with null transactionId values`);
    
    console.log('Index repair completed successfully');
  } catch (error) {
    console.error('Error fixing payment index:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
fixPaymentIndex().catch(console.error); 
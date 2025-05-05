// Test Stripe initialization
require('dotenv').config();

// Use environment variable with a fallback
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_51RCdjQPvc4BWJxoTN2LTBpTRdwNdP7IzMcT67cfQn1r3XXAjrsWints9osNM1uGtBWe56tWcIq5pX3BzEeXrMkrJ00TnjuIXHV';

console.log('Testing Stripe initialization');
console.log('ENV Key:', process.env.STRIPE_SECRET_KEY ? 'Present (Masked)' : 'Not found');
console.log('Using Key:', STRIPE_KEY.substring(0, 8) + '...');

try {
  const stripe = require('stripe')(STRIPE_KEY);
  console.log('Stripe initialized successfully:', !!stripe);
  
  // Try creating a payment intent to test the connection
  const createTestIntent = async () => {
    try {
      const intent = await stripe.paymentIntents.create({
        amount: 1000, // $10.00
        currency: 'usd',
        payment_method_types: ['card']
      });
      console.log('Successfully created test payment intent:', intent.id);
    } catch (error) {
      console.error('Error creating payment intent:', error.message);
    }
  };
  
  createTestIntent();
} catch (error) {
  console.error('Error initializing Stripe:', error.message);
} 
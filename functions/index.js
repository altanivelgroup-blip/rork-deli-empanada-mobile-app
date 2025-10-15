
/**
 * Firebase Cloud Functions for Deli Empanada
 * 
 * This function securely generates Wompi payment signatures using the private integrity secret.
 * The secret is stored in Firebase environment configuration and never exposed to the client.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors');
const crypto = require('crypto');

// Initialize Firebase Admin
admin.initializeApp();

// Configure CORS to allow requests from your app
const corsHandler = cors({ origin: true });

/**
 * Generate Wompi Payment Signature
 * 
 * This function generates a SHA-256 signature for Wompi payment transactions.
 * 
 * Request Body:
 * {
 *   "reference": "DE1729026123456",
 *   "amountInCents": 15000,
 *   "currency": "COP"
 * }
 * 
 * Response:
 * {
 *   "signature": "a1b2c3d4e5f6...",
 *   "reference": "DE1729026123456",
 *   "amountInCents": 15000,
 *   "currency": "COP"
 * }
 */
exports.generateWompiSignature = functions.https.onRequest((request, response) => {
  corsHandler(request, response, () => {
    try {
      // Only allow POST requests
      if (request.method !== 'POST') {
        console.error('[generateWompiSignature] Invalid method:', request.method);
        return response.status(405).json({
          error: 'Method not allowed',
          message: 'Only POST requests are supported'
        });
      }

      // Extract parameters from request body
      const { reference, amountInCents, currency } = request.body;

      // Validate required parameters
      if (!reference || !amountInCents || !currency) {
        console.error('[generateWompiSignature] Missing parameters:', { reference, amountInCents, currency });
        return response.status(400).json({
          error: 'Missing required parameters',
          message: 'reference, amountInCents, and currency are required'
        });
      }

      // Validate data types
      if (typeof reference !== 'string') {
        return response.status(400).json({
          error: 'Invalid parameter type',
          message: 'reference must be a string'
        });
      }

      if (typeof amountInCents !== 'number' || amountInCents <= 0) {
        return response.status(400).json({
          error: 'Invalid parameter type',
          message: 'amountInCents must be a positive number'
        });
      }

      if (typeof currency !== 'string' || currency.length !== 3) {
        return response.status(400).json({
          error: 'Invalid parameter type',
          message: 'currency must be a 3-letter string (e.g., COP, USD)'
        });
      }

      // Get the integrity secret from Firebase environment config
      const integritySecret = functions.config().wompi?.integrity_secret;

      if (!integritySecret) {
        console.error('[generateWompiSignature] Missing integrity secret in Firebase config');
        return response.status(500).json({
          error: 'Server configuration error',
          message: 'Payment gateway is not properly configured. Please contact support.'
        });
      }

      // Generate the signature using the Wompi formula:
      // SHA-256(reference + amountInCents + currency + integritySecret)
      const signatureString = `${reference}${amountInCents}${currency}${integritySecret}`;
      const signature = crypto.createHash('sha256').update(signatureString).digest('hex');

      console.log('[generateWompiSignature] ✅ Signature generated successfully');
      console.log('[generateWompiSignature] Reference:', reference);
      console.log('[generateWompiSignature] Amount:', amountInCents);
      console.log('[generateWompiSignature] Currency:', currency);

      // Return the signature with the original parameters for verification
      return response.status(200).json({
        signature,
        reference,
        amountInCents,
        currency,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[generateWompiSignature] Unexpected error:', error);
      return response.status(500).json({
        error: 'Internal server error',
        message: 'An unexpected error occurred while generating the signature'
      });
    }
  });
});

/**
 * Health Check Endpoint
 * 
 * Simple endpoint to verify the function is running correctly.
 */
exports.healthCheck = functions.https.onRequest((request, response) => {
  corsHandler(request, response, () => {
    response.status(200).json({
      status: 'healthy',
      service: 'deli-empanada-functions',
      timestamp: new Date().toISOString()
    });
  });
});

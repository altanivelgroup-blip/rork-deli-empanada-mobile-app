/**
 * Firebase Cloud Functions for Deli Empanada
 * Secure Wompi Payment Processing Backend
 * 
 * This backend handles sensitive Wompi operations that should NEVER
 * be done on the client side for security reasons.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Generate Wompi Integrity Signature
 * 
 * This function securely generates the integrity signature required by Wompi
 * for payment processing. The private key never leaves the server.
 * 
 * @param {Object} data - Payment data
 * @param {string} data.reference - Unique payment reference
 * @param {number} data.amountInCents - Amount in cents (e.g., 50000 for $50.00)
 * @param {string} data.currency - Currency code (e.g., 'COP')
 * @returns {Object} - { signature: string }
 */
exports.generateWompiSignature = functions.https.onCall(async (data, context) => {
  try {
    // Validate input
    const { reference, amountInCents, currency } = data;
    
    if (!reference || !amountInCents || !currency) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required parameters: reference, amountInCents, currency'
      );
    }

    // Validate amount is a positive number
    if (typeof amountInCents !== 'number' || amountInCents <= 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Amount must be a positive number'
      );
    }

    // Get the integrity secret from environment variables
    const integritySecret = functions.config().wompi?.integrity_secret;
    
    if (!integritySecret) {
      console.error('WOMPI_INTEGRITY_SECRET not configured in Firebase Functions');
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Payment system configuration error. Please contact support.'
      );
    }

    // Generate the signature string according to Wompi's specification
    // Format: reference + amountInCents + currency + integritySecret
    const signatureString = `${reference}${amountInCents}${currency}${integritySecret}`;
    
    // Create SHA256 hash
    const signature = crypto
      .createHash('sha256')
      .update(signatureString)
      .digest('hex');

    console.log('Signature generated successfully for reference:', reference);

    return { signature };
    
  } catch (error) {
    console.error('Error generating Wompi signature:', error);
    
    // If it's already an HttpsError, rethrow it
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    // Otherwise, wrap it in a generic error
    throw new functions.https.HttpsError(
      'internal',
      'Failed to generate payment signature'
    );
  }
});

/**
 * Verify Wompi Payment Status (Optional - for webhooks)
 * 
 * This function can be called by Wompi webhooks to verify payment status.
 * Useful for updating order status in real-time.
 * 
 * @param {Object} req - HTTP request
 * @param {Object} res - HTTP response
 */
exports.wompiWebhook = functions.https.onRequest(async (req, res) => {
  try {
    // Verify the request is from Wompi using the events secret
    const eventsSecret = functions.config().wompi?.events_secret;
    const signature = req.headers['x-wompi-signature'];
    
    if (!signature || !eventsSecret) {
      console.warn('Webhook rejected: missing signature or secret');
      res.status(401).send('Unauthorized');
      return;
    }

    // Get the webhook data
    const webhookData = req.body;
    
    // Verify signature (implement proper verification based on Wompi docs)
    // This is a simplified version - check Wompi docs for exact implementation
    const computedSignature = crypto
      .createHash('sha256')
      .update(JSON.stringify(webhookData) + eventsSecret)
      .digest('hex');
    
    if (signature !== computedSignature) {
      console.warn('Webhook rejected: invalid signature');
      res.status(401).send('Invalid signature');
      return;
    }

    // Process the webhook data
    console.log('Webhook received:', webhookData);
    
    // Update order status in Firestore based on payment status
    if (webhookData.event === 'transaction.updated') {
      const { reference, status } = webhookData.data.transaction;
      
      // Update the order in Firestore
      const ordersRef = admin.firestore().collection('pedidos');
      const query = ordersRef.where('transactionId', '==', reference);
      const snapshot = await query.get();
      
      if (!snapshot.empty) {
        const batch = admin.firestore().batch();
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            paymentStatus: status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });
        await batch.commit();
        console.log('Order status updated for reference:', reference);
      }
    }
    
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal server error');
  }
});
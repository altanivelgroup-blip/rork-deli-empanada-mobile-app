const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

/**
 * Wompi Webhook Handler
 * Receives payment notifications from Wompi and updates order status
 * Verifies signature to ensure authenticity
 */
exports.wompiWebhook = functions.https.onRequest(async (req, res) => {
  console.log('🔔 Webhook received:', {
    method: req.method,
    headers: req.headers,
    body: req.body,
  });

  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method);
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const event = req.body;
    
    if (!event || !event.event || !event.data) {
      console.log('❌ Invalid payload structure');
      return res.status(400).send('Invalid payload');
    }

    // Verify signature
    const signature = req.headers['x-wompi-signature'];
    const timestamp = req.headers['x-wompi-timestamp'];
    
    if (!signature || !timestamp) {
      console.log('❌ Missing signature headers');
      return res.status(401).send('Missing signature');
    }

    const eventsSecret = functions.config().wompi?.events_secret;
    if (!eventsSecret) {
      console.error('❌ WOMPI_EVENTS_SECRET not configured in Firebase');
      return res.status(500).send('Server configuration error');
    }

    // Verify signature
    const payload = `${timestamp}.${JSON.stringify(event)}`;
    const expectedSignature = crypto
      .createHmac('sha256', eventsSecret)
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.log('❌ Invalid signature');
      return res.status(401).send('Invalid signature');
    }

    console.log('✅ Signature verified');

    // Process the event
    const eventType = event.event;
    const transaction = event.data.transaction;

    console.log('📊 Processing event:', {
      type: eventType,
      transactionId: transaction.id,
      status: transaction.status,
      reference: transaction.reference,
    });

    // Handle different event types
    if (eventType === 'transaction.updated') {
      const reference = transaction.reference;
      const status = transaction.status;
      const transactionId = transaction.id;

      // Find the order by reference
      const ordersRef = db.collection('orders');
      const orderSnapshot = await ordersRef
        .where('wompiReference', '==', reference)
        .limit(1)
        .get();

      if (orderSnapshot.empty) {
        console.log('⚠️ Order not found for reference:', reference);
        return res.status(404).send('Order not found');
      }

      const orderDoc = orderSnapshot.docs[0];
      const orderId = orderDoc.id;

      // Map Wompi status to our order status
      let orderStatus = 'pending';
      let paymentStatus = status;

      switch (status) {
        case 'APPROVED':
          orderStatus = 'confirmed';
          paymentStatus = 'approved';
          break;
        case 'DECLINED':
          orderStatus = 'cancelled';
          paymentStatus = 'declined';
          break;
        case 'VOIDED':
          orderStatus = 'cancelled';
          paymentStatus = 'voided';
          break;
        case 'ERROR':
          orderStatus = 'cancelled';
          paymentStatus = 'error';
          break;
        default:
          orderStatus = 'pending';
          paymentStatus = status.toLowerCase();
      }

      // Update the order
      await orderDoc.ref.update({
        status: orderStatus,
        paymentStatus: paymentStatus,
        wompiTransactionId: transactionId,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        webhookProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log('✅ Order updated:', {
        orderId,
        orderStatus,
        paymentStatus,
        transactionId,
      });

      // If approved, send notification (you can implement this later)
      if (status === 'APPROVED') {
        console.log('🎉 Payment approved for order:', orderId);
        // TODO: Send push notification to user
        // TODO: Notify kitchen/admin
      }
    }

    return res.status(200).json({ 
      success: true,
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * Manual Order Status Check
 * Allows checking order status by calling this function
 * Useful for debugging or manual verification
 */
exports.checkOrderStatus = functions.https.onCall(async (data, context) => {
  const { orderId } = data;

  if (!orderId) {
    throw new functions.https.HttpsError('invalid-argument', 'Order ID is required');
  }

  try {
    const orderDoc = await db.collection('orders').doc(orderId).get();

    if (!orderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found');
    }

    const orderData = orderDoc.data();

    return {
      orderId,
      status: orderData.status,
      paymentStatus: orderData.paymentStatus,
      wompiReference: orderData.wompiReference,
      wompiTransactionId: orderData.wompiTransactionId,
      createdAt: orderData.createdAt,
      lastUpdated: orderData.lastUpdated,
    };
  } catch (error) {
    console.error('Error checking order status:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

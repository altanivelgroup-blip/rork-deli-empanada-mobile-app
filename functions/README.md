# Deli Empanada - Firebase Cloud Functions

## 🔒 Secure Wompi Payment Processing Backend

This directory contains Firebase Cloud Functions that handle sensitive payment operations for the Deli Empanada app. These functions keep your private Wompi keys secure on the server and away from client-side code.

---

## 📋 Prerequisites

Before deploying these functions, make sure you have:

1. **Node.js** installed (v18 or higher)
2. **Firebase CLI** installed globally:
   ```bash
   npm install -g firebase-tools
   ```
3. **Firebase project** created at [Firebase Console](https://console.firebase.google.com)
4. **Firebase Blaze plan** enabled (required for Cloud Functions)
5. **Wompi account** with access to your secret keys

---

## 🚀 First-Time Setup

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

### Step 2: Login to Firebase

```bash
firebase login
```

### Step 3: Initialize Firebase in Your Project

From the **root** of your project (not the functions folder):

```bash
firebase init functions
```

Select:
- ✅ Use an existing project (select your Deli Empanada project)
- ✅ JavaScript (not TypeScript)
- ✅ ESLint: No (or Yes, your choice)
- ✅ Install dependencies: Yes

### Step 4: Upgrade to Blaze Plan

Cloud Functions require the Blaze (pay-as-you-go) plan:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click "Upgrade" in the bottom left
4. Choose the Blaze plan
5. Don't worry - it starts at $0 and you only pay for usage
6. For a small app, costs are typically $0-5/month

---

## 🔐 Configure Secrets

### Get Your Wompi Secrets

1. Log into your [Wompi Dashboard](https://comercios.wompi.co)
2. Go to Settings → API Keys / Integración
3. Copy these three values:
   - **Integrity Secret** (Llave de Integridad)
   - **Events Secret** (Llave de Eventos)
   - **Private Key** (if needed)

### Set Firebase Environment Variables

From the **root** of your project, run:

```bash
firebase functions:config:set \
  wompi.integrity_secret="YOUR_INTEGRITY_SECRET_HERE" \
  wompi.events_secret="YOUR_EVENTS_SECRET_HERE" \
  wompi.private_key="YOUR_PRIVATE_KEY_HERE"
```

**Replace the placeholder values with your actual Wompi secrets!**

### Verify Configuration

```bash
firebase functions:config:get
```

You should see your configuration printed out.

---

## 📦 Install Dependencies

Navigate to the `functions/` directory and install packages:

```bash
cd functions
npm install
```

---

## 🚀 Deploy to Firebase

From the **root** of your project (or from the functions folder):

```bash
firebase deploy --only functions
```

This will:
1. Upload your functions to Firebase
2. Build and deploy them
3. Give you URLs for each function

**Note:** First deployment may take 5-10 minutes. Be patient!

### Deploy Specific Functions

To deploy only one function:

```bash
firebase deploy --only functions:generateWompiSignature
```

---

## 🧪 Test Your Functions

### Test Locally (Emulator)

```bash
firebase emulators:start --only functions
```

This starts a local emulator where you can test functions before deploying.

### Test in Production

After deployment, Firebase will give you a URL like:

```
https://us-central1-your-project.cloudfunctions.net/generateWompiSignature
```

You can call this from your app to test it works!

---

## 📱 Update Your App Code

After deploying, you need to update your app to call these functions instead of generating signatures locally.

### Import Firebase Functions in Your App

In your `app/checkout.tsx` (or wherever you handle payments):

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

// Initialize functions
const functions = getFunctions();
const generateWompiSignature = httpsCallable(functions, 'generateWompiSignature');

// Call the function
const handleCardPayment = async () => {
  const reference = `DE${Date.now()}`;
  const cents = Math.round(total * 100);
  const currency = 'COP';

  try {
    const result = await generateWompiSignature({
      reference,
      amountInCents: cents,
      currency
    });

    const { signature } = result.data;
    
    // Now use this signature to build your Wompi URL
    const url = `https://checkout.wompi.co/p/?public-key=${publicKey}&amount-in-cents=${cents}&currency=${currency}&reference=${reference}&signature:integrity=${signature}&redirect-url=${redirectUrl}`;
    
    // Open Wompi checkout
    setWompiUrl(url);
    setShowWompi(true);
  } catch (error) {
    console.error('Error generating signature:', error);
    Alert.alert('Error', 'No se pudo procesar el pago');
  }
};
```

---

## 🗑️ Remove Secrets from Client Code

**CRITICAL:** After deploying functions, remove these from your main `.env` file:

```bash
# DELETE THESE LINES FROM YOUR MAIN .env FILE:
EXPO_PUBLIC_WOMPI_INTEGRITY_SECRET=...
EXPO_PUBLIC_WOMPI_EVENTS_SECRET=...
EXPO_PUBLIC_WOMPI_PRIVATE_KEY=...
```

**KEEP ONLY:**

```bash
EXPO_PUBLIC_WOMPI_PUBLIC_KEY=your_public_key
EXPO_PUBLIC_WOMPI_REDIRECT_URL=https://deliempanada.com/confirmation
EXPO_PUBLIC_CURRENCY=COP
```

---

## 📊 Monitor Your Functions

### View Logs

```bash
firebase functions:log
```

### View Dashboard

Go to [Firebase Console](https://console.firebase.google.com) → Functions to see:
- Invocation count
- Error rate
- Execution time
- Costs

---

## 💰 Costs

Firebase Cloud Functions pricing (as of 2024):

- **Free tier:** 2M invocations/month, 400K GB-seconds/month, 200K GHz-seconds/month
- **After free tier:** $0.40 per million invocations

For a small food delivery app, you'll likely stay in the free tier!

---

## 🐛 Troubleshooting

### "Billing account not configured"

**Solution:** Upgrade to Blaze plan in Firebase Console.

### "Function not found"

**Solution:** Make sure you deployed with `firebase deploy --only functions`.

### "Permission denied"

**Solution:** Run `firebase login` again and check your Firebase project permissions.

### "Module not found"

**Solution:** Run `npm install` in the functions/ directory.

### Functions timing out

**Solution:** 
1. Check Firebase Console logs for errors
2. Verify your secrets are configured correctly
3. Make sure your Firebase project is on the Blaze plan

---

## 🔄 Update Functions

When you make changes to your functions:

1. Edit the code in `functions/index.js`
2. Test locally (optional): `firebase emulators:start`
3. Deploy: `firebase deploy --only functions`
4. Monitor logs: `firebase functions:log`

---

## 📚 Available Functions

### `generateWompiSignature`

- **Purpose:** Generates secure Wompi payment signature
- **Input:** 
  - `reference`: Unique payment reference
  - `amountInCents`: Amount in cents
  - `currency`: Currency code (e.g., 'COP')
- **Output:**
  - `signature`: SHA256 signature hash
- **Example:**
  ```javascript
  const result = await generateWompiSignature({
    reference: 'DE1234567890',
    amountInCents: 50000,
    currency: 'COP'
  });
  console.log(result.data.signature);
  ```

### `wompiWebhook`

- **Purpose:** Receives and processes Wompi payment status updates
- **Type:** HTTP endpoint
- **URL:** `https://your-project.cloudfunctions.net/wompiWebhook`
- **Configure in Wompi:** Add this URL to your Wompi webhook settings

---

## 🎯 Quick Commands Reference

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init functions

# Install dependencies
cd functions && npm install

# Configure secrets
firebase functions:config:set wompi.integrity_secret="SECRET"

# Deploy
firebase deploy --only functions

# View logs
firebase functions:log

# Test locally
firebase emulators:start --only functions
```

---

## 🆘 Need Help?

- **Firebase Docs:** https://firebase.google.com/docs/functions
- **Wompi Docs:** https://docs.wompi.co
- **Firebase Support:** https://firebase.google.com/support

---

## ✅ Checklist Before Going Live

- [ ] Blaze plan enabled
- [ ] Functions deployed successfully
- [ ] Secrets configured (use `firebase functions:config:get`)
- [ ] App updated to call backend functions
- [ ] Private keys removed from client `.env`
- [ ] Functions tested with real payment
- [ ] Webhook URL added to Wompi dashboard
- [ ] Error logging monitored
- [ ] Backup of all configurations saved

---

**🎉 Once completed, your payment processing is secure and production-ready!**

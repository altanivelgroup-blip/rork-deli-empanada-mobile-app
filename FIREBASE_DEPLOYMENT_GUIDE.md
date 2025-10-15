# 🔒 Secure Wompi Payment Integration - Firebase Deployment Guide

## 📋 Overview

This guide will help you deploy a secure Firebase Cloud Functions backend that generates Wompi payment signatures. This removes the security vulnerability of storing the private integrity secret in your mobile app.

**What Changed:**
- ✅ Private `WOMPI_INTEGRITY_SECRET` moved to Firebase backend (secure)
- ✅ App now calls Firebase function to get signatures
- ✅ Payment flow remains exactly the same for users
- ❌ Private key removed from client-side code

---

## 🎯 Prerequisites

Before starting, make sure you have:

1. **Node.js** (version 18 or higher)
   - Check version: `node --version`
   - Download from: https://nodejs.org/

2. **npm** (comes with Node.js)
   - Check version: `npm --version`

3. **A Google/Firebase Account**
   - You can use your existing Google account

4. **Your Wompi Private Keys** (from the commented .env file):
   - `WOMPI_INTEGRITY_SECRET`: `prod_integrity_MkxrtjFBWbouYdWRzA4xWV5q1N25yghV`

---

## 📦 Step 1: Install Firebase CLI

Open your terminal/command prompt and run:

```bash
npm install -g firebase-tools
```

Verify installation:

```bash
firebase --version
```

You should see a version number (e.g., `13.0.0`)

---

## 🔐 Step 2: Login to Firebase

Run this command and follow the prompts to login with your Google account:

```bash
firebase login
```

This will:
1. Open a browser window
2. Ask you to login with your Google account
3. Grant Firebase CLI access to your account

---

## 🏗️ Step 3: Create or Select Firebase Project

### Option A: Create a New Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `deli-empanada` (or your preferred name)
4. Accept terms and click "Continue"
5. Disable Google Analytics (not needed for this)
6. Click "Create project"
7. Wait for setup to complete
8. Note your **Project ID** (e.g., `deli-empanada-abc123`)

### Option B: Use Existing Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your existing project
3. Note your **Project ID** from the project settings

---

## 🔧 Step 4: Link Your Code to Firebase Project

Navigate to your project directory:

```bash
cd /path/to/rork-deli-empanada-mobile-app
```

Initialize Firebase in your project:

```bash
firebase init
```

You'll see an interactive prompt. Make these selections:

1. **Which Firebase features?** 
   - Use arrow keys to navigate
   - Press SPACE to select "Functions"
   - Press ENTER to continue

2. **Please select an option:**
   - Choose "Use an existing project"
   - Press ENTER

3. **Select a default Firebase project:**
   - Choose your project (e.g., `deli-empanada`)
   - Press ENTER

4. **What language would you like to use?**
   - Choose "JavaScript"
   - Press ENTER

5. **Do you want to use ESLint?**
   - Type `n` and press ENTER

6. **Do you want to install dependencies now?**
   - Type `y` and press ENTER

**⚠️ IMPORTANT:** The init process may overwrite your functions folder. After it completes, the correct files are already in place, so just verify they exist:

```bash
ls functions/
```

You should see: `index.js`, `package.json`, `.gitignore`

---

## 🔑 Step 5: Configure Firebase Environment Variables

This is the most important step! We need to securely store your Wompi integrity secret in Firebase.

Run this command (replace with your actual secret):

```bash
firebase functions:config:set wompi.integrity_secret="prod_integrity_MkxrtjFBWbouYdWRzA4xWV5q1N25yghV"
```

**✅ Success message:** You should see:
```
✔  Functions config updated.
```

**Verify the configuration:**

```bash
firebase functions:config:get
```

You should see:
```json
{
  "wompi": {
    "integrity_secret": "prod_integrity_MkxrtjFBWbouYdWRzA4xWV5q1N25yghV"
  }
}
```

---

## 🚀 Step 6: Deploy Firebase Functions

Now let's deploy the functions to Firebase:

```bash
firebase deploy --only functions
```

This will:
1. Package your functions code
2. Upload it to Firebase
3. Deploy the functions to Google Cloud

**Expected output:**
```
=== Deploying to 'deli-empanada'...

i  deploying functions
i  functions: ensuring required API cloudfunctions.googleapis.com is enabled...
i  functions: ensuring required API cloudbuild.googleapis.com is enabled...
✔  functions: required API cloudfunctions.googleapis.com is enabled
✔  functions: required API cloudbuild.googleapis.com is enabled
i  functions: preparing functions directory for uploading...
i  functions: packaged functions (X KB) for uploading
✔  functions: functions folder uploaded successfully
i  functions: creating Node.js 18 function generateWompiSignature...
✔  functions[generateWompiSignature]: Successful create operation.
Function URL (generateWompiSignature): https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/generateWompiSignature

✔  Deploy complete!
```

**🔥 IMPORTANT:** Copy the Function URL from the output! You'll need it in the next step.

Example URL:
```
https://us-central1-deli-empanada-abc123.cloudfunctions.net/generateWompiSignature
```

---

## ⚙️ Step 7: Update App Configuration

Now update your app's `.env` file with the Firebase function URL:

1. Open the `.env` file in your project root
2. Find this line:
   ```
   EXPO_PUBLIC_CLOUD_FUNCTION_URL=YOUR_FIREBASE_FUNCTION_URL_HERE
   ```
3. Replace it with your actual function URL:
   ```
   EXPO_PUBLIC_CLOUD_FUNCTION_URL=https://us-central1-deli-empanada-abc123.cloudfunctions.net/generateWompiSignature
   ```
4. Save the file

**Final `.env` should look like:**
```env
# Wompi Configuration
EXPO_PUBLIC_WOMPI_PUBLIC_KEY=pub_prod_NAwyKpxig2HRoKYJD75VYXjL2nlaR3FB
EXPO_PUBLIC_WOMPI_REDIRECT_URL=https://deliempanada.com/confirmation
EXPO_PUBLIC_CURRENCY=COP
EXPO_PUBLIC_BUSINESS_NAME=Deli Empanada
EXPO_PUBLIC_WOMPI_R=https://checkout.wompi.co/p/

# ⚠️ SECURITY: Private keys removed from client-side
# These keys should ONLY be stored in Firebase Cloud Functions environment
# WOMPI_PRIVATE_KEY=prv_prod_IH2NXcOppmDCh6SHJVGeUrp8EovuNSId
# WOMPI_INTEGRITY_SECRET=prod_integrity_MkxrtjFBWbouYdWRzA4xWV5q1N25yghV
# WOMPI_EVENTS_SECRET=prod_events_QXfiwzXoEOWhYKCLkLfNo3VEeq12u7vW

# Firebase Cloud Function URL
EXPO_PUBLIC_CLOUD_FUNCTION_URL=https://us-central1-deli-empanada-abc123.cloudfunctions.net/generateWompiSignature

# Rork Configuration
EXPO_PUBLIC_RORK_API_BASE_URL=https://api.rork.com
EXPO_PUBLIC_TOOLKIT_URL=https://toolkit.rork.com
```

---

## 🧪 Step 8: Test the Backend Function

Let's test that your Firebase function works correctly.

### Test with curl (Terminal/Command Prompt):

```bash
curl -X POST https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/generateWompiSignature \
  -H "Content-Type: application/json" \
  -d '{
    "reference": "DE1729026000000",
    "amountInCents": 15000,
    "currency": "COP"
  }'
```

**Expected Response:**
```json
{
  "signature": "a1b2c3d4e5f6789...",
  "reference": "DE1729026000000",
  "amountInCents": 15000,
  "currency": "COP",
  "timestamp": "2025-10-15T21:30:00.000Z"
}
```

### Test with Postman or Browser:

1. Open Postman or your browser's REST client
2. Create a POST request to your function URL
3. Set Content-Type header to `application/json`
4. Body:
   ```json
   {
     "reference": "DE1729026000000",
     "amountInCents": 15000,
     "currency": "COP"
   }
   ```
5. Send the request
6. You should get a response with a `signature` field

---

## 📱 Step 9: Rebuild and Test Your App

Now that everything is configured, rebuild and test your app:

### For Development:

```bash
# Clear cache and restart
npx expo start --clear
```

### For Production Build:

```bash
# For Android
eas build --platform android --profile production

# For iOS
eas build --platform ios --profile production
```

---

## ✅ Step 10: Test the Payment Flow

1. **Open your app**
2. **Add items to cart**
3. **Go to checkout**
4. **Fill in customer information:**
   - Name: Test User
   - Phone: 3001234567
   - Address: Calle 123 #45-67
5. **Select "Tarjeta" payment method**
6. **Click "Confirmar Pedido"**

**Expected Flow:**
1. ✅ App calls Firebase function
2. ✅ Function generates signature
3. ✅ App receives signature
4. ✅ Wompi checkout opens
5. ✅ User can complete payment

**Check the logs:**
- In your app: Look for console logs with `[handleCardPayment]`
- In Firebase: `firebase functions:log`

---

## 🔍 Monitoring and Logs

### View Function Logs:

```bash
firebase functions:log
```

### View Logs in Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to "Functions" in the left sidebar
4. Click on "Logs" tab
5. You'll see all function executions and any errors

### Monitor Function Performance:

1. In Firebase Console → Functions
2. Click on your function name
3. View metrics: invocations, execution time, errors

---

## 🔒 Security Notes

### ✅ What's Secure Now:

- Private integrity secret stored in Firebase (not in app)
- Function validates all inputs
- Signature generation happens server-side
- No sensitive data in client code

### ⚠️ Best Practices:

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Rotate keys periodically** - Update in Firebase config
3. **Monitor function logs** - Watch for suspicious activity
4. **Set up billing alerts** - Avoid unexpected costs

---

## 🐛 Troubleshooting

### Problem: "Missing integrity secret in Firebase config"

**Solution:**
```bash
# Set the config again
firebase functions:config:set wompi.integrity_secret="YOUR_SECRET_HERE"

# Redeploy
firebase deploy --only functions
```

---

### Problem: "CORS error when calling function"

**Solution:**
The function already includes CORS headers. If you still get errors:

1. Check that the function URL is correct in `.env`
2. Make sure you're using the deployed URL, not localhost
3. Check Firebase Console logs for actual error

---

### Problem: "Function deployment failed"

**Solution:**
```bash
# Make sure you're logged in
firebase login

# Make sure you selected the right project
firebase use YOUR-PROJECT-ID

# Try deploying again
firebase deploy --only functions
```

---

### Problem: "App says missing EXPO_PUBLIC_CLOUD_FUNCTION_URL"

**Solution:**
1. Verify `.env` file has the correct URL
2. Restart the Expo dev server: `npx expo start --clear`
3. Check that the variable name is exactly: `EXPO_PUBLIC_CLOUD_FUNCTION_URL`

---

### Problem: "Signature verification failed in Wompi"

**Solution:**
1. Verify the integrity secret in Firebase config matches Wompi:
   ```bash
   firebase functions:config:get
   ```
2. Make sure it's: `prod_integrity_MkxrtjFBWbouYdWRzA4xWV5q1N25yghV`
3. Redeploy if you made changes:
   ```bash
   firebase deploy --only functions
   ```

---

### Problem: "Payment worked before but not now"

**Checklist:**
- [ ] Firebase function is deployed
- [ ] `.env` has correct function URL
- [ ] App has been restarted after `.env` changes
- [ ] Internet connection is working
- [ ] Check Firebase logs: `firebase functions:log`

---

## 💰 Costs and Billing

### Firebase Free Tier (Spark Plan):

**Includes:**
- 2M invocations/month (FREE)
- 400,000 GB-seconds (FREE)
- 200,000 CPU-seconds (FREE)

**Estimated Usage for Deli Empanada:**
- ~100-500 payments/day = 3,000-15,000/month
- Well within free tier! ✅

### Paid Plan (Blaze - Pay as you go):

Only needed if you exceed free tier:
- $0.40 per million invocations
- Very affordable for small/medium businesses

**Set up billing alerts:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to "Billing" → "Budgets & alerts"
4. Create budget alert (e.g., alert at $5)

---

## 🔄 Updating the Function

If you need to make changes to the function:

1. **Edit** `functions/index.js`
2. **Test locally** (optional):
   ```bash
   firebase emulators:start --only functions
   ```
3. **Deploy changes:**
   ```bash
   firebase deploy --only functions
   ```
4. **No app changes needed** - URL stays the same!

---

## 📊 Testing Checklist

Before going live, test these scenarios:

- [ ] Payment with minimum amount (e.g., $1,000 COP)
- [ ] Payment with delivery fee included
- [ ] Payment with pickup (no delivery fee)
- [ ] Payment with long customer name
- [ ] Payment with special characters in name (áéíóú)
- [ ] Cancel payment (close Wompi modal)
- [ ] Complete payment successfully
- [ ] Check order appears in Firebase "pedidos" collection
- [ ] Try cash payment (should still work)

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Firebase function deploys without errors
✅ Function URL is added to `.env`
✅ App can call the function and get a signature
✅ Wompi checkout opens with correct data
✅ Payment completes successfully
✅ Order is saved to Firestore
✅ User sees confirmation screen
✅ No console errors in app or Firebase logs

---

## 📞 Support

### If You Get Stuck:

1. **Check Firebase Console Logs:**
   ```bash
   firebase functions:log
   ```

2. **Check App Console Logs:**
   - Look for emoji indicators: 🟢 🔒 ✅ ❌
   - These show the payment flow progress

3. **Verify Configuration:**
   ```bash
   # Check Firebase config
   firebase functions:config:get
   
   # Check you're using the right project
   firebase projects:list
   ```

4. **Common Issues:**
   - Typo in function URL
   - Wrong Firebase project
   - Integrity secret mismatch
   - CORS issues (already handled in code)

---

## 📚 Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Wompi API Documentation](https://docs.wompi.co/)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [Firebase CLI Reference](https://firebase.google.com/docs/cli)

---

## 🔐 Quick Reference: Key Commands

```bash
# Login to Firebase
firebase login

# Initialize project
firebase init

# Set environment variable
firebase functions:config:set wompi.integrity_secret="YOUR_SECRET"

# Deploy functions
firebase deploy --only functions

# View logs
firebase functions:log

# Check config
firebase functions:config:get

# List projects
firebase projects:list

# Switch project
firebase use PROJECT_ID
```

---

## ✨ You're All Set!

Your Wompi payment integration is now secure! The private integrity secret is safely stored in Firebase, and your app communicates with the backend to generate signatures.

**What Changed for Users:** Nothing! The payment flow is exactly the same.

**What Changed for Security:** Everything! No more private keys in the app.

🎉 **Congratulations on securing your payment system!** 🎉

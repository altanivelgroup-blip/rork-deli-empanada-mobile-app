# 🔒 Security Changes Required - .env File

## ⚠️ CRITICAL: Remove Private Keys from Client Code

This document explains the security changes required after merging this PR.

---

## 🚨 Why This Is Important

**Currently:** Your private Wompi keys are exposed in the client-side `.env` file. This means anyone who downloads your app can extract these keys and potentially:
- Generate fraudulent payment signatures
- Process unauthorized transactions
- Compromise your Wompi account

**After these changes:** Private keys will be stored securely on the Firebase server, never exposed to clients.

---

## 📝 Changes to Make to Your `.env` File

### ❌ **REMOVE These Lines** (Private Keys - Security Risk!)

Delete these three lines from your main `.env` file:

```bash
EXPO_PUBLIC_WOMPI_INTEGRITY_SECRET=...
EXPO_PUBLIC_WOMPI_EVENTS_SECRET=...
EXPO_PUBLIC_WOMPI_PRIVATE_KEY=...
```

**Why remove?** These are PRIVATE keys that should NEVER be in client code. They are now securely stored in Firebase Cloud Functions.

---

### ✅ **KEEP These Lines** (Public Keys - Safe!)

Keep these lines in your `.env` file - they are safe to expose:

```bash
EXPO_PUBLIC_WOMPI_PUBLIC_KEY=pub_prod_xxxxx
EXPO_PUBLIC_WOMPI_REDIRECT_URL=https://deliempanada.com/confirmation
EXPO_PUBLIC_CURRENCY=COP
```

**Why keep?** These are PUBLIC values that are meant to be visible in client code. They don't pose a security risk.

---

## 📋 Your Updated .env File Should Look Like:

```bash
# Firebase Configuration (these are safe - they're public by design)
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...

# Wompi Configuration (ONLY PUBLIC KEYS)
EXPO_PUBLIC_WOMPI_PUBLIC_KEY=pub_prod_xxxxx
EXPO_PUBLIC_WOMPI_REDIRECT_URL=https://deliempanada.com/confirmation
EXPO_PUBLIC_CURRENCY=COP

# DO NOT ADD BACK:
# ❌ EXPO_PUBLIC_WOMPI_INTEGRITY_SECRET
# ❌ EXPO_PUBLIC_WOMPI_EVENTS_SECRET
# ❌ EXPO_PUBLIC_WOMPI_PRIVATE_KEY
```

---

## 🔐 Where Do Private Keys Go Now?

Private keys are now configured in **Firebase Cloud Functions** using the `firebase functions:config:set` command:

```bash
firebase functions:config:set \
  wompi.integrity_secret="YOUR_INTEGRITY_SECRET" \
  wompi.events_secret="YOUR_EVENTS_SECRET" \
  wompi.private_key="YOUR_PRIVATE_KEY"
```

See `functions/README.md` for complete deployment instructions.

---

## ✅ Security Checklist

After merging this PR and deploying the functions, verify:

- [ ] Private keys removed from main `.env` file
- [ ] Only public keys remain in `.env`
- [ ] Firebase Cloud Functions deployed successfully
- [ ] Private keys configured in Firebase (use `firebase functions:config:get`)
- [ ] App tested with real payment to verify it works
- [ ] No private keys in Git history (if exposed, rotate keys at Wompi)
- [ ] `.env` is in `.gitignore` (it should be)

---

## 🔄 What Changed in the Code?

### Before (Insecure):
```javascript
// Signature generated in client code
const integritySecret = process.env.EXPO_PUBLIC_WOMPI_INTEGRITY_SECRET; // ❌ EXPOSED!
const signature = await Crypto.digestStringAsync(...);
```

### After (Secure):
```javascript
// Signature generated on server
const functions = getFunctions();
const generateWompiSignature = httpsCallable(functions, 'generateWompiSignature');
const result = await generateWompiSignature({ reference, amountInCents, currency });
const { signature } = result.data; // ✅ SECURE!
```

---

## 📞 Need Help?

- Read `functions/README.md` for deployment instructions
- Check Firebase console for function logs
- Test payment flow after deployment
- Contact support if you encounter issues

---

## 🎯 Summary

**Do this after merging:**
1. ✅ Remove private keys from `.env`
2. ✅ Deploy Firebase Cloud Functions
3. ✅ Configure secrets in Firebase
4. ✅ Test payment flow
5. ✅ Verify security checklist

**Your app will now be secure and production-ready!** 🔒✨

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCDS1YVZoD1GWHjwlJaL7VTmcTeBJxk_uY",
  authDomain: "deli-empanada-mobile-app.firebaseapp.com",
  projectId: "deli-empanada-mobile-app",
  storageBucket: "deli-empanada-mobile-app.firebasestorage.app",
  messagingSenderId: "626108798932",
  appId: "1:626108798932:web:eed7d0bd3a1ccbebab2841"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
}

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
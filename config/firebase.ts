import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  getReactNativePersistence,
  initializeAuth
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

try {
  const hasAllConfig = Object.values(firebaseConfig).every(val => val && val.length > 0);
  
  if (hasAllConfig) {
    app = initializeApp(firebaseConfig);
    
    // Initialize Auth with AsyncStorage persistence for React Native
    // This prevents "localStorage not found" errors on iOS/iPad
    if (Platform.OS === 'web') {
      // Use default persistence on web
      auth = getAuth(app);
    } else {
      // Use AsyncStorage persistence on native platforms (iOS, Android)
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    }
    
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('✅ Firebase initialized successfully with AsyncStorage persistence');
  } else {
    console.warn('⚠️ Firebase config incomplete, running without Firebase');
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  console.warn('⚠️ App will continue without Firebase');
  
  // Try to initialize with fallback auth if persistence fails
  if (app && !auth) {
    try {
      auth = getAuth(app);
      console.log('⚠️ Firebase Auth initialized with fallback (default persistence)');
    } catch (fallbackError) {
      console.error('❌ Firebase Auth fallback failed:', fallbackError);
    }
  }
}

export { app, auth, db, storage };
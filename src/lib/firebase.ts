import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

// Firebase App Hosting injects FIREBASE_WEBAPP_CONFIG at build time
// Fall back to individual NEXT_PUBLIC_* env vars for local dev
function getFirebaseConfig() {
  if (typeof process !== 'undefined' && process.env.FIREBASE_WEBAPP_CONFIG) {
    try {
      return JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);
    } catch {}
  }
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  };
}

let db: Firestore | undefined, auth: Auth | undefined;

try {
  const app = getApps().length === 0 ? initializeApp(getFirebaseConfig()) : getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
} catch (error) {
  console.error('Firebase init error', error);
}

export { db, auth };

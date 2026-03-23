import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'REDACTED_FIREBASE_API_KEY',
  authDomain: 'lovable-clone-project.firebaseapp.com',
  projectId: 'lovable-clone-project',
  storageBucket: 'lovable-clone-project.firebasestorage.app',
  messagingSenderId: '845268333989',
  appId: '1:845268333989:web:60167d22d15f35c73ca44c',
  measurementId: 'G-8FLZN5JM7D',
};

export const firebaseApp: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const googleAuthProvider = new GoogleAuthProvider();
export const db = getFirestore(firebaseApp);

let analyticsInitialized = false;

export const initFirebaseAnalytics = async (): Promise<void> => {
  if (analyticsInitialized || typeof window === 'undefined') {
    return;
  }

  try {
    const supported = await isAnalyticsSupported();
    if (!supported) {
      return;
    }

    getAnalytics(firebaseApp);
    analyticsInitialized = true;
  } catch (error) {
    console.warn('[Firebase] Analytics initialization skipped.', error);
  }
};

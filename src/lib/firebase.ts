
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAMHtDvdJeWA_UHbeKH0d0Q9Oi7AZi7NCw",
  authDomain: "matriculaon-2938b.firebaseapp.com",
  projectId: "matriculaon-2938b",
  storageBucket: "matriculaon-2938b.firebasestorage.app",
  messagingSenderId: "518699387814",
  appId: "1:518699387814:web:8ad071adcc1fead9ff5d67",
  measurementId: "G-LHM163RYQ5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

// Initialize Analytics (optional)
export const analytics = getAnalytics(app);

export default app;

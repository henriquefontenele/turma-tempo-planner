import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAMHtDvdJeWA_UHbeKH0d0Q9Oi7AZi7NCw",
  authDomain: "matriculaon-2938b.firebaseapp.com",
  projectId: "matriculaon-2938b",
  storageBucket: "matriculaon-2938b.firebasestorage.app",
  messagingSenderId: "518699387814",
  appId: "1:518699387814:web:8ad071adcc1fead9ff5d67",
};

// Secondary app instance to create users without affecting the admin's session
const secondaryApp = getApps().find(app => app.name === 'secondary') 
  || initializeApp(firebaseConfig, 'secondary');

const secondaryAuth = getAuth(secondaryApp);

export const createUserWithoutSignIn = async (email: string, password: string) => {
  const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
  // Sign out from secondary immediately
  await secondaryAuth.signOut();
  return userCredential.user;
};

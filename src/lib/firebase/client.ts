
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  "projectId": "fintrack-z0ep9",
  "appId": "1:897573284249:web:bf1e8c764491d253804b08",
  "storageBucket": "fintrack-z0ep9.firebasestorage.app",
  "apiKey": "AIzaSyCy6CjM08YPJqBw4i9ZrM3TV5BwV6zG2E4",
  "authDomain": "fintrack-z0ep9.firebaseapp.com",
  "measurementId": "G-5G65GXP6V8",
  "messagingSenderId": "897573284249"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };

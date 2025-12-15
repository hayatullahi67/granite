
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzfws0hQp_LrMX-KU2YYUh5F4R8Eg80zs",
  authDomain: "granite-3accc.firebaseapp.com",
  projectId: "granite-3accc",
  storageBucket: "granite-3accc.firebasestorage.app",
  messagingSenderId: "874035624352",
  appId: "1:874035624352:web:f006526e03bdc42ef7ccc5",
  measurementId: "G-ZSTDEZ0GZK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Analytics (safely)
let analytics = null;
try {
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (e) {
  console.warn("Analytics failed to initialize:", e);
}

// Export initialized instances and all necessary SDK functions
export { 
  auth, 
  db, 
  analytics,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy
};

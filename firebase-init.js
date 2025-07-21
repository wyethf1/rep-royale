import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import {
    getAuth,
    GoogleAuthProvider,
    EmailAuthProvider,
    signInWithPopup,       // <-- Add this
    signInWithEmailAndPassword, // <-- Add this
    createUserWithEmailAndPassword, // <-- Add this
    signOut,                // <-- Add this
    onAuthStateChanged      // <-- Add this for the listener
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import {
    getFirestore,
    collection,
    doc,
    setDoc,
    getDoc,
    addDoc,
    query,
    where,
    getDocs,
    orderBy,
    serverTimestamp, // <-- Add this
    FieldValue      // <-- FieldValue is the class, serverTimestamp is a method of it
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyB8bHVud00N-H4VBgwsag4oRHBYVvf4q4Q",
  authDomain: "rep-royale.firebaseapp.com",
  databaseURL: "https://rep-royale-default-rtdb.firebaseio.com",
  projectId: "rep-royale",
  storageBucket: "rep-royale.firebasestorage.app",
  messagingSenderId: "842201057109",
  appId: "1:842201057109:web:f2bb869900048bf84751dc",
  measurementId: "G-JSL641G4SJ"
};

try {
  const app = initializeApp(firebaseConfig);

  // Assigning the modular auth and db instances directly
  window.auth = getAuth(app);
  window.db = getFirestore(app);

  // Expose the auth functions on the window object as well
  window.GoogleAuthProvider = GoogleAuthProvider;
  window.EmailAuthProvider = EmailAuthProvider;
  window.signInWithPopup = signInWithPopup; // Crucial for your error
  window.signInWithEmailAndPassword = signInWithEmailAndPassword;
  window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
  window.signOut = signOut;
  window.onAuthStateChanged = onAuthStateChanged; // Expose this for the auth state listener

  // Group Firestore functions for main.js to use
  window.dbFunctions = {
      collection,
      doc,
      setDoc,
      getDoc,
      addDoc,
      query,
      where,
      getDocs,
      orderBy,
      serverTimestamp // No longer need FieldValue directly, use this
  };

  console.log('Firebase initialized successfully');
} catch (e) {
  console.error('Firebase initialization failed:', e);
}

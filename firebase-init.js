import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { getFirestore, collection, doc, setDoc, getDoc, addDoc, query, where, getDocs, orderBy, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

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

  // We need to make these modular functions available globally as well,
  // or refactor main.js to import them. For now, we'll keep the global approach
  // as main.js expects it.
  window.GoogleAuthProvider = GoogleAuthProvider;
  window.EmailAuthProvider = EmailAuthProvider; // Good to have for email/password auth
  window.dbFunctions = { // Group Firestore functions
      collection,
      doc,
      setDoc,
      getDoc,
      addDoc,
      query,
      where,
      getDocs,
      orderBy,
      serverTimestamp
  };

  console.log('Firebase initialized successfully');
} catch (e) {
  console.error('Firebase initialization failed:', e);
}

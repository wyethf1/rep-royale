import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

const firebaseConfig = { 
  apiKey: "AIzaSyB8bHVud00N-H4VBgwsag4oRHBYVvf4q4Q",
  authDomain: "rep-royale.firebaseapp.com",
  databaseURL: "https://rep-royale-default-rtdb.firebaseio.com",
  projectId: "rep-royale",
  storageBucket: "rep-royale.firebasestorage.app",
  messagingSenderId: "842201057109",
  appId: "1:842201057109:web:f2bb869900048bf84751dc",
  measurementId: "G-JSL641G4SJ" };

try {
  const app = initializeApp(firebaseConfig);
  window.auth = getAuth(app);
  window.db = getFirestore(app);
  window.GoogleAuthProvider = GoogleAuthProvider;
  console.log('Firebase initialized successfully');
} catch (e) {
  console.error('Firebase initialization failed:', e);
}

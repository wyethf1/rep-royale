// firebase-init.js

// Your Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyB8bHVud00N-H4VBgwsag4oRHBYVvf4q4Q", // Your actual API key
  authDomain: "rep-royale.firebaseapp.com",
  projectId: "rep-royale",
  storageBucket: "rep-royale.firebasestorage.app",
  messagingSenderId: "842201057109",
  appId: "1:842201057109:web:f2bb869900048bf84751dc",
  measurementId: "G-JSL641G4SJ" // Optional for Google Analytics
};

// Initialize Firebase app
firebase.initializeApp(firebaseConfig);

// Expose Firebase Auth and Firestore instances globally (optional)
window.auth = firebase.auth();
window.db = firebase.firestore();

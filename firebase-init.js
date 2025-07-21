// firebase-init.js

const firebaseConfig = {
  apiKey: "AIzaSyB8bHVnt00N-H4VBgwsag4oRHBYVvf4q4Q",
  authDomain: "rep-royale.firebaseapp.com",
  projectId: "rep-royale",
  storageBucket: "rep-royale.appspot.com",
  messagingSenderId: "842201057109",
  appId: "1:842201057109:web:f2bb869900048bf84751dc",
  measurementId: "G-JSL641G4SJ"
};

// Initialize Firebase using the compat version
firebase.initializeApp(firebaseConfig);

// Expose auth and firestore globally
window.auth = firebase.auth();
window.db = firebase.firestore();

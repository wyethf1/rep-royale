//this is for my code
  const firebaseConfig = {
    apiKey: "AIzaSyB8bHVud00N-H4VBgwsag4oRHBYVvf4q4Q", // THIS IS YOUR ACTUAL API KEY
    authDomain: "rep-royale.firebaseapp.com",
    projectId: "rep-royale",
    storageBucket: "rep-royale.firebasestorage.app",
    messagingSenderId: "842201057109",
    appId: "1:842201057109:web:f2bb869900048bf84751dc",
    measurementId: "G-JSL641G4SJ" // This is for Google Analytics, leave if you want it
  };

  // Initialize Firebase using the compat syntax (matches the SDKs loaded in the <head>)
  firebase.initializeApp(firebaseConfig);
  window.auth = firebase.auth();
  window.db = firebase.firestore();

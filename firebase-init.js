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

firebase.initializeApp(firebaseConfig);
window.auth = firebase.auth();
window.db = firebase.firestore();

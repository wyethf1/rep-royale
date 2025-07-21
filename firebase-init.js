import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

const firebaseConfig = { ... };

try {
  const app = initializeApp(firebaseConfig);
  window.auth = getAuth(app);
  window.db = getFirestore(app);
  window.GoogleAuthProvider = GoogleAuthProvider;
  console.log('Firebase initialized successfully');
} catch (e) {
  console.error('Firebase initialization failed:', e);
}

// ... (Your existing Firebase imports and initialization go here - from the last working main.js)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js';
import {
    getAuth,
    GoogleAuthProvider,
    EmailAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
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
    serverTimestamp
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- START OF NEW CODE FOR DAILY QUOTE ---

const dailyBibleQuotes = [
  "I can do all things through Christ who strengthens me. - Philippians 4:13",
  "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life. - John 3:16",
  "The Lord is my shepherd; I shall not want. - Psalm 23:1",
  "Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go. - Joshua 1:9",
  "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight. - Proverbs 3:5-6",
  "But those who hope in the Lord will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint. - Isaiah 40:31",
  "For where two or three gather in my name, there am I with them. - Matthew 18:20",
  "And we know that in all things God works for the good of those who love him, who have been called according to his purpose. - Romans 8:28",
  "Come to me, all you who are weary and burdened, and I will give you rest. - Matthew 11:28",
  "The steadfast love of the Lord never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness. - Lamentations 3:22-23",
  "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up. - Galatians 6:9"
];

function displayDailyQuote() {
  const quoteDisplayElement = document.getElementById('dailyQuote');
  if (!quoteDisplayElement) {
    console.error('Daily quote display element not found.');
    return;
  }

  const today = new Date();
  const todayString = today.toDateString(); // e.g., "Mon Jul 21 2025"

  const storedQuoteData = localStorage.getItem('dailyBibleQuote');
  let currentQuote = null;
  let lastQuoteDate = null;

  if (storedQuoteData) {
    const parsedData = JSON.parse(storedQuoteData);
    currentQuote = parsedData.quote;
    lastQuoteDate = parsedData.date;
  }

  // Check if it's a new day or no quote is stored
  if (!currentQuote || lastQuoteDate !== todayString) {
    // Pick a new random quote
    const randomIndex = Math.floor(Math.random() * dailyBibleQuotes.length);
    currentQuote = dailyBibleQuotes[randomIndex];

    // Store the new quote and today's date
    localStorage.setItem('dailyBibleQuote', JSON.stringify({
      quote: currentQuote,
      date: todayString
    }));
  }

  quoteDisplayElement.textContent = currentQuote;
}

// --- END OF NEW CODE FOR DAILY QUOTE ---


window.addEventListener('DOMContentLoaded', () => {
  console.log('main.js loaded at', new Date().toLocaleString());

  const authSection = document.getElementById('authSection');
  const appSection = document.getElementById('appSection');
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const googleSignInBtn = document.getElementById('googleSignInBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const gainXpBtn = document.getElementById('gainXpBtn');
  const xpDisplay = document.getElementById('xpDisplay');
  const levelDisplay = document.getElementById('levelDisplay');
  const authError = document.getElementById('authError');
  const routineName = document.getElementById('routineName');
  const routineDetails = document.getElementById('routineDetails');
  const saveRoutineBtn = document.getElementById('saveRoutineBtn');
  const routineSelect = document.getElementById('routineSelect');
  const completeRoutineBtn = document.getElementById('completeRoutineBtn');
  const log = document.getElementById('log');
  const friendEmailInput = document.getElementById('friendEmailInput');
  const addFriendBtn = document.getElementById('addFriendBtn');
  const friendsList = document.getElementById('friendsList');

  if (!authSection || !appSection || !emailInput || !passwordInput || !loginBtn ||
      !registerBtn || !googleSignInBtn || !logoutBtn || !gainXpBtn || !xpDisplay ||
      !levelDisplay || !authError || !routineName || !routineDetails || !saveRoutineBtn ||
      !routineSelect || !completeRoutineBtn || !log || !friendEmailInput || !addFriendBtn ||
      !friendsList) {
    console.error('One or more DOM elements are missing.');
    if (authError) authError.textContent = 'App failed to load: Missing UI elements.';
    else alert('Critical error: App failed to load due to missing UI elements. Check console for details.');
    return;
  }

  let currentUser = null;
  let xp = 0;
  let routines = [];

  function showApp() {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
  }
  function showAuth() {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
  }

  // --- CALL THE NEW FUNCTION HERE ---
  displayDailyQuote(); // Display the quote when the DOM is loaded

  onAuthStateChanged(auth, user => {
    console.log('Auth state changed:', user ? user.uid : 'No user');
    if (user) {
      currentUser = user;
      showApp();
      loadUserData();
      loadRoutines();
      loadFriends();
    } else {
      currentUser = null;
      xp = 0;
      routines = [];
      updateXpDisplay();
      updateRoutineSelect();
      friendsList.innerHTML = '';
      showAuth();
    }
  });

  loginBtn.onclick = async () => {
    authError.textContent = '';
    try {
      await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
      logMessage('Logged in successfully');
    } catch (e) {
      console.error('Login error:', e);
      authError.textContent = e.message;
    }
  };

  registerBtn.onclick = async () => {
    authError.textContent = '';
    try {
      await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
      logMessage('Registered successfully');
    } catch (e) {
      console.error('Register error:', e);
      authError.textContent = e.message;
    }
  };

  googleSignInBtn.onclick = async () => {
    authError.textContent = '';
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      logMessage('Signed in with Google');
    } catch (e) {
      console.error('Google Sign-In error:', e);
      authError.textContent = e.message;
    }
  };

  logoutBtn.onclick = async () => {
    try {
      await signOut(auth);
      logMessage('Logged out');
    } catch (e) {
      console.error('Logout error:', e);
      authError.textContent = e.message;
    }
  };

  gainXpBtn.onclick = () => {
    if (!currentUser) {
      authError.textContent = 'Please log in to gain XP.';
      return;
    }
    xp += 10;
    updateXpDisplay();
    saveUserData();
    logMessage('Gained 10 XP from workout!');
  };

  saveRoutineBtn.onclick = async () => {
    if (!currentUser) {
      authError.textContent = 'Please log in to save routines.';
      return;
    }
    const name = routineName.value.trim();
    const details = routineDetails.value.trim();
    if (!name || !details) {
      logMessage('Please enter routine name and exercises.');
      return;
    }
    try {
      const routinesCollectionRef = collection(doc(collection(db, 'users'), currentUser.uid), 'routines');
      const routineRef = await addDoc(routinesCollectionRef, {
        name,
        details,
        createdAt: serverTimestamp()
      });
      routines.push({ id: routineRef.id, name, details });
      updateRoutineSelect();
      routineName.value = '';
      routineDetails.value = '';
      logMessage(`Routine "${name}" saved!`);
    } catch (e) {
      console.error('Error saving routine:', e);
      logMessage('Error saving routine.');
    }
  };

  completeRoutineBtn.onclick = async () => {
    if (!currentUser) {
      authError.textContent = 'Please log in to complete routines.';
      return;
    }
    const selectedRoutineId = routineSelect.value;
    if (!selectedRoutineId) {
      logMessage('Please select a routine.');
      return;
    }
    const routine = routines.find(r => r.id === selectedRoutineId);
    if (!routine) {
      logMessage('Selected routine not found.');
      return;
    }
    xp += 50;
    updateXpDisplay();
    saveUserData();
    logMessage(`Completed routine "${routine.name}"! Gained 50 XP.`);
  };

  function updateXpDisplay() {
    xpDisplay.textContent = `XP: ${xp}`;
    const level = Math.floor(xp / 100) + 1;
    const titles = ["Novice", "Rookie", "Warrior", "Veteran", "Beast", "Legend"];
    levelDisplay.textContent = `Level: ${level} — ${titles[Math.min(level - 1, titles.length - 1)]}`;
  }

  async function saveUserData() {
    if (!currentUser) return;
    try {
      const userDocRef = doc(collection(db, 'users'), currentUser.uid);
      await setDoc(userDocRef, { xp }, { merge: true });
    } catch (e) {
      console.error('Error saving user data:', e);
      logMessage('Error saving XP.');
    }
  }

  async function loadUserData() {
    if (!currentUser) return;
    try {
      const userDocRef = doc(collection(db, 'users'), currentUser.uid);
      const docSnapshot = await getDoc(userDocRef);
      if (docSnapshot.exists()) {
        xp = docSnapshot.data().xp || 0;
        updateXpDisplay();
      } else {
        xp = 0;
        updateXpDisplay();
        saveUserData();
      }
    } catch (e) {
      console.error('Error loading user data:', e);
      logMessage('Error loading XP.');
    }
  }

  async function loadRoutines() {
    if (!currentUser) return;
    try {
      const routinesCollectionRef = collection(doc(collection(db, 'users'), currentUser.uid), 'routines');
      const q = query(routinesCollectionRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      routines = querySnapshot.docs.map(docSnapshot => ({ id: docSnapshot.id, ...docSnapshot.data() }));
      updateRoutineSelect();
    } catch (e) {
      console.error('Error loading routines:', e);
      logMessage('Error loading routines.');
    }
  }

  function updateRoutineSelect() {
    routineSelect.innerHTML = '<option value="">-- Select Routine --</option>';
    routines.forEach(routine => {
      const option = document.createElement('option');
      option.value = routine.id;
      option.textContent = routine.name;
      routineSelect.appendChild(option);
    });
  }

  async function loadFriends() {
    if (!currentUser) return;
    try {
      const friendsCollectionRef = collection(doc(collection(db, 'users'), currentUser.uid), 'friends');
      const querySnapshot = await getDocs(friendsCollectionRef);
      friendsList.innerHTML = '';
      querySnapshot.forEach(docSnapshot => {
        const friend = docSnapshot.data();
        const div = document.createElement('div');
        div.className = 'friend';
        div.innerHTML = `<span>${friend.email}</span>`;
        friendsList.appendChild(div);
      });
    } catch (e) {
      console.error('Error loading friends:', e);
      logMessage('Error loading friends.');
    }
  };

  addFriendBtn.onclick = async () => {
    if (!currentUser) {
      authError.textContent = 'Please log in to add friends.';
      return;
    }
    const friendEmail = friendEmailInput.value.trim();
    if (!friendEmail) {
      logMessage('Please enter a friend’s email.');
      return;
    }
    try {
      const usersCollectionRef = collection(db, 'users');
      const q = query(usersCollectionRef, where('email', '==', friendEmail));
      const usersSnapshot = await getDocs(q);

      if (usersSnapshot.empty) {
        logMessage('No user found with that email.');
        return;
      }
      const friend = usersSnapshot.docs[0];

      const friendsSubCollectionRef = collection(doc(collection(db, 'users'), currentUser.uid), 'friends');
      const friendDocRef = doc(friendsSubCollectionRef, friend.id);
      await setDoc(friendDocRef, {
        email: friendEmail,
        addedAt: serverTimestamp()
      });
      loadFriends();
      friendEmailInput.value = '';
      logMessage(`Added friend: ${friendEmail}`);
    } catch (e) {
      console.error('Error adding friend:', e);
      logMessage('Error adding friend.');
    }
  };

  function logMessage(message) {
    const p = document.createElement('p');
    p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
  }
}); // End of DOMContentLoaded

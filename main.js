// main.js - This file should NOT have Firebase imports or initialization at the top.
// It should rely on firebase-init.js to set up window.auth, window.db, etc.

window.addEventListener('DOMContentLoaded', () => {
  console.log('main.js loaded at', new Date().toLocaleString());

  // Ensure Firebase auth and db are available from firebase-init.js
  // Now, we'll check for the specific functions that firebase-init.js should expose
  if (!window.auth || !window.db || !window.signInWithEmailAndPassword ||
      !window.createUserWithEmailAndPassword || !window.signInWithPopup ||
      !window.signOut || !window.onAuthStateChanged || !window.dbFunctions) {
    console.error('Firebase functions or instances not fully initialized. Check firebase-init.js and its exposure of functions to window.');
    const errorDiv = document.getElementById('authError');
    if (errorDiv) errorDiv.textContent = 'App initialization failed. Please try again later.';
    return;
  }

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
  const friendsList = document('friendsList'); // Typo here - should be getElementById

  if (!authSection || !appSection || !emailInput || !passwordInput || !loginBtn ||
      !registerBtn || !googleSignInBtn || !logoutBtn || !gainXpBtn || !xpDisplay ||
      !levelDisplay || !authError || !routineName || !routineDetails || !saveRoutineBtn ||
      !routineSelect || !completeRoutineBtn || !log || !friendEmailInput || !addFriendBtn ||
      !friendsList) {
    console.error('One or more DOM elements are missing.');
    authError.textContent = 'App failed to load: Missing UI elements.';
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

  // Use the global onAuthStateChanged function
  window.onAuthStateChanged(window.auth, user => { // Pass window.auth as the first argument
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
      // Use the global signInWithEmailAndPassword function
      await window.signInWithEmailAndPassword(window.auth, emailInput.value, passwordInput.value);
      logMessage('Logged in successfully');
    } catch (e) {
      console.error('Login error:', e);
      authError.textContent = e.message;
    }
  };

  registerBtn.onclick = async () => {
    authError.textContent = '';
    try {
      // Use the global createUserWithEmailAndPassword function
      await window.createUserWithEmailAndPassword(window.auth, emailInput.value, passwordInput.value);
      logMessage('Registered successfully');
    } catch (e) {
      console.error('Register error:', e);
      authError.textContent = e.message;
    }
  };

  googleSignInBtn.onclick = async () => {
    authError.textContent = '';
    try {
      const provider = new window.GoogleAuthProvider();
      // Use the global signInWithPopup function
      await window.signInWithPopup(window.auth, provider);
      logMessage('Signed in with Google');
    } catch (e) {
      console.error('Google Sign-In error:', e);
      authError.textContent = e.message;
    }
  };

  logoutBtn.onclick = async () => {
    try {
      // Use the global signOut function
      await window.signOut(window.auth);
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
      // Use dbFunctions
      const routinesCollectionRef = window.dbFunctions.collection(
        window.dbFunctions.doc(window.dbFunctions.collection(window.db, 'users'), currentUser.uid),
        'routines'
      );
      const routineRef = await window.dbFunctions.addDoc(routinesCollectionRef, {
        name,
        details,
        createdAt: window.dbFunctions.serverTimestamp() // Use serverTimestamp from dbFunctions
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
      const userDocRef = window.dbFunctions.doc(window.dbFunctions.collection(window.db, 'users'), currentUser.uid);
      await window.dbFunctions.setDoc(userDocRef, { xp }, { merge: true });
    } catch (e) {
      console.error('Error saving user data:', e);
      logMessage('Error saving XP.');
    }
  }

  async function loadUserData() {
    if (!currentUser) return;
    try {
      const userDocRef = window.dbFunctions.doc(window.dbFunctions.collection(window.db, 'users'), currentUser.uid);
      const doc = await window.dbFunctions.getDoc(userDocRef);
      if (doc.exists()) { // Call .exists() as a function
        xp = doc.data().xp || 0;
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
      const routinesCollectionRef = window.dbFunctions.collection(
        window.dbFunctions.doc(window.dbFunctions.collection(window.db, 'users'), currentUser.uid),
        'routines'
      );
      const q = window.dbFunctions.query(routinesCollectionRef, window.dbFunctions.orderBy('createdAt', 'desc'));
      const querySnapshot = await window.dbFunctions.getDocs(q);
      routines = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
      const friendsCollectionRef = window.dbFunctions.collection(
        window.dbFunctions.doc(window.dbFunctions.collection(window.db, 'users'), currentUser.uid),
        'friends'

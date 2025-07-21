window.addEventListener('DOMContentLoaded', () => {
  console.log('main.js loaded at', new Date().toLocaleString());
  if (!window.auth || !window.db) {
    console.error('Firebase auth or db not initialized. Check firebase-init.js.');
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
  const friendsList = document.getElementById('friendsList');

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

  window.auth.onAuthStateChanged(user => {
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
      await window.auth.signInWithEmailAndPassword(emailInput.value, passwordInput.value);
      logMessage('Logged in successfully');
    } catch (e) {
      console.error('Login error:', e);
      authError.textContent = e.message;
    }
  };

  registerBtn.onclick = async () => {
    authError.textContent = '';
    try {
      await window.auth.createUserWithEmailAndPassword(emailInput.value, passwordInput.value);
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
      await window.auth.signInWithPopup(provider);
      logMessage('Signed in with Google');
    } catch (e) {
      console.error('Google Sign-In error:', e);
      authError.textContent = e.message;
    }
  };

  logoutBtn.onclick = async () => {
    try {
      await window.auth.signOut();
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
      const routineRef = await window.db.collection('users').doc(currentUser.uid)
        .collection('routines').add({ name, details, createdAt: window.db.FieldValue.serverTimestamp() });
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
      await window.db.collection('users').doc(currentUser.uid).set({ xp }, { merge: true });
    } catch (e) {
      console.error('Error saving user data:', e);
      logMessage('Error saving XP.');
    }
  }

  async function loadUserData() {
    if (!currentUser) return;
    try {
      const doc = await window.db.collection('users').doc(currentUser.uid).get();
      if (doc.exists) {
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
      const querySnapshot = await window.db.collection('users').doc(currentUser.uid)
        .collection('routines').orderBy('createdAt', 'desc').get();
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
      const querySnapshot = await window.db.collection('users').doc(currentUser.uid)
        .collection('friends').get();
      friendsList.innerHTML = '';
      querySnapshot.forEach(doc => {
        const friend = doc.data();
        const div = document.createElement('div');
        div.className = 'friend';
        div.innerHTML = `<span>${friend.email}</span>`;
        friendsList.appendChild(div);
      });
    } catch (e) {
      console.error('Error loading friends:', e);
      logMessage('Error loading friends.');
    }
  }

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
      const usersSnapshot = await window.db.collection('users')
        .where('email', '==', friendEmail).get();
      if (usersSnapshot.empty) {
        logMessage('No user found with that email.');
        return;
      }
      const friend = usersSnapshot.docs[0];
      await window.db.collection('users').doc(currentUser.uid)
        .collection('friends').doc(friend.id).set({
          email: friendEmail,
          addedAt: window.db.FieldValue.serverTimestamp()
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
});

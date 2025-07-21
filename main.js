window.addEventListener('DOMContentLoaded', () => {
  // DOM elements
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

  // Validate DOM elements
  if (!authSection || !appSection || !emailInput || !passwordInput || !loginBtn ||
      !registerBtn || !googleSignInBtn || !logoutBtn || !gainXpBtn || !xpDisplay ||
      !levelDisplay || !authError || !routineName || !routineDetails || !saveRoutineBtn ||
      !routineSelect || !completeRoutineBtn || !log || !friendEmailInput || !addFriendBtn ||
      !friendsList) {
    console.error('One or more DOM elements are missing.');
    return;
  }

  // State
  let currentUser = null;
  let xp = 0;
  let routines = [];

  // Show/hide sections
  function showApp() {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
  }
  function showAuth() {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
  }

  // Auth state listener
  firebase.auth().onAuthStateChanged(user => {
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

  // Authentication
  loginBtn.onclick = async () => {
    authError.textContent = '';
    try {
      await firebase.auth().signInWithEmailAndPassword(emailInput.value, passwordInput.value);
    } catch (e) {
      authError.textContent = e.message;
    }
  };

  registerBtn.onclick = async () => {
    authError.textContent = '';
    try {
      await firebase.auth().createUserWithEmailAndPassword(emailInput.value, passwordInput.value);
    } catch (e) {
      authError.textContent = e.message;
    }
  };

  googleSignInBtn.onclick = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await firebase.auth().signInWithPopup(provider);
    } catch (e) {
      authError.textContent = e.message;
    }
  };

  logoutBtn.onclick = async () => {
    try {
      await firebase.auth().signOut();
    } catch (e) {
      authError.textContent = e.message;
    }
  };

  // XP and Levels
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

  function updateXpDisplay() {
    xpDisplay.textContent = `XP: ${xp}`;
    const level = Math.floor(xp / 100) + 1;
    const titles = ["Novice", "Rookie", "Warrior", "Veteran", "Beast", "Legend"];
    levelDisplay.textContent = `Level: ${level} — ${titles[Math.min(level - 1, titles.length - 1)]}`;
  }

  async function saveUserData() {
    if (!currentUser) return;
    try {
      await firebase.firestore().collection('users').doc(currentUser.uid).set({ xp }, { merge: true });
    } catch (e) {
      console.error('Error saving user data:', e);
      logMessage('Error saving XP.');
    }
  }

  async function loadUserData() {
    if (!currentUser) return;
    try {
      const doc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
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

  // Routines
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
      const routineRef = await firebase.firestore().collection('users').doc(currentUser.uid)
        .collection('routines').add({ name, details, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
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
    xp += 50; // Award more XP for completing a routine
    updateXpDisplay();
    saveUserData();
    logMessage(`Completed routine "${routine.name}"! Gained 50 XP.`);
  };

  async function loadRoutines() {
    if (!currentUser) return;
    try {
      const querySnapshot = await firebase.firestore().collection('users').doc(currentUser.uid)
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

  // Friends
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
      const usersSnapshot = await firebase.firestore().collection('users')
        .where('email', '==', friendEmail).get();
      if (usersSnapshot.empty) {
        logMessage('No user found with that email.');
        return;
      }
      const friend = usersSnapshot.docs[0];
      await firebase.firestore().collection('users').doc(currentUser.uid)
        .collection('friends').doc(friend.id).set({
          email: friendEmail,
          addedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      loadFriends();
      friendEmailInput.value = '';
      logMessage(`Added friend: ${friendEmail}`);
    } catch (e) {
      console.error('Error adding friend:', e);
      logMessage('Error adding friend.');
    }
  };

  async function loadFriends() {
    if (!currentUser) return;
    try {
      const querySnapshot = await firebase.firestore().collection('users').doc(currentUser.uid)
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

  // Logging
  function logMessage(message) {
    const p = document.createElement('p');
    p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
  }
});

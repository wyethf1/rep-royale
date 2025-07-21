window.addEventListener('DOMContentLoaded', () => {
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
  const saveRoutineBtn = document.getElementById('saveRoutineBtn');
  const completeRoutineBtn = document.getElementById('completeRoutineBtn');
  const routineNameInput = document.getElementById('routineName');
  const routineDetailsInput = document.getElementById('routineDetails');
  const routineSelect = document.getElementById('routineSelect');
  const log = document.getElementById('log');
  const addFriendBtn = document.getElementById('addFriendBtn');
  const friendEmailInput = document.getElementById('friendEmailInput');
  const friendsList = document.getElementById('friendsList');
  const authError = document.getElementById('authError');

  let currentUser = null;
  let xp = 0;

  const showApp = () => {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
  };

  const showAuth = () => {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
  };

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      showApp();
      loadUserData();
    } else {
      currentUser = null;
      showAuth();
    }
  });

  loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    firebase.auth().signInWithEmailAndPassword(email, password).catch(err => {
      authError.textContent = err.message;
    });
  });

  registerBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    firebase.auth().createUserWithEmailAndPassword(email, password).catch(err => {
      authError.textContent = err.message;
    });
  });

  googleSignInBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).catch(err => {
      authError.textContent = err.message;
    });
  });

  logoutBtn.addEventListener('click', () => {
    firebase.auth().signOut();
  });

  gainXpBtn.addEventListener('click', () => {
    xp += 10;
    updateXpDisplay();
    saveUserData();
  });

  const updateXpDisplay = () => {
    xpDisplay.textContent = `XP: ${xp}`;
    const level = Math.floor(xp / 100) + 1;
    const titles = ["Novice", "Rookie", "Warrior", "Veteran", "Beast", "Legend"];
    levelDisplay.textContent = `Level: ${level} — ${titles[level - 1] || "Max"}`;
  };

  const saveUserData = () => {
    if (!currentUser) return;
    firebase.firestore().collection('users').doc(currentUser.uid).set({ xp }, { merge: true });
  };

  const loadUserData = async () => {
    if (!currentUser) return;
    const doc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
    if (doc.exists) {
      xp = doc.data().xp || 0;
      updateXpDisplay();
    }
  };

  // Extend logic later with routines, friends, etc.
});

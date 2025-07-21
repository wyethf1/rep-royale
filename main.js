window.addEventListener('DOMContentLoaded', () => {
  // All your code here, e.g.:
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
  
  // State
  let currentUser = null;
  let xp = 0;

  // Show/hide sections
  function showApp() {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
  }
  function showAuth() {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
  }

  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      currentUser = user;
      showApp();
      loadUserData();
    } else {
      currentUser = null;
      showAuth();
    }
  });

  loginBtn.onclick = () => {
    authError.textContent = '';
    firebase.auth().signInWithEmailAndPassword(emailInput.value, passwordInput.value)
      .catch(e => authError.textContent = e.message);
  };

  registerBtn.onclick = () => {
    authError.textContent = '';
    firebase.auth().createUserWithEmailAndPassword(emailInput.value, passwordInput.value)
      .catch(e => authError.textContent = e.message);
  };

  googleSignInBtn.onclick = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider).catch(e => authError.textContent = e.message);
  };

  logoutBtn.onclick = () => {
    firebase.auth().signOut();
  };

  gainXpBtn.onclick = () => {
    xp += 10;
    updateXpDisplay();
    saveUserData();
  };

  function updateXpDisplay() {
    xpDisplay.textContent = `XP: ${xp}`;
    const level = Math.floor(xp / 100) + 1;
    const titles = ["Novice", "Rookie", "Warrior", "Veteran", "Beast", "Legend"];
    levelDisplay.textContent = `Level: ${level} — ${titles[level - 1] || "Max"}`;
  }

  function saveUserData() {
    if (!currentUser) return;
    firebase.firestore().collection('users').doc(currentUser.uid).set({ xp }, { merge: true });
  }

  async function loadUserData() {
    if (!currentUser) return;
    const doc = await firebase.firestore().collection('users').doc(currentUser.uid).get();
    if (doc.exists) {
      xp = doc.data().xp || 0;
      updateXpDisplay();
    }
  }
});

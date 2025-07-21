// main.js - This file now handles ALL Firebase imports and initialization.

// ALL Firebase imports come from here now
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
  storageBucket: "rep-royage.firebasestorage.app", // Corrected typo here, was 'rep-royale.firebasestorage.app'
  messagingSenderId: "842201057109",
  appId: "1:842201057109:web:f2bb869900048bf84751dc",
  measurementId: "G-JSL641G4SJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- START OF DAILY QUOTE LOGIC (unchanged from previous working version) ---
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
  const todayString = today.toDateString();

  const storedQuoteData = localStorage.getItem('dailyBibleQuote');
  let currentQuote = null;
  let lastQuoteDate = null;

  if (storedQuoteData) {
    const parsedData = JSON.parse(storedQuoteData);
    currentQuote = parsedData.quote;
    lastQuoteDate = parsedData.date;
  }

  if (!currentQuote || lastQuoteDate !== todayString) {
    const randomIndex = Math.floor(Math.random() * dailyBibleQuotes.length);
    currentQuote = dailyBibleQuotes[randomIndex];
    localStorage.setItem('dailyBibleQuote', JSON.stringify({
      quote: currentQuote,
      date: todayString
    }));
  }
  quoteDisplayElement.textContent = currentQuote;
}
// --- END OF DAILY QUOTE LOGIC ---


window.addEventListener('DOMContentLoaded', () => {
  console.log('main.js loaded at', new Date().toLocaleString());

  // Get DOM elements
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

  // New Routine Builder elements
  const routineNameInput = document.getElementById('routineName');
  const exerciseNameInput = document.getElementById('exerciseNameInput');
  const setsSlider = document.getElementById('setsSlider');
  const setsValueSpan = document.getElementById('setsValue');
  const repsSlider = document.getElementById('repsSlider');
  const repsValueSpan = document.getElementById('repsValue');
  const addExerciseBtn = document.getElementById('addExerciseBtn');
  const currentRoutineExercisesDiv = document.getElementById('currentRoutineExercises');
  const saveRoutineBtn = document.getElementById('saveRoutineBtn');

  // Existing Routine Selector & Friends
  const routineSelect = document.getElementById('routineSelect');
  const completeRoutineBtn = document.getElementById('completeRoutineBtn');
  const friendEmailInput = document.getElementById('friendEmailInput');
  const addFriendBtn = document.getElementById('addFriendBtn');
  const friendsList = document.getElementById('friendsList');

  // Basic DOM element existence check
  if (!authSection || !appSection || !emailInput || !passwordInput || !loginBtn ||
      !registerBtn || !googleSignInBtn || !logoutBtn || !gainXpBtn || !xpDisplay ||
      !levelDisplay || !authError || !routineNameInput || !exerciseNameInput ||
      !setsSlider || !setsValueSpan || !repsSlider || !repsValueSpan || !addExerciseBtn ||
      !currentRoutineExercisesDiv || !saveRoutineBtn || !routineSelect || !completeRoutineBtn ||
      !friendEmailInput || !addFriendBtn || !friendsList) {
    console.error('One or more DOM elements are missing. Please check index.html IDs.');
    if (authError) authError.textContent = 'App failed to load: Missing UI elements.';
    else alert('Critical error: App failed to load due to missing UI elements. Check console for details.');
    return;
  }

  let currentUser = null;
  let xp = 0;
  let routines = []; // Stores all user's saved routines
  let currentBuildingRoutine = []; // Temporary array for exercises being added to a new routine

  // --- UI Visibility Functions ---
  function showApp() {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
  }
  function showAuth() {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
  }

  // --- Initial Display Call ---
  displayDailyQuote(); // Display the quote when the DOM is loaded

  // --- Firebase Auth State Listener ---
  onAuthStateChanged(auth, user => {
    console.log('Auth state changed:', user ? user.uid : 'No user');
    if (user) {
      currentUser = user;
      showApp();
      loadUserData();
      loadRoutines();
      loadFriends();
      // Clear routine builder when user logs in/out
      clearRoutineBuilder();
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

  // --- Auth Button Handlers ---
  loginBtn.onclick = async () => {
    authError.textContent = '';
    try {
      await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
      console.log('Logged in successfully');
    } catch (e) {
      console.error('Login error:', e);
      authError.textContent = e.message;
    }
  };

  registerBtn.onclick = async () => {
    authError.textContent = '';
    try {
      await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
      console.log('Registered successfully');
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
      console.log('Signed in with Google');
    } catch (e) {
      console.error('Google Sign-In error:', e);
      authError.textContent = e.message;
    }
  };

  logoutBtn.onclick = async () => {
    try {
      await signOut(auth);
      console.log('Logged out');
    } catch (e) {
      console.error('Logout error:', e);
      authError.textContent = e.message;
    }
  };

  // --- XP & Level Logic ---
  gainXpBtn.onclick = () => {
    if (!currentUser) {
      authError.textContent = 'Please log in to gain XP.';
      return;
    }
    xp += 10;
    updateXpDisplay();
    saveUserData();
    console.log('Gained 10 XP from workout!');
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
      // No logMessage, rely on console error
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
        saveUserData(); // Create user data if it doesn't exist
      }
    } catch (e) {
      console.error('Error loading user data:', e);
    }
  }

  // --- Routine Builder Logic (NEW) ---

  // Update slider value displays
  setsSlider.oninput = () => {
    setsValueSpan.textContent = setsSlider.value;
  };
  repsSlider.oninput = () => {
    repsValueSpan.textContent = repsSlider.value;
  };

  addExerciseBtn.onclick = () => {
    const exerciseName = exerciseNameInput.value.trim();
    const sets = parseInt(setsSlider.value);
    const reps = parseInt(repsSlider.value);

    if (!exerciseName) {
      authError.textContent = 'Please enter an exercise name.';
      return;
    }

    currentBuildingRoutine.push({ name: exerciseName, sets, reps });
    renderCurrentBuildingRoutine();
    exerciseNameInput.value = ''; // Clear input
    setsSlider.value = 3; // Reset sliders to default
    setsValueSpan.textContent = 3;
    repsSlider.value = 8;
    repsValueSpan.textContent = 8;
    authError.textContent = ''; // Clear any previous error
    console.log(`Added exercise: ${exerciseName}, ${sets}x${reps}`);
  };

  function renderCurrentBuildingRoutine() {
    currentRoutineExercisesDiv.innerHTML = ''; // Clear previous list
    if (currentBuildingRoutine.length === 0) {
      currentRoutineExercisesDiv.innerHTML = '<p style="text-align: center; color: #666;">No exercises added yet.</p>';
      return;
    }

    currentBuildingRoutine.forEach((exercise, index) => {
      const div = document.createElement('div');
      div.className = 'routine-exercise-item';
      div.innerHTML = `
        <span>${exercise.name} - ${exercise.sets}x${exercise.reps}</span>
        <button data-index="${index}">Remove</button>
      `;
      currentRoutineExercisesDiv.appendChild(div);
    });

    // Add event listeners for remove buttons
    currentRoutineExercisesDiv.querySelectorAll('.routine-exercise-item button').forEach(button => {
      button.onclick = (event) => {
        const indexToRemove = parseInt(event.target.dataset.index);
        currentBuildingRoutine.splice(indexToRemove, 1);
        renderCurrentBuildingRoutine(); // Re-render the list
        console.log(`Removed exercise at index ${indexToRemove}`);
      };
    });
  }

  saveRoutineBtn.onclick = async () => {
    if (!currentUser) {
      authError.textContent = 'Please log in to save routines.';
      return;
    }
    const routineName = routineNameInput.value.trim();
    if (!routineName) {
      authError.textContent = 'Please enter a routine name.';
      return;
    }
    if (currentBuildingRoutine.length === 0) {
      authError.textContent = 'Please add at least one exercise to the routine.';
      return;
    }

    try {
      const routinesCollectionRef = collection(doc(collection(db, 'users'), currentUser.uid), 'routines');
      await addDoc(routinesCollectionRef, {
        name: routineName,
        exercises: currentBuildingRoutine, // Save the array of exercises
        createdAt: serverTimestamp()
      });
      console.log(`Routine "${routineName}" saved!`);
      authError.textContent = `Routine "${routineName}" saved!`; // Provide user feedback
      loadRoutines(); // Reload routines into the select dropdown
      clearRoutineBuilder(); // Clear the builder after saving
    } catch (e) {
      console.error('Error saving routine:', e);
      authError.textContent = 'Error saving routine.';
    }
  };

  function clearRoutineBuilder() {
      routineNameInput.value = '';
      exerciseNameInput.value = '';
      setsSlider.value = 3;
      setsValueSpan.textContent = 3;
      repsSlider.value = 8;
      repsValueSpan.textContent = 8;
      currentBuildingRoutine = []; // Clear the temporary array
      renderCurrentBuildingRoutine(); // Clear the display
      authError.textContent = ''; // Clear any messages
  }

  // --- Routine Selection & Completion Logic ---
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
    }
  }

  function updateRoutineSelect() {
    routineSelect.innerHTML = '<option value="">-- Select Routine --</option>';
    routines.forEach(routine => {
      const option = document.createElement('option');
      option.value = routine.id;
      option.textContent = routine.name; // Display only the routine name
      routineSelect.appendChild(option);
    });
  }

  completeRoutineBtn.onclick = async () => {
    if (!currentUser) {
      authError.textContent = 'Please log in to complete routines.';
      return;
    }
    const selectedRoutineId = routineSelect.value;
    if (!selectedRoutineId) {
      authError.textContent = 'Please select a routine to complete.';
      return;
    }
    const routine = routines.find(r => r.id === selectedRoutineId);
    if (!routine) {
      authError.textContent = 'Selected routine not found.';
      return;
    }
    xp += 50; // Award XP for completing a routine
    updateXpDisplay();
    saveUserData();
    authError.textContent = `Completed routine "${routine.name}"! Gained 50 XP.`; // User feedback
    console.log(`Completed routine "${routine.name}"! Gained 50 XP.`);
  };

  // --- Friends Logic ---
  async function loadFriends() {
    if (!currentUser) return;
    try {
      const friendsCollectionRef = collection(doc(collection(db, 'users'), currentUser.uid), 'friends');
      const querySnapshot = await getDocs(friendsCollectionRef);
      friendsList.innerHTML = '';
      if (querySnapshot.empty) {
          friendsList.innerHTML = '<p style="text-align: center; color: #666;">No friends added yet.</p>';
      }
      querySnapshot.forEach(docSnapshot => {
        const friend = docSnapshot.data();
        const div = document.createElement('div');
        div.className = 'friend';
        div.innerHTML = `<span>${friend.email}</span>`;
        friendsList.appendChild(div);
      });
    } catch (e) {
      console.error('Error loading friends:', e);
    }
  }

  addFriendBtn.onclick = async () => {
    if (!currentUser) {
      authError.textContent = 'Please log in to add friends.';
      return;
    }
    const friendEmail = friendEmailInput.value.trim();
    if (!friendEmail) {
      authError.textContent = 'Please enter a friend’s email.';
      return;
    }
    // Prevent adding self as friend
    if (currentUser.email && friendEmail.toLowerCase() === currentUser.email.toLowerCase()) {
        authError.textContent = 'You cannot add yourself as a friend.';
        return;
    }

    try {
      const usersCollectionRef = collection(db, 'users');
      const q = query(usersCollectionRef, where('email', '==', friendEmail));
      const usersSnapshot = await getDocs(q);

      if (usersSnapshot.empty) {
        authError.textContent = 'No user found with that email.';
        return;
      }
      const friend = usersSnapshot.docs[0];

      // Check if friend is already added
      const existingFriendRef = doc(collection(doc(collection(db, 'users'), currentUser.uid), 'friends'), friend.id);
      const existingFriendDoc = await getDoc(existingFriendRef);
      if (existingFriendDoc.exists()) {
          authError.textContent = `${friendEmail} is already your friend.`;
          return;
      }

      const friendsSubCollectionRef = collection(doc(collection(db, 'users'), currentUser.uid), 'friends');
      const friendDocRef = doc(friendsSubCollectionRef, friend.id);
      await setDoc(friendDocRef, {
        email: friendEmail,
        addedAt: serverTimestamp()
      });
      loadFriends();
      friendEmailInput.value = '';
      authError.textContent = `Added friend: ${friendEmail}`;
      console.log(`Added friend: ${friendEmail}`);
    } catch (e) {
      console.error('Error adding friend:', e);
      authError.textContent = 'Error adding friend.';
    }
  };

}); // End of DOMContentLoaded

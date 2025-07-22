// main.js

// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js"; // Removed EmailAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword
import { getFirestore, doc, setDoc, getDoc, collection, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js";

// Your Firebase configuration (REPLACE WITH YOUR ACTUAL CONFIG)
const firebaseConfig = {
    apiKey: "AIzaSyB8bHVud00N-H4VBgwsag4oRHBYVvf4q4Q", // Use your actual API Key
    authDomain: "rep-royale.firebaseapp.com",
    projectId: "rep-royale",
    storageBucket: "rep-royale.firebasestorage.app",
    messagingSenderId: "842201057109",
    appId: "1:842201057109:web:f2bb869900048bf84751dc",
    // databaseURL and measurementId might not be strictly necessary for basic auth/firestore but keep if you use them elsewhere
    // databaseURL: "https://rep-royale-default-rtdb.firebaseio.com",
    // measurementId: "G-JSL641G4SJ"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// --- DOM Elements (UPDATED FOR NEW UI STRUCTURE) ---

// General App Sections
const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');

// Header Elements
const quoteText = document.getElementById('quoteText');
const quoteReference = document.getElementById('quoteReference');

// Auth Section Elements
// const emailInput = document.getElementById('emailInput'); // Removed
// const passwordInput = document.getElementById('passwordInput'); // Removed
const authError = document.getElementById('authError');
// const loginBtn = document.getElementById('loginBtn'); // Removed // THIS WAS THE PROBLEM LINE IF IT WAS STILL PRESENT
// const registerBtn = document.getElementById('registerBtn'); // Removed // THIS WAS THE PROBLEM LINE IF IT WAS STILL PRESENT
const googleSignInBtn = document.getElementById('googleSignInBtn');

// Footer Navigation Elements
const xpDisplay = document.getElementById('xpDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const logoutBtn = document.getElementById('logoutBtn'); // Now in footer
const showFriendsBtn = document.getElementById('showFriendsBtn');
const showRoutinesBtn = document.getElementById('showRoutinesBtn');

// Views (New UI concept)
const routineDashboardView = document.getElementById('routineDashboardView');
const routineBuilderView = document.getElementById('routineBuilderView');
const friendsView = document.getElementById('friendsView');

// Routine Dashboard View Elements
const routineSelect = document.getElementById('routineSelect'); // For selecting saved routines
const dashboardRoutineName = document.getElementById('dashboardRoutineName');
const dashboardExercises = document.getElementById('dashboardExercises');
const completeRoutineBtn = document.getElementById('completeRoutineBtn');
const editRoutineBtn = document.getElementById('editRoutineBtn');
const createRoutineBtn = document.getElementById('createRoutineBtn');

// Routine Builder View Elements
const builderRoutineNameInput = document.getElementById('builderRoutineName'); // Input for current routine name
const exerciseNameInput = document.getElementById('exerciseNameInput');
const setsSlider = document.getElementById('setsSlider');
const setsValue = document.getElementById('setsValue');
const repsSlider = document.getElementById('repsSlider');
const repsValue = document.getElementById('repsValue');
const addExerciseBtn = document.getElementById('addExerciseBtn');
const currentRoutineExercises = document.getElementById('currentRoutineExercises'); // List for exercises being built
const saveRoutineBtn = document.getElementById('saveRoutineBtn');
const backToDashboardBtn = document.getElementById('backToDashboardBtn');

// Friends View Elements
const friendEmailInput = document.getElementById('friendEmailInput');
const addFriendBtn = document.getElementById('addFriendBtn');
const friendsList = document.getElementById('friendsList');

// --- Global Variables ---
let currentUser = null;
let userDocRef = null;
let currentRoutine = { name: '', exercises: [] }; // The routine currently loaded in builder or dashboard
let userXP = 0;
let userLevel = 1;
let userRoutines = [];
let userFriends = []; // Stores user's friends (e.g., their emails)

// Dummy Bible Quotes (for daily display, as a fallback or for development)
const bibleQuotes = [
    { text: "I can do all things through Christ who strengthens me.", reference: "Philippians 4:13" },
    { text: "For by grace you have been saved through faith. And this is not your own doing; it is the gift of God, not a result of works, so that no one may boast.", reference: "Ephesians 2:8-9" },
    { text: "Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.", reference: "Joshua 1:9" },
    { text: "But they who wait for the Lord shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.", reference: "Isaiah 40:31" },
    { text: "Do not be conformed to this world, but be transformed by the renewal of your mind, that by testing you may discern what is the will of God, what is good and acceptable and perfect.", reference: "Romans 12:2" },
    { text: "The Lord is my strength and my shield; in him my heart trusts, and I am helped; my heart exults, and with my song I give thanks to him.", reference: "Psalm 28:7" },
    { text: "For God gave us a spirit not of fear but of power and love and self-control.", reference: "2 Timothy 1:7" },
    { text: "Therefore, my beloved brothers, be steadfast, immovable, always abounding in the work of the Lord, knowing that in the Lord your labor is not in vain.", reference: "1 Corinthians 15:58" },
    { text: "Trust in the Lord with all your heart, and do not lean on your own understanding.", reference: "Proverbs 3:5" },
    { text: "And whatever you do, in word or deed, do everything in the name of the Lord Jesus, giving thanks to God the Father through him.", reference: "Colossians 3:17" }
];


// --- UI / View Management Functions ---

// Function to hide all views and show the active one
function showView(viewId) {
    routineDashboardView.classList.add('hidden');
    routineBuilderView.classList.add('hidden');
    friendsView.classList.add('hidden');

    document.getElementById(viewId).classList.remove('hidden');
}

// --- Data Functions (Firebase Interaction) ---

// Function to fetch daily Bible quote (using external API as discussed)
async function fetchDailyQuote() {
    try {
        const response = await fetch('https://beta.ourmanna.com/api/v1/get?format=json&order=daily');
        const data = await response.json();
        if (data.results && data.results.verses && data.results.verses.length > 0) {
            const verse = data.results.verses[0];
            quoteText.textContent = `"${verse.text}"`;
            quoteReference.textContent = `- ${verse.book.name} ${verse.chapter}.${verse.verse}`;
        } else {
            // Fallback to local quotes if API fails
            const randomIndex = Math.floor(Math.random() * bibleQuotes.length);
            const selectedQuote = bibleQuotes[randomIndex];
            quoteText.textContent = `"${selectedQuote.text}"`;
            quoteReference.textContent = `- ${selectedQuote.reference}`;
        }
    } catch (error) {
        console.error("Error fetching daily quote:", error);
        // Fallback to local quotes on error
        const randomIndex = Math.floor(Math.random() * bibleQuotes.length);
        const selectedQuote = bibleQuotes[randomIndex];
        quoteText.textContent = `"${selectedQuote.text}"`;
        quoteReference.textContent = `- ${selectedQuote.reference}`;
    }
}

// Function to update user data in Firestore
async function updateUserData(data) {
    if (userDocRef) {
        try {
            await setDoc(userDocRef, data, { merge: true }); // Use setDoc with merge to only update provided fields
            console.log("User data updated:", data);
        } catch (error) {
            console.error("Error updating user data:", error);
        }
    }
}

// Function to get user data from Firestore
async function getUserData() {
    if (userDocRef) {
        try {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                userXP = data.xp || 0;
                userLevel = data.level || 1;
                userRoutines = data.routines || [];
                userFriends = data.friends || [];
                updateXPDisplay();
                loadRoutinesIntoSelect(); // Populate routines in dashboard dropdown
                displayFriends(); // Populate friends list

                // If no routine is selected, try to load the first available routine into the dashboard
                if (userRoutines.length > 0 && !routineSelect.value) {
                    const firstRoutine = userRoutines[0];
                    displayRoutine(firstRoutine.name, firstRoutine.exercises);
                    routineSelect.value = firstRoutine.name; // Set the dropdown to the loaded routine
                    currentRoutine = { ...firstRoutine }; // Also set currentRoutine for dashboard
                } else if (userRoutines.length === 0) {
                     // If no routines exist, clear dashboard display
                     displayRoutine('', []);
                }


            } else {
                console.log("No user data found, creating new profile.");
                // Initialize new user data in Firestore
                await setDoc(userDocRef, {
                    xp: 0,
                    level: 1,
                    routines: [],
                    friends: [],
                    email: currentUser.email // Save email for friend lookup
                });
                userXP = 0;
                userLevel = 1;
                userRoutines = [];
                userFriends = [];
                updateXPDisplay();
                displayRoutine('', []); // Clear dashboard display for new user
            }
        } catch (error) {
            console.error("Error getting user data:", error);
            authError.textContent = "Error loading user data. Please try again.";
        }
    }
}

// --- UI Update Functions ---

function updateXPDisplay() {
    xpDisplay.textContent = `XP: ${userXP}`;
    const levelName = getLevelName(userLevel);
    levelDisplay.textContent = `Level: ${userLevel} — ${levelName}`;
}

function getLevelName(level) {
    if (level < 5) return "Novice";
    if (level < 10) return "Apprentice";
    if (level < 15) return "Journeyman";
    if (level < 20) return "Expert";
    return "Master";
}

function displayRoutine(routineName, exercises) {
    dashboardRoutineName.textContent = routineName || 'No Routine Loaded';
    dashboardExercises.innerHTML = '';
    if (exercises && exercises.length > 0) {
        exercises.forEach((exercise) => {
            const item = document.createElement('div');
            item.classList.add('routine-exercise-item');
            item.innerHTML = `
                <span>${exercise.name}: ${exercise.sets} sets of ${exercise.reps} reps</span>
            `;
            dashboardExercises.appendChild(item);
        });
        completeRoutineBtn.disabled = false;
    } else {
        dashboardExercises.innerHTML = '<p style="text-align: center; color: #777;">No exercises in this routine.</p>';
        completeRoutineBtn.disabled = true;
    }
}

function populateCurrentRoutineExercises(exercises) {
    currentRoutineExercises.innerHTML = '';
    if (exercises && exercises.length > 0) {
        exercises.forEach((exercise, index) => {
            const item = document.createElement('div');
            item.classList.add('routine-exercise-item');
            item.innerHTML = `
                <span>${exercise.name}: ${exercise.sets} sets of ${exercise.reps} reps</span>
                <button data-index="${index}">Remove</button>
            `;
            item.querySelector('button').addEventListener('click', (e) => removeExerciseFromCurrentRoutine(e.target.dataset.index));
            currentRoutineExercises.appendChild(item);
        });
    } else {
        currentRoutineExercises.innerHTML = '<p style="text-align: center; color: #777;">No exercises added yet.</p>';
    }
}

function loadRoutinesIntoSelect() {
    routineSelect.innerHTML = '<option value="">-- Select Routine --</option>';
    userRoutines.forEach(routine => {
        const option = document.createElement('option');
        option.value = routine.name;
        option.textContent = routine.name;
        routineSelect.appendChild(option);
    });
}

function displayFriends() {
    friendsList.innerHTML = '';
    if (userFriends && userFriends.length > 0) {
        userFriends.forEach(friend => {
            const item = document.createElement('div');
            item.classList.add('friend-item');
            item.innerHTML = `<span>${friend.email}</span>`; // Assuming friend is just email for now
            friendsList.appendChild(item);
        });
    } else {
        friendsList.innerHTML = '<p style="text-align: center; color: #777;">No friends added yet.</p>';
    }
}

// --- Core App Logic ---

// Routine Management
function addExerciseToCurrentRoutine() {
    const name = exerciseNameInput.value.trim();
    const sets = parseInt(setsSlider.value);
    const reps = parseInt(repsSlider.value);

    if (name && sets > 0 && reps > 0) {
        currentRoutine.exercises.push({ name, sets, reps });
        populateCurrentRoutineExercises(currentRoutine.exercises);
        exerciseNameInput.value = ''; // Clear input
        setsSlider.value = 3; // Reset sliders
        repsSlider.value = 10;
        setsValue.textContent = 3;
        repsValue.textContent = 10;
    } else {
        alert('Please enter exercise name, sets, and reps.');
    }
}

function removeExerciseFromCurrentRoutine(index) {
    currentRoutine.exercises.splice(index, 1);
    populateCurrentRoutineExercises(currentRoutine.exercises);
}

async function saveRoutine() {
    const routineName = builderRoutineNameInput.value.trim();
    if (!routineName) {
        alert('Please enter a routine name.');
        return;
    }
    if (currentRoutine.exercises.length === 0) {
        alert('Please add at least one exercise to the routine.');
        return;
    }

    const newRoutine = { name: routineName, exercises: currentRoutine.exercises };

    // Check if routine already exists (for editing)
    const existingIndex = userRoutines.findIndex(r => r.name === routineName);
    if (existingIndex !== -1) {
        userRoutines[existingIndex] = newRoutine; // Update existing
        alert(`Routine "${routineName}" updated!`);
    } else {
        userRoutines.push(newRoutine); // Add new
        alert(`Routine "${routineName}" saved!`);
    }

    await updateUserData({ routines: userRoutines });
    loadRoutinesIntoSelect(); // Reload dashboard select
    displayRoutine(newRoutine.name, newRoutine.exercises); // Show the saved routine on dashboard
    routineSelect.value = newRoutine.name; // Select the newly saved routine in the dropdown
    showView('routineDashboardView'); // Go back to dashboard
    currentRoutine = { name: '', exercises: [] }; // Clear builder state
    builderRoutineNameInput.value = '';
    populateCurrentRoutineExercises([]); // Clear builder list
}

async function completeRoutine() {
    if (!currentRoutine || !currentRoutine.name) {
        alert("Please select a routine to complete.");
        return;
    }
    userXP += 50; // Example XP gain
    // Level calculation (adjust as needed for desired progression)
    userLevel = Math.floor(userXP / 100) + 1; // 100 XP per level

    await updateUserData({ xp: userXP, level: userLevel });
    updateXPDisplay();
    alert(`Routine "${currentRoutine.name}" completed! You gained 50 XP!`);
}

// Friend Management
async function addFriend() {
    const friendEmail = friendEmailInput.value.trim();
    if (!friendEmail || friendEmail === currentUser.email) {
        alert('Please enter a valid friend email.');
        return;
    }

    if (userFriends.some(f => f.email === friendEmail)) {
        alert('This user is already your friend!');
        return;
    }

    // In a real app, you'd check if this email exists as a user in your database
    // For now, we'll just add it to the current user's friend list.
    userFriends.push({ email: friendEmail }); // Store friend's email
    await updateUserData({ friends: userFriends });
    displayFriends();
    friendEmailInput.value = '';
    alert(`${friendEmail} added to your friends!`);
}


// --- Authentication Handlers ---

// Removed email/password login and register event listeners


googleSignInBtn.addEventListener('click', async () => {
    authError.textContent = '';
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error) {
        authError.textContent = error.message;
    }
});

logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out:", error);
    }
});

// --- Event Listeners for NEW UI Elements ---

setsSlider.addEventListener('input', () => {
    setsValue.textContent = setsSlider.value;
});

repsSlider.addEventListener('input', () => {
    repsValue.textContent = repsSlider.value;
});

addExerciseBtn.addEventListener('click', addExerciseToCurrentRoutine);
saveRoutineBtn.addEventListener('click', saveRoutine);
addFriendBtn.addEventListener('click', addFriend);
completeRoutineBtn.addEventListener('click', completeRoutine);


// View Navigation Buttons
showFriendsBtn.addEventListener('click', () => showView('friendsView'));
showRoutinesBtn.addEventListener('click', () => showView('routineDashboardView')); // This will show dashboard
backToDashboardBtn.addEventListener('click', () => showView('routineDashboardView'));

editRoutineBtn.addEventListener('click', () => {
    const selectedRoutineName = routineSelect.value;
    if (selectedRoutineName) {
        const routineToEdit = userRoutines.find(r => r.name === selectedRoutineName);
        if (routineToEdit) {
            currentRoutine = { ...routineToEdit }; // Clone to avoid direct mutation
            builderRoutineNameInput.value = currentRoutine.name;
            populateCurrentRoutineExercises(currentRoutine.exercises);
            showView('routineBuilderView');
        } else {
            alert('Selected routine not found.');
        }
    } else {
        alert('Please select a routine to edit or create a new one.');
    }
});

createRoutineBtn.addEventListener('click', () => {
    currentRoutine = { name: '', exercises: [] }; // Reset for new routine
    builderRoutineNameInput.value = '';
    populateCurrentRoutineExercises([]);
    showView('routineBuilderView');
});

routineSelect.addEventListener('change', () => {
    const selectedRoutineName = routineSelect.value;
    if (selectedRoutineName) {
        const selectedRoutine = userRoutines.find(r => r.name === selectedRoutineName);
        if (selectedRoutine) {
            currentRoutine = { ...selectedRoutine }; // Load into currentRoutine for dashboard display
            displayRoutine(selectedRoutine.name, selectedRoutine.exercises);
        }
    } else {
        dashboardRoutineName.textContent = 'No Routine Loaded';
        dashboardExercises.innerHTML = '<p style="text-align: center; color: #777;">Select or create a routine to see exercises.</p>';
        completeRoutineBtn.disabled = true;
        currentRoutine = { name: '', exercises: [] }; // Clear current routine if nothing selected
    }
});


// --- Authentication State Observer ---

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        userDocRef = doc(db, "users", user.uid); // Reference to the user's document in Firestore
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        await getUserData(); // Fetch user data and populate UI
        showView('routineDashboardView'); // Default to dashboard after login
    } else {
        currentUser = null;
        userDocRef = null;
        authSection.classList.remove('hidden');
        appSection.classList.add('hidden');
        // Clear any app data displays on logout
        xpDisplay.textContent = 'XP: 0';
        levelDisplay.textContent = 'Level: 1 — Novice';
        routineSelect.innerHTML = '<option value="">-- Select Routine --</option>';
        dashboardRoutineName.textContent = 'No Routine Loaded';
        dashboardExercises.innerHTML = '<p style="text-align: center; color: #777;">Select or create a routine to see exercises.</p>';
        completeRoutineBtn.disabled = true;
        builderRoutineNameInput.value = '';
        currentRoutineExercises.innerHTML = '<p style="text-align: center; color: #777;">No exercises added yet.</p>';
        friendsList.innerHTML = '<p style="text-align: center; color: #777;">No friends added yet.</p>';
        // Clear current routine state
        currentRoutine = { name: '', exercises: [] };
    }
});

// Initial load: Fetch daily quote
fetchDailyQuote();

// main.js

// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";
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

// --- DOM Elements ---

// General App Sections
const authSection = document.getElementById('authSection');
const appSection = document.getElementById('appSection');
const bottomNav = document.getElementById('bottomNav');

// Header Elements
const dailyQuoteElement = document.getElementById('dailyQuote'); // Renamed from quoteText for consistency
const quoteReferenceElement = document.getElementById('quoteReference'); // Renamed from quoteReference

// Auth Section Elements
const authError = document.getElementById('authError');
const googleSignInBtn = document.getElementById('googleSignInBtn');

// Footer Navigation Elements (renamed to match index.html buttons if they are for nav)
const friendsNavItem = document.getElementById('friendsNavItem'); // Changed from showFriendsBtn
const routinesNavItem = document.getElementById('routinesNavItem'); // Changed from showRoutinesBtn
const settingsNavItem = document.getElementById('settingsNavItem'); // NEW: Settings nav item
const logoutNavItem = document.getElementById('logoutNavItem'); // Changed from logoutBtn
const xpDisplay = document.getElementById('xpDisplay');
const levelDisplay = document.getElementById('levelDisplay');


// Views
const routineDashboardView = document.getElementById('routineDashboardView');
const routineBuilderView = document.getElementById('routineBuilderView');
const friendsView = document.getElementById('friendsView');
const settingsView = document.getElementById('settingsView'); // NEW: Settings View

// Routine Dashboard View Elements
const routineSelect = document.getElementById('routineSelect');
const dashboardRoutineName = document.getElementById('currentRoutineDisplay'); // Adjusted to match current index.html
const dashboardExercises = document.getElementById('dashboardExerciseList'); // Adjusted to match current index.html
const completeRoutineBtn = document.getElementById('completeRoutineBtn');
const editRoutineBtn = document.getElementById('editRoutineBtn');
const createRoutineBtn = document.getElementById('createRoutineBtn');

// Routine Builder View Elements
const builderRoutineNameInput = document.getElementById('routineName'); // Adjusted to match current index.html
const exerciseNameInput = document.getElementById('exerciseName'); // Adjusted to match current index.html
const setsInput = document.getElementById('sets'); // Changed from setsSlider
const repsInput = document.getElementById('reps'); // Changed from repsSlider
const addExerciseBtn = document.getElementById('addExerciseBtn');
const currentRoutineExercises = document.getElementById('builderExerciseList'); // Adjusted to match current index.html
const saveRoutineBtn = document.getElementById('saveRoutineBtn');
const deleteRoutineBtn = document.getElementById('deleteRoutineBtn'); // Added from index.html (if you plan to implement)

// Friends View Elements
const addFriendInput = document.getElementById('addFriendInput'); // Changed from friendEmailInput
const addFriendBtn = document.getElementById('addFriendBtn');
const friendsList = document.getElementById('myFriendsList'); // Changed from friendsList

// Settings Elements
const quoteTypeSelect = document.getElementById('quoteType'); // NEW: Quote type select dropdown

// --- Global Variables ---
let currentUser = null;
let userDocRef = null;
let currentRoutine = { name: '', exercises: [] };
let userXP = 0;
let userLevel = 1;
let userRoutines = [];
let userFriends = [];

// --- Quote Data ---
// Dummy Bible Quotes (used as fallback or when API is not preferred)
const bibleQuotes = [
    { quote: "I can do all things through Christ who strengthens me.", reference: "Philippians 4:13" },
    { quote: "For by grace you have been saved through faith. And this is not your own doing; it is the gift of God, not a result of works, so that no one may boast.", reference: "Ephesians 2:8-9" },
    { quote: "Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.", reference: "Joshua 1:9" },
    { quote: "But they who wait for the Lord shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.", reference: "Isaiah 40:31" },
    { quote: "Do not be conformed to this world, but be transformed by the renewal of your mind, that by testing you may discern what is the will of God, what is good and acceptable and perfect.", reference: "Romans 12:2" },
    { quote: "The Lord is my strength and my shield; in him my heart trusts, and I am helped; my heart exults, and with my song I give thanks to him.", reference: "Psalm 28:7" },
    { quote: "For God gave us a spirit not of fear but of power and love and self-control.", reference: "2 Timothy 1:7" },
    { quote: "Therefore, my beloved brothers, be steadfast, immovable, always abounding in the work of the Lord, knowing that in the Lord your labor is not in vain.", reference: "1 Corinthians 15:58" },
    { quote: "Trust in the Lord with all your heart, and do not lean on your own understanding.", reference: "Proverbs 3:5" },
    { quote: "And whatever you do, in word or deed, do everything in the name of the Lord Jesus, giving thanks to God the Father through him.", reference: "Colossians 3:17" }
];

// NEW: Inspirational Quotes
const inspirationalQuotes = [
    { quote: "The only way to do great work is to love what you do.", reference: "Steve Jobs" },
    { quote: "Believe you can and you're halfway there.", reference: "Theodore Roosevelt" },
    { quote: "The future belongs to those who believe in the beauty of their dreams.", reference: "Eleanor Roosevelt" },
    { quote: "Strive not to be a success, but rather to be of value.", reference: "Albert Einstein" },
    { quote: "The best way to predict the future is to create it.", reference: "Peter Drucker" },
    { quote: "Success is not final, failure is not fatal: It is the courage to continue that counts.", reference: "Winston Churchill" },
    { quote: "The mind is everything. What you think you become.", reference: "Buddha" },
    { quote: "It always seems impossible until it's done.", reference: "Nelson Mandela" },
    { quote: "The expert in anything was once a beginner.", reference: "Helen Hayes" },
    { quote: "Your time is limited, so don't waste it living someone else's life.", reference: "Steve Jobs" }
];

// NEW: Current quote type preference, loaded from localStorage or defaults to 'bible'
let currentQuoteType = localStorage.getItem('quoteType') || 'bible';


// --- UI / View Management Functions ---

// Function to hide all views and show the active one
function showView(viewId) {
    routineDashboardView.classList.add('hidden');
    routineBuilderView.classList.add('hidden');
    friendsView.classList.add('hidden');
    settingsView.classList.add('hidden'); // NEW: Hide settings view

    document.getElementById(viewId).classList.remove('hidden');

    // Update active state of nav items
    friendsNavItem.classList.remove('active');
    routinesNavItem.classList.remove('active');
    settingsNavItem.classList.remove('active'); // NEW: Remove active from settings

    if (viewId === 'routineDashboardView') {
        routinesNavItem.classList.add('active');
        updateDailyQuoteDisplay(); // Call new function to display quote
    } else if (viewId === 'friendsView') {
        friendsNavItem.classList.add('active');
    } else if (viewId === 'settingsView') { // NEW: Handle settings view active state
        settingsNavItem.classList.add('active');
    }
    // No active state for builder view as it's typically accessed from dashboard
}

// NEW: Function to update the daily quote display based on selected type
async function updateDailyQuoteDisplay() {
    if (currentQuoteType === 'bible') {
        try {
            const response = await fetch('https://beta.ourmanna.com/api/v1/get?format=json&order=daily');
            const data = await response.json();
            if (data.results && data.results.verses && data.results.verses.length > 0) {
                const verse = data.results.verses[0];
                dailyQuoteElement.textContent = `"${verse.text}"`;
                quoteReferenceElement.textContent = `- ${verse.book.name} ${verse.chapter}.${verse.verse}`;
            } else {
                // Fallback to local bible quotes if API fails
                const randomIndex = Math.floor(Math.random() * bibleQuotes.length);
                const selectedQuote = bibleQuotes[randomIndex];
                dailyQuoteElement.textContent = `"${selectedQuote.quote}"`; // Use .quote here for consistency
                quoteReferenceElement.textContent = `- ${selectedQuote.reference}`;
            }
        } catch (error) {
            console.error("Error fetching daily Bible quote from API:", error);
            // Fallback to local bible quotes on error
            const randomIndex = Math.floor(Math.random() * bibleQuotes.length);
            const selectedQuote = bibleQuotes[randomIndex];
            dailyQuoteElement.textContent = `"${selectedQuote.quote}"`; // Use .quote here for consistency
            quoteReferenceElement.textContent = `- ${selectedQuote.reference}`;
        }
    } else if (currentQuoteType === 'inspirational') {
        const randomIndex = Math.floor(Math.random() * inspirationalQuotes.length);
        const selectedQuote = inspirationalQuotes[randomIndex];
        dailyQuoteElement.textContent = `"${selectedQuote.quote}"`;
        quoteReferenceElement.textContent = `- ${selectedQuote.reference}`;
    }
}


// --- Data Functions (Firebase Interaction) ---

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
                // NEW: Load quote type from user data or use existing localStorage value
                currentQuoteType = data.quoteType || localStorage.getItem('quoteType') || 'bible';
                localStorage.setItem('quoteType', currentQuoteType); // Ensure localStorage is in sync

                updateXPDisplay();
                loadRoutinesIntoSelect();
                displayFriends();

                // Initialize the quoteTypeSelect with the loaded preference
                if (quoteTypeSelect) {
                    quoteTypeSelect.value = currentQuoteType;
                }

                // If no routine is selected, try to load the first available routine into the dashboard
                if (userRoutines.length > 0 && !routineSelect.value) {
                    const firstRoutine = userRoutines[0];
                    displayRoutine(firstRoutine.name, firstRoutine.exercises);
                    routineSelect.value = firstRoutine.name;
                    currentRoutine = { ...firstRoutine };
                } else if (userRoutines.length === 0) {
                     displayRoutine('', []);
                }


            } else {
                console.log("No user data found, creating new profile.");
                // Initialize new user data in Firestore including default quoteType
                await setDoc(userDocRef, {
                    xp: 0,
                    level: 1,
                    routines: [],
                    friends: [],
                    email: currentUser.email,
                    quoteType: currentQuoteType // Save default quote type
                });
                userXP = 0;
                userLevel = 1;
                userRoutines = [];
                userFriends = [];
                updateXPDisplay();
                displayRoutine('', []);
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
            item.innerHTML = `<span>${friend.email}</span>`;
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
    const sets = parseInt(setsInput.value); // Use .value for input type="number"
    const reps = parseInt(repsInput.value); // Use .value for input type="number"

    if (name && sets > 0 && reps > 0) {
        currentRoutine.exercises.push({ name, sets, reps });
        populateCurrentRoutineExercises(currentRoutine.exercises);
        exerciseNameInput.value = ''; // Clear input
        setsInput.value = 3; // Reset inputs
        repsInput.value = 10;
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

    const existingIndex = userRoutines.findIndex(r => r.name === routineName);
    if (existingIndex !== -1) {
        userRoutines[existingIndex] = newRoutine;
        alert(`Routine "${routineName}" updated!`);
    } else {
        userRoutines.push(newRoutine);
        alert(`Routine "${routineName}" saved!`);
    }

    await updateUserData({ routines: userRoutines });
    loadRoutinesIntoSelect();
    displayRoutine(newRoutine.name, newRoutine.exercises);
    routineSelect.value = newRoutine.name;
    showView('routineDashboardView');
    currentRoutine = { name: '', exercises: [] };
    builderRoutineNameInput.value = '';
    populateCurrentRoutineExercises([]);
}

async function completeRoutine() {
    if (!currentRoutine || !currentRoutine.name) {
        alert("Please select a routine to complete.");
        return;
    }
    userXP += 50;
    userLevel = Math.floor(userXP / 100) + 1;

    await updateUserData({ xp: userXP, level: userLevel });
    updateXPDisplay();
    alert(`Routine "${currentRoutine.name}" completed! You gained 50 XP!`);
}

// Friend Management
async function addFriend() {
    const friendEmail = addFriendInput.value.trim(); // Use addFriendInput
    if (!friendEmail || friendEmail === currentUser.email) {
        alert('Please enter a valid friend email.');
        return;
    }

    if (userFriends.some(f => f.email === friendEmail)) {
        alert('This user is already your friend!');
        return;
    }

    userFriends.push({ email: friendEmail });
    await updateUserData({ friends: userFriends });
    displayFriends();
    addFriendInput.value = '';
    alert(`${friendEmail} added to your friends!`);
}


// --- Authentication Handlers ---

googleSignInBtn.addEventListener('click', async () => {
    authError.textContent = '';
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error) {
        authError.textContent = error.message;
    }
});

logoutNavItem.addEventListener('click', async () => { // Changed from logoutBtn
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out:", error);
    }
});

// --- Event Listeners ---

// Input and Slider Event Listeners (using input type="number" now)
// Removed setsSlider and repsSlider listeners as they are now number inputs
// You can add validation or min/max logic directly to HTML or via JS if needed

addExerciseBtn.addEventListener('click', addExerciseToCurrentRoutine);
saveRoutineBtn.addEventListener('click', saveRoutine);
addFriendBtn.addEventListener('click', addFriend);
completeRoutineBtn.addEventListener('click', completeRoutine);


// View Navigation Buttons (Adjusted to use Nav Item IDs)
friendsNavItem.addEventListener('click', () => showView('friendsView'));
routinesNavItem.addEventListener('click', () => showView('routineDashboardView'));
settingsNavItem.addEventListener('click', () => showView('settingsView')); // NEW: Settings nav item event

// Builder specific actions
editRoutineBtn.addEventListener('click', () => {
    const selectedRoutineName = routineSelect.value;
    if (selectedRoutineName) {
        const routineToEdit = userRoutines.find(r => r.name === selectedRoutineName);
        if (routineToEdit) {
            currentRoutine = { ...routineToEdit };
            builderRoutineNameInput.value = currentRoutine.name;
            populateCurrentRoutineExercises(currentRoutine.exercises);
            showView('routineBuilderView');
            deleteRoutineBtn.classList.remove('hidden'); // Show delete button when editing
        } else {
            alert('Selected routine not found.');
        }
    } else {
        alert('Please select a routine to edit or create a new one.');
    }
});

createRoutineBtn.addEventListener('click', () => {
    currentRoutine = { name: '', exercises: [] };
    builderRoutineNameInput.value = '';
    populateCurrentRoutineExercises([]);
    showView('routineBuilderView');
    deleteRoutineBtn.classList.add('hidden'); // Hide delete button for new routine
});

deleteRoutineBtn.addEventListener('click', async () => {
    const routineName = builderRoutineNameInput.value.trim();
    if (!routineName || !confirm(`Are you sure you want to delete routine "${routineName}"?`)) {
        return;
    }

    userRoutines = userRoutines.filter(r => r.name !== routineName);
    await updateUserData({ routines: userRoutines });
    loadRoutinesIntoSelect();
    showView('routineDashboardView'); // Go back to dashboard
    currentRoutine = { name: '', exercises: [] }; // Clear builder state
    builderRoutineNameInput.value = '';
    populateCurrentRoutineExercises([]); // Clear builder list
    alert(`Routine "${routineName}" deleted!`);
    // After deletion, refresh the dashboard display, potentially showing the first routine or empty state
    if (userRoutines.length > 0) {
        const firstRoutine = userRoutines[0];
        displayRoutine(firstRoutine.name, firstRoutine.exercises);
        routineSelect.value = firstRoutine.name;
        currentRoutine = { ...firstRoutine };
    } else {
        displayRoutine('', []);
        routineSelect.value = ''; // Clear selection
    }
});


routineSelect.addEventListener('change', () => {
    const selectedRoutineName = routineSelect.value;
    if (selectedRoutineName) {
        const selectedRoutine = userRoutines.find(r => r.name === selectedRoutineName);
        if (selectedRoutine) {
            currentRoutine = { ...selectedRoutine };
            displayRoutine(selectedRoutine.name, selectedRoutine.exercises);
        }
    } else {
        dashboardRoutineName.textContent = 'No Routine Loaded';
        dashboardExercises.innerHTML = '<p style="text-align: center; color: #777;">Select or create a routine to see exercises.</p>';
        completeRoutineBtn.disabled = true;
        currentRoutine = { name: '', exercises: [] };
    }
});

// NEW: Settings specific event listener
if (quoteTypeSelect) { // Check if element exists before adding listener
    quoteTypeSelect.addEventListener('change', async (event) => {
        currentQuoteType = event.target.value;
        localStorage.setItem('quoteType', currentQuoteType); // Save preference to localStorage
        if (currentUser) {
            await updateUserData({ quoteType: currentQuoteType }); // Also save to Firestore
        }
        updateDailyQuoteDisplay(); // Update quote immediately
    });
}


// --- Authentication State Observer ---

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        userDocRef = doc(db, "users", user.uid);
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        bottomNav.classList.remove('hidden');
        await getUserData(); // Fetch user data, load quoteType, and populate UI
        showView('routineDashboardView'); // Default to dashboard after login, which will then trigger updateDailyQuoteDisplay
    } else {
        currentUser = null;
        userDocRef = null;
        authSection.classList.remove('hidden');
        appSection.classList.add('hidden');
        bottomNav.classList.add('hidden');
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
        currentRoutine = { name: '', exercises: [] };
    }
});

// Initial load: Fetch and display daily quote
// This will be called when `onAuthStateChanged` determines the user state
// If a user is already logged in, showView('routineDashboardView') will trigger it.
// If not, the quote area will remain with its default HTML content until login.
// If you want a quote to display even before login, you'd call updateDailyQuoteDisplay() here:
// updateDailyQuoteDisplay();

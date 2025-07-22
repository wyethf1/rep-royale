// main.js

// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, updateDoc, arrayUnion, arrayRemove, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js";

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
const bottomNav = document.getElementById('bottomNav'); // MODIFIED: Corrected to use ID

// Header Elements
const dailyQuoteElement = document.getElementById('dailyQuote');
const quoteReferenceElement = document.getElementById('quoteReference');

// Auth Section Elements
const authError = document.getElementById('authError'); // ADDED: For error messages
const googleSignInBtn = document.getElementById('googleSignInBtn');

// Footer Navigation Elements
const friendsNavItem = document.getElementById('friendsNavItem');
const routinesNavItem = document.getElementById('routinesNavItem');
const settingsNavItem = document.getElementById('settingsNavItem');
const logoutNavItem = document.getElementById('logoutNavItem');
const xpDisplay = document.getElementById('xpDisplay');
const levelDisplay = document.getElementById('levelDisplay');


// Views
const routineDashboardView = document.getElementById('routineDashboardView');
const routineBuilderView = document.getElementById('routineBuilderView');
const friendsView = document.getElementById('friendsView');
const settingsView = document.getElementById('settingsView');

// Routine Dashboard View Elements
const routineSelect = document.getElementById('routineSelect');
const dashboardRoutineName = document.getElementById('currentRoutineDisplay');
const dashboardExercises = document.getElementById('dashboardExerciseList');
const completeRoutineBtn = document.getElementById('completeRoutineBtn');
const editRoutineBtn = document.getElementById('editRoutineBtn');
const createRoutineBtn = document.getElementById('createRoutineBtn');

// Routine Builder View Elements
const builderRoutineNameInput = document.getElementById('routineName');
const exerciseNameInput = document.getElementById('exerciseName');
const setsInput = document.getElementById('sets'); // MODIFIED: Now refers to range input
const setsValueDisplay = document.getElementById('setsValue'); // NEW: For sets slider value display
const repsInput = document.getElementById('reps'); // MODIFIED: Now refers to range input
const repsValueDisplay = document.getElementById('repsValue'); // NEW: For reps slider value display
const weightInput = document.getElementById('weight'); // NEW: Weight input for weightlifting
const exerciseTypeSelect = document.getElementById('exerciseType'); // NEW: Exercise Type Select
const weightliftingInputs = document.getElementById('weightliftingInputs'); // NEW: Container for weightlifting inputs
const cardioInputs = document.getElementById('cardioInputs'); // NEW: Container for cardio inputs
const durationInput = document.getElementById('duration'); // NEW: Duration input for cardio
const distanceInput = document.getElementById('distance'); // NEW: Distance input for cardio
const cardioNotesInput = document.getElementById('cardioNotes'); // NEW: Notes input for cardio

const addExerciseBtn = document.getElementById('addExerciseBtn');
const currentRoutineExercises = document.getElementById('builderExerciseList');
const saveRoutineBtn = document.getElementById('saveRoutineBtn');
const deleteRoutineBtn = document.getElementById('deleteRoutineBtn');

// Friends View Elements
const addFriendInput = document.getElementById('addFriendInput');
const addFriendBtn = document.getElementById('addFriendBtn');
const friendsList = document.getElementById('myFriendsList');

// Settings Elements
const quoteTypeSelect = document.getElementById('quoteType');

// --- Global Variables ---
let currentUser = null;
let userDocRef = null;
let currentRoutine = { name: '', exercises: [] };
let userXP = 0;
let userLevel = 1;
let userRoutines = [];
let userFriends = []; // Store friend UIDs here (as { email, uid })
let friendsData = {}; // Stores friend UID -> { email, xp, level, workoutLogs } for display

// --- Quote Data ---
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

let currentQuoteType = localStorage.getItem('quoteType') || 'bible';


// --- UI / View Management Functions ---

function showView(viewId) {
    routineDashboardView.classList.add('hidden');
    routineBuilderView.classList.add('hidden');
    friendsView.classList.add('hidden');
    settingsView.classList.add('hidden');

    document.getElementById(viewId).classList.remove('hidden');

    friendsNavItem.classList.remove('active');
    routinesNavItem.classList.remove('active');
    settingsNavItem.classList.remove('active');

    if (viewId === 'routineDashboardView') {
        routinesNavItem.classList.add('active');
        updateDailyQuoteDisplay();
    } else if (viewId === 'friendsView') {
        friendsNavItem.classList.add('active');
    } else if (viewId === 'settingsView') {
        settingsNavItem.classList.add('active');
    } else if (viewId === 'routineBuilderView') { // Ensure correct inputs are shown when builder view is shown
        toggleExerciseInputs();
    }
}

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
                const randomIndex = Math.floor(Math.random() * bibleQuotes.length);
                const selectedQuote = bibleQuotes[randomIndex];
                dailyQuoteElement.textContent = `"${selectedQuote.quote}"`;
                quoteReferenceElement.textContent = `- ${selectedQuote.reference}`;
            }
        } catch (error) {
            console.error("Error fetching daily Bible quote from API:", error);
            const randomIndex = Math.floor(Math.random() * bibleQuotes.length);
            const selectedQuote = bibleQuotes[randomIndex];
            dailyQuoteElement.textContent = `"${selectedQuote.quote}"`;
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

async function updateUserData(data) {
    if (userDocRef) {
        try {
            await setDoc(userDocRef, data, { merge: true });
            console.log("User data updated:", data);
        } catch (error) {
            console.error("Error updating user data:", error);
        }
    }
}

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
                currentQuoteType = data.quoteType || localStorage.getItem('quoteType') || 'bible';
                localStorage.setItem('quoteType', currentQuoteType);

                updateXPDisplay();
                loadRoutinesIntoSelect();
                displayFriends(); // Call displayFriends after userFriends is updated

                if (quoteTypeSelect) {
                    quoteTypeSelect.value = currentQuoteType;
                }

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
                await setDoc(userDocRef, {
                    xp: 0,
                    level: 1,
                    routines: [],
                    friends: [],
                    workoutLogs: [], // Initialize workoutLogs for new users
                    email: currentUser.email,
                    quoteType: currentQuoteType
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

// MODIFIED: displayRoutine to show cardio/weight details
function displayRoutine(routineName, exercises) {
    dashboardRoutineName.textContent = routineName || 'No Routine Loaded';
    dashboardExercises.innerHTML = '';
    if (exercises && exercises.length > 0) {
        exercises.forEach((exercise) => {
            const item = document.createElement('div');
            item.classList.add('routine-exercise-item');
            let exerciseDetails = '';
            if (exercise.type === 'weightlifting') {
                exerciseDetails = `${exercise.sets} sets of ${exercise.reps} reps`;
                if (exercise.weight > 0) {
                    exerciseDetails += ` at ${exercise.weight} kg/lbs`;
                }
            } else if (exercise.type === 'cardio') {
                exerciseDetails = `${exercise.duration} min`;
                if (exercise.distance > 0) {
                    exerciseDetails += `, ${exercise.distance} km/miles`;
                }
                if (exercise.notes) {
                    exerciseDetails += ` (${exercise.notes})`;
                }
            } else { // Fallback for old routines without a 'type' property
                exerciseDetails = `${exercise.sets} sets of ${exercise.reps} reps`;
            }
            item.innerHTML = `
                <span>${exercise.name} (${exercise.type || 'weightlifting'}): ${exerciseDetails}</span>
            `;
            dashboardExercises.appendChild(item);
        });
        completeRoutineBtn.disabled = false;
    } else {
        dashboardExercises.innerHTML = '<p style="text-align: center; color: #777;">No exercises in this routine.</p>';
        completeRoutineBtn.disabled = true;
    }
}

// MODIFIED: populateCurrentRoutineExercises to show cardio/weight details
function populateCurrentRoutineExercises(exercises) {
    currentRoutineExercises.innerHTML = '';
    if (exercises && exercises.length > 0) {
        exercises.forEach((exercise, index) => {
            const item = document.createElement('div');
            item.classList.add('routine-exercise-item');
            let exerciseDetails = '';
            if (exercise.type === 'weightlifting') {
                exerciseDetails = `${exercise.sets} sets of ${exercise.reps} reps`;
                if (exercise.weight > 0) {
                    exerciseDetails += ` at ${exercise.weight} kg/lbs`;
                }
            } else if (exercise.type === 'cardio') {
                exerciseDetails = `${exercise.duration} min`;
                if (exercise.distance > 0) {
                    exerciseDetails += `, ${exercise.distance} km/miles`;
                }
                if (exercise.notes) {
                    exerciseDetails += ` (${exercise.notes})`;
                }
            } else { // Fallback for old routines without a 'type' property
                exerciseDetails = `${exercise.sets} sets of ${exercise.reps} reps`;
            }
            item.innerHTML = `
                <span>${exercise.name} (${exercise.type || 'weightlifting'}): ${exerciseDetails}</span>
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

// MODIFIED: displayFriends to fetch and show friend details
async function displayFriends() {
    friendsList.innerHTML = '';
    friendsData = {}; // Clear previous friend data

    if (userFriends && userFriends.length > 0) {
        const friendPromises = userFriends.map(async (friend) => {
            try {
                // Ensure friend.uid exists. For older friends added by email only, this might be missing.
                if (!friend.uid) {
                    console.warn(`Friend ${friend.email} has no UID. Skipping data fetch.`);
                    return;
                }
                const friendDocRef = doc(db, "users", friend.uid);
                const friendDocSnap = await getDoc(friendDocRef);
                if (friendDocSnap.exists()) {
                    const friendDetails = friendDocSnap.data();
                    friendsData[friend.uid] = {
                        email: friend.email,
                        xp: friendDetails.xp || 0,
                        level: friendDetails.level || 1,
                        workoutLogs: friendDetails.workoutLogs || []
                    };
                } else {
                    console.warn(`Friend data for ${friend.email} (UID: ${friend.uid}) not found.`);
                }
            } catch (error) {
                console.error(`Error fetching data for friend ${friend.email}:`, error);
            }
        });

        await Promise.all(friendPromises);

        userFriends.forEach(friend => {
            const friendDetails = friendsData[friend.uid];
            if (friendDetails) {
                const item = document.createElement('div');
                item.classList.add('friend-item');

                item.innerHTML = `
                    <div class="friend-summary">
                        <span>${friendDetails.email}</span>
                        <span class="friend-stats">XP: ${friendDetails.xp} | Level: ${friendDetails.level}</span>
                    </div>
                    <div class="friend-workouts" id="workouts-${friend.uid}">
                        <button class="view-workouts-btn" data-uid="${friend.uid}">View Daily Workouts</button>
                    </div>
                `;
                friendsList.appendChild(item);
            } else {
                 const item = document.createElement('div');
                 item.classList.add('friend-item');
                 item.innerHTML = `<span>${friend.email} (Data not available)</span>`;
                 friendsList.appendChild(item);
            }
        });

        document.querySelectorAll('.view-workouts-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const friendUID = e.target.dataset.uid;
                toggleFriendWorkouts(friendUID);
            });
        });

    } else {
        friendsList.innerHTML = '<p style="text-align: center; color: #777;">No friends added yet.</p>';
    }
}

// NEW: Function to toggle and display friend's daily workouts
function toggleFriendWorkouts(friendUID) {
    const friendDetails = friendsData[friendUID];
    const workoutContainer = document.getElementById(`workouts-${friendUID}`);

    if (!friendDetails || !workoutContainer) return;

    const existingWorkoutList = workoutContainer.querySelector('.friend-workout-list');
    if (existingWorkoutList) {
        existingWorkoutList.remove();
        workoutContainer.querySelector('.view-workouts-btn').textContent = "View Daily Workouts";
        return;
    }

    const workoutList = document.createElement('ul');
    workoutList.classList.add('friend-workout-list');

    if (friendDetails.workoutLogs && friendDetails.workoutLogs.length > 0) {
        const sortedLogs = [...friendDetails.workoutLogs].sort((a, b) => new Date(b.date) - new Date(a.date));

        const dailySummary = {};
        sortedLogs.forEach(log => {
            if (!dailySummary[log.date]) {
                dailySummary[log.date] = [];
            }
            if (!dailySummary[log.date].includes(log.routineName)) {
                dailySummary[log.date].push(log.routineName);
            }
        });

        const recentDates = Object.keys(dailySummary).sort((a, b) => new Date(b) - new Date(a)).slice(0, 7);

        if (recentDates.length > 0) {
            recentDates.forEach(date => {
                const routinesForDay = dailySummary[date];
                const listItem = document.createElement('li');
                listItem.innerHTML = `<strong>${date}</strong>: ${routinesForDay.join(', ')}`;
                workoutList.appendChild(listItem);
            });
        } else {
            const listItem = document.createElement('li');
            listItem.textContent = "No recent workouts logged.";
            workoutList.appendChild(listItem);
        }

    } else {
        const listItem = document.createElement('li');
        listItem.textContent = "No workouts logged yet.";
        workoutList.appendChild(listItem);
    }
    workoutContainer.appendChild(workoutList);
    workoutContainer.querySelector('.view-workouts-btn').textContent = "Hide Daily Workouts";
}

// --- Core App Logic ---

// MODIFIED: addExerciseToCurrentRoutine to handle different types and read from sliders/inputs
function addExerciseToCurrentRoutine() {
    const name = exerciseNameInput.value.trim();
    const type = exerciseTypeSelect.value;
    let newExercise = { name, type };

    if (!name) {
        alert('Please enter exercise name.');
        return;
    }

    if (type === 'weightlifting') {
        const sets = parseInt(setsInput.value);
        const reps = parseInt(repsInput.value);
        const weight = parseFloat(weightInput.value);

        if (sets > 0 && reps > 0 && weight >= 0) {
            newExercise = { ...newExercise, sets, reps, weight };
        } else {
            alert('Please enter valid sets, reps, and weight for weightlifting.');
            return;
        }
    } else if (type === 'cardio') {
        const duration = parseInt(durationInput.value);
        const distance = parseFloat(distanceInput.value);
        const notes = cardioNotesInput.value.trim();
        if (duration > 0 && distance >= 0) {
            newExercise = { ...newExercise, duration, distance, notes };
        } else {
            alert('Please enter valid duration and distance for cardio.');
            return;
        }
    }

    currentRoutine.exercises.push(newExercise);
    populateCurrentRoutineExercises(currentRoutine.exercises);

    // Clear inputs and reset sliders to default values
    exerciseNameInput.value = '';
    setsInput.value = 3; // Reset sets slider
    setsValueDisplay.textContent = 3; // Update sets display
    repsInput.value = 10; // Reset reps slider
    repsValueDisplay.textContent = 10; // Update reps display
    weightInput.value = 0;
    durationInput.value = 30;
    distanceInput.value = 5;
    cardioNotesInput.value = '';
    exerciseTypeSelect.value = 'weightlifting';
    toggleExerciseInputs();
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

// MODIFIED: completeRoutine to log workouts
async function completeRoutine() {
    if (!currentRoutine || !currentRoutine.name) {
        alert("Please select a routine to complete.");
        return;
    }
    userXP += 50;
    userLevel = Math.floor(userXP / 100) + 1;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const workoutLog = {
        routineName: currentRoutine.name,
        date: today,
        exercises: currentRoutine.exercises // Store full exercise details for comprehensive log
    };

    try {
        await updateDoc(userDocRef, {
            xp: userXP,
            level: userLevel,
            workoutLogs: arrayUnion(workoutLog) // Use arrayUnion to append new logs
        });
        console.log("Workout logged successfully!");
    } catch (error) {
        console.error("Error logging workout:", error);
    }

    updateXPDisplay();
    alert(`Routine "${currentRoutine.name}" completed! You gained 50 XP!`);
}

// MODIFIED: addFriend to find UID and store it
async function addFriend() {
    const friendEmail = addFriendInput.value.trim();
    if (!friendEmail || friendEmail === currentUser.email) {
        alert('Please enter a valid friend email.');
        return;
    }

    if (userFriends.some(f => f.email === friendEmail)) {
        alert('This user is already your friend!');
        return;
    }

    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", friendEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert("No user found with that email address.");
            return;
        }

        let friendUID = null;
        querySnapshot.forEach(doc => {
            friendUID = doc.id; // Get the UID of the friend
        });

        if (friendUID) {
            userFriends.push({ email: friendEmail, uid: friendUID }); // Store UID along with email
            await updateUserData({ friends: userFriends });
            displayFriends();
            addFriendInput.value = '';
            alert(`${friendEmail} added to your friends!`);
        } else {
            alert("Could not find friend's UID.");
        }

    } catch (error) {
        console.error("Error adding friend or querying friend UID:", error);
        alert("Failed to add friend. Please try again.");
    }
}

// NEW: Function to toggle exercise specific inputs
function toggleExerciseInputs() {
    if (exerciseTypeSelect.value === 'weightlifting') {
        weightliftingInputs.classList.remove('hidden');
        cardioInputs.classList.add('hidden');
    } else {
        weightliftingInputs.classList.add('hidden');
        cardioInputs.classList.remove('hidden');
    }
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

logoutNavItem.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Error signing out:", error);
    }
});

// --- Event Listeners ---

// NEW: Add event listeners for the sets and reps sliders
setsInput.addEventListener('input', () => {
    setsValueDisplay.textContent = setsInput.value;
});

repsInput.addEventListener('input', () => {
    repsValueDisplay.textContent = repsInput.value;
});

// NEW: Listener for exercise type selection
exerciseTypeSelect.addEventListener('change', toggleExerciseInputs);

addExerciseBtn.addEventListener('click', addExerciseToCurrentRoutine);
saveRoutineBtn.addEventListener('click', saveRoutine);
addFriendBtn.addEventListener('click', addFriend);
completeRoutineBtn.addEventListener('click', completeRoutine);


// View Navigation Buttons
friendsNavItem.addEventListener('click', () => showView('friendsView'));
routinesNavItem.addEventListener('click', () => showView('routineDashboardView'));
settingsNavItem.addEventListener('click', () => showView('settingsView'));

// MODIFIED: createRoutineBtn to reset all new fields and sliders
createRoutineBtn.addEventListener('click', () => {
    currentRoutine = { name: '', exercises: [] };
    builderRoutineNameInput.value = '';
    populateCurrentRoutineExercises([]);
    showView('routineBuilderView');
    deleteRoutineBtn.classList.add('hidden');

    // Reset all exercise input fields and their displays
    exerciseNameInput.value = '';
    setsInput.value = 3;
    setsValueDisplay.textContent = 3;
    repsInput.value = 10;
    repsValueDisplay.textContent = 10;
    weightInput.value = 0;
    durationInput.value = 30;
    distanceInput.value = 5;
    cardioNotesInput.value = '';
    exerciseTypeSelect.value = 'weightlifting'; // Default to weightlifting
    toggleExerciseInputs(); // Ensure correct inputs are shown
});

// MODIFIED: editRoutineBtn to correctly populate all fields and sliders
editRoutineBtn.addEventListener('click', () => {
    const selectedRoutineName = routineSelect.value;
    if (selectedRoutineName) {
        const routineToEdit = userRoutines.find(r => r.name === selectedRoutineName);
        if (routineToEdit) {
            currentRoutine = { ...routineToEdit };
            builderRoutineNameInput.value = currentRoutine.name;
            populateCurrentRoutineExercises(currentRoutine.exercises);
            showView('routineBuilderView');
            deleteRoutineBtn.classList.remove('hidden');

            // Reset inputs first to ensure clean state, then populate if exercises exist
            exerciseNameInput.value = '';
            setsInput.value = 3; setsValueDisplay.textContent = 3;
            repsInput.value = 10; repsValueDisplay.textContent = 10;
            weightInput.value = 0;
            durationInput.value = 30;
            distanceInput.value = 5;
            cardioNotesInput.value = '';

            // Set exercise type and populate fields for the first exercise if it exists
            if (currentRoutine.exercises.length > 0) {
                const firstExercise = currentRoutine.exercises[0];
                exerciseNameInput.value = firstExercise.name || '';
                const firstExerciseType = firstExercise.type || 'weightlifting'; // Default for old routines
                exerciseTypeSelect.value = firstExerciseType;

                if (firstExerciseType === 'weightlifting') {
                    setsInput.value = firstExercise.sets || 3;
                    setsValueDisplay.textContent = setsInput.value;
                    repsInput.value = firstExercise.reps || 10;
                    repsValueDisplay.textContent = repsInput.value;
                    weightInput.value = firstExercise.weight || 0;
                } else { // It's cardio
                    durationInput.value = firstExercise.duration || 30;
                    distanceInput.value = firstExercise.distance || 5;
                    cardioNotesInput.value = firstExercise.notes || '';
                }
            } else {
                exerciseTypeSelect.value = 'weightlifting';
            }
            toggleExerciseInputs(); // Show/hide fields based on type
        } else {
            alert('Selected routine not found.');
        }
    } else {
        alert('Please select a routine to edit or create a new one.');
    }
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

if (quoteTypeSelect) {
    quoteTypeSelect.addEventListener('change', async (event) => {
        currentQuoteType = event.target.value;
        localStorage.setItem('quoteType', currentQuoteType);
        if (currentUser) {
            await updateUserData({ quoteType: currentQuoteType });
        }
        updateDailyQuoteDisplay();
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
        await getUserData();
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
        // Reset builder input states fully
        exerciseNameInput.value = '';
        setsInput.value = 3; setsValueDisplay.textContent = 3;
        repsInput.value = 10; repsValueDisplay.textContent = 10;
        weightInput.value = 0;
        durationInput.value = 30;
        distanceInput.value = 5;
        cardioNotesInput.value = '';
        exerciseTypeSelect.value = 'weightlifting';
        toggleExerciseInputs();
    }
});

// Initial setup for slider displays and input toggling when the page loads
document.addEventListener('DOMContentLoaded', () => {
    setsValueDisplay.textContent = setsInput.value;
    repsValueDisplay.textContent = repsInput.value;
    toggleExerciseInputs(); // Ensure correct inputs are shown initially
});

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
    apiKey: "AIzaSyB8bHVud00N-H4VBgwsag4oRHBYVvf4q4Q", // Use your actual API Key
    authDomain: "rep-royale.firebaseapp.com",
    databaseURL: "https://rep-royale-default-rtdb.firebaseio.com",
    projectId: "rep-royale",
    storageBucket: "rep-royale.firebasestorage.app",
    messagingSenderId: "842201057109",
    appId: "1:842201057109:web:f2bb869900048bf84751dc",
    measurementId: "G-JSL641G4SJ"
};

// Initialize Firebase (these are now constants, available throughout main.js)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // Get the auth instance
const db = getFirestore(app); // Get the db instance

// Global variable to hold the exercises for the routine currently being built
let currentBuildingRoutine = [];

window.addEventListener('DOMContentLoaded', () => {
    console.log('main.js loaded at', new Date().toLocaleString());

    // DOM Elements for Auth Section
    const authSection = document.getElementById('authSection');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const authError = document.getElementById('authError');
    const dailyQuote = document.getElementById('dailyQuote');

    // DOM Elements for App Section
    const appSection = document.getElementById('appSection');
    const xpDisplay = document.getElementById('xpDisplay');
    const levelDisplay = document.getElementById('levelDisplay');
    const logoutBtn = document.getElementById('logoutBtn');
    const gainXpBtn = document.getElementById('gainXpBtn'); // From original code, consider where this fits now. Assuming it's still intended.

    // New Tab Navigation Elements
    const tabButtons = document.querySelectorAll('.tab-button');
    const routineBuilderTab = document.getElementById('routineBuilderTab');
    const myRoutinesTab = document.getElementById('myRoutinesTab');
    const friendsTab = document.getElementById('friendsTab');

    // Routine Builder Tab Elements
    const routineNameInput = document.getElementById('routineName'); // Renamed from routineName
    const exerciseNameInput = document.getElementById('exerciseNameInput');
    const setsSlider = document.getElementById('setsSlider');
    const setsValue = document.getElementById('setsValue');
    const repsSlider = document.getElementById('repsSlider');
    const repsValue = document.getElementById('repsValue');
    const addExerciseBtn = document.getElementById('addExerciseBtn');
    const currentRoutineExercisesDiv = document.getElementById('currentRoutineExercises');
    const saveRoutineBtn = document.getElementById('saveRoutineBtn');

    // My Routines Tab Elements
    const routineSelect = document.getElementById('routineSelect');
    const completeRoutineBtn = document.getElementById('completeRoutineBtn');
    const selectedRoutineExercisesDiv = document.getElementById('selectedRoutineExercises');

    // Friends Tab Elements
    const friendEmailInput = document.getElementById('friendEmailInput');
    const addFriendBtn = document.getElementById('addFriendBtn');
    const friendsList = document.getElementById('friendsList');


    // Initial DOM Element Check (updated for new IDs)
    if (!authSection || !appSection || !emailInput || !passwordInput || !loginBtn ||
        !registerBtn || !googleSignInBtn || !logoutBtn || !xpDisplay ||
        !levelDisplay || !authError || !routineNameInput || !exerciseNameInput ||
        !setsSlider || !setsValue || !repsSlider || !repsValue || !addExerciseBtn ||
        !currentRoutineExercisesDiv || !saveRoutineBtn || !routineSelect ||
        !completeRoutineBtn || !selectedRoutineExercisesDiv || !friendEmailInput ||
        !addFriendBtn || !friendsList || !dailyQuote || !gainXpBtn ||
        !routineBuilderTab || !myRoutinesTab || !friendsTab || tabButtons.length === 0) {
        console.error('One or more critical DOM elements are missing. Please check index.html IDs.');
        authError.textContent = 'App failed to load: Missing UI elements. Check console for details.';
        return;
    }

    let currentUser = null;
    let xp = 0;
    let routines = []; // Stores user's saved routines
    const quotes = [
        "The only bad workout is the one that didn't happen.",
        "Sweat is just your fat crying.",
        "Train insane or remain the same.",
        "Your body can stand almost anything. It’s your mind that you have to convince.",
        "The pain you feel today is the strength you feel tomorrow."
    ];

    function displayRandomQuote() {
        const randomIndex = Math.floor(Math.random() * quotes.length);
        dailyQuote.textContent = quotes[randomIndex];
    }
    displayRandomQuote(); // Display quote on load

    // Utility functions to show/hide sections
    function showAuth() {
        authSection.classList.remove('hidden');
        appSection.classList.add('hidden');
    }

    function showApp() {
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        // Default to Routine Builder tab on app load
        showTab('routineBuilderTab');
    }

    function showTab(tabId) {
        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
        // Deactivate all tab buttons
        tabButtons.forEach(button => button.classList.remove('active'));

        // Show the selected tab content
        document.getElementById(tabId).classList.remove('hidden');
        // Activate the corresponding button
        document.querySelector(`.tab-button[data-target="${tabId}"]`).classList.add('active');
    }

    // Event Listeners for Tab Navigation
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            showTab(button.dataset.target);
        });
    });

    // Event listeners for sliders to update displayed values
    setsSlider.oninput = () => {
        setsValue.textContent = setsSlider.value;
    };
    repsSlider.oninput = () => {
        repsValue.textContent = repsSlider.value;
    };

    // --- Firebase Auth Logic ---
    onAuthStateChanged(auth, user => {
        console.log('Auth state changed:', user ? user.uid : 'No user');
        if (user) {
            currentUser = user;
            showApp();
            loadUserData();
            loadRoutines(); // Load routines for My Routines tab
            loadFriends(); // Load friends for Friends tab
        } else {
            currentUser = null;
            xp = 0;
            routines = [];
            currentBuildingRoutine = []; // Clear routine builder on logout
            updateXpDisplay();
            updateRoutineSelect();
            updateCurrentRoutineExercisesDisplay(); // Clear display
            selectedRoutineExercisesDiv.innerHTML = '<p style="text-align: center; color: #666;">Select a routine to see exercises.</p>'; // Clear selected routine display
            friendsList.innerHTML = '<p style="text-align: center; color: #666;">No friends added yet.</p>'; // Clear friends list
            showAuth();
        }
    });

    loginBtn.onclick = async () => {
        authError.textContent = '';
        try {
            await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
            // Success handled by onAuthStateChanged
        } catch (e) {
            console.error('Login error:', e);
            authError.textContent = e.message;
        }
    };

    registerBtn.onclick = async () => {
        authError.textContent = '';
        try {
            await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
            // Success handled by onAuthStateChanged
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
            // Success handled by onAuthStateChanged
        } catch (e) {
            console.error('Google Sign-In error:', e);
            authError.textContent = e.message;
        }
    };

    logoutBtn.onclick = async () => {
        try {
            await signOut(auth);
        } catch (e) {
            console.error('Logout error:', e);
            authError.textContent = e.message;
        }
    };

    // --- XP & User Data Logic ---
    gainXpBtn.onclick = () => {
        if (!currentUser) {
            authError.textContent = 'Please log in to gain XP.';
            return;
        }
        xp += 10;
        updateXpDisplay();
        saveUserData();
        authError.textContent = 'Gained 10 XP from workout!'; // Using authError for general messages
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
            // We'll also store the user's email if it's their first login for friend finding
            await setDoc(userDocRef, {
                xp: xp,
                email: currentUser.email || null // Save email for friend lookup
            }, { merge: true });
        } catch (e) {
            console.error('Error saving user data:', e);
            authError.textContent = 'Error saving XP.';
        }
    }

    async function loadUserData() {
        if (!currentUser) return;
        try {
            const userDocRef = doc(collection(db, 'users'), currentUser.uid);
            const docSnapshot = await getDoc(userDocRef);
            if (docSnapshot.exists()) {
                xp = docSnapshot.data().xp || 0;
                // Ensure email is saved for existing users too
                if (!docSnapshot.data().email && currentUser.email) {
                    await setDoc(userDocRef, { email: currentUser.email }, { merge: true });
                }
            } else {
                xp = 0; // Initialize XP for new users
                saveUserData(); // Save initial data including email for new users
            }
            updateXpDisplay();
        } catch (e) {
            console.error('Error loading user data:', e);
            authError.textContent = 'Error loading XP.';
        }
    }

    // --- Routine Builder Logic ---
    addExerciseBtn.onclick = () => {
        const exerciseName = exerciseNameInput.value.trim();
        const sets = parseInt(setsSlider.value);
        const reps = parseInt(repsSlider.value);

        if (!exerciseName) {
            authError.textContent = 'Please enter an exercise name.';
            return;
        }

        currentBuildingRoutine.push({ name: exerciseName, sets, reps });
        updateCurrentRoutineExercisesDisplay();
        exerciseNameInput.value = ''; // Clear input
        authError.textContent = `Added exercise: ${exerciseName}, ${sets}x${reps}`;
    };

    function updateCurrentRoutineExercisesDisplay() {
        if (currentBuildingRoutine.length === 0) {
            currentRoutineExercisesDiv.innerHTML = '<p style="text-align: center; color: #666;">No exercises added yet.</p>';
            return;
        }
        currentRoutineExercisesDiv.innerHTML = ''; // Clear previous content
        currentBuildingRoutine.forEach((exercise, index) => {
            const exerciseItem = document.createElement('div');
            exerciseItem.className = 'routine-exercise-item';
            exerciseItem.innerHTML = `
                <span>${exercise.name} (${exercise.sets}x${exercise.reps})</span>
                <button data-index="${index}">Remove</button>
            `;
            exerciseItem.querySelector('button').onclick = (e) => {
                const idx = parseInt(e.target.dataset.index);
                currentBuildingRoutine.splice(idx, 1);
                updateCurrentRoutineExercisesDisplay();
            };
            currentRoutineExercisesDiv.appendChild(exerciseItem);
        });
    }

    saveRoutineBtn.onclick = async () => {
        if (!currentUser) {
            authError.textContent = 'Please log in to save routines.';
            return;
        }
        const name = routineNameInput.value.trim();
        if (!name) {
            authError.textContent = 'Please enter a routine name.';
            return;
        }
        if (currentBuildingRoutine.length === 0) {
            authError.textContent = 'Please add at least one exercise to the routine.';
            return;
        }

        try {
            const routinesCollectionRef = collection(doc(collection(db, 'users'), currentUser.uid), 'routines');
            const routineRef = await addDoc(routinesCollectionRef, {
                name,
                exercises: currentBuildingRoutine, // Save the array of exercises
                createdAt: serverTimestamp()
            });
            // Add the newly saved routine to our local routines array for display
            routines.push({ id: routineRef.id, name, exercises: currentBuildingRoutine });
            updateRoutineSelect(); // Update the dropdown
            routineNameInput.value = ''; // Clear routine name input
            currentBuildingRoutine = []; // Clear the routine builder
            updateCurrentRoutineExercisesDisplay(); // Update its display
            authError.textContent = `Routine "${name}" saved!`;
            showTab('myRoutinesTab'); // Switch to My Routines tab after saving
        } catch (e) {
            console.error('Error saving routine:', e);
            authError.textContent = 'Error saving routine.';
        }
    };

    // --- My Routines Logic ---
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
            authError.textContent = 'Error loading routines.';
        }
    }

    function updateRoutineSelect() {
        routineSelect.innerHTML = '<option value="">-- Select Routine --</option>';
        if (routines.length === 0) {
            completeRoutineBtn.disabled = true;
        } else {
            completeRoutineBtn.disabled = false;
        }
        routines.forEach(routine => {
            const option = document.createElement('option');
            option.value = routine.id;
            option.textContent = routine.name;
            routineSelect.appendChild(option);
        });
        // Clear selected routine exercises when the list is updated
        selectedRoutineExercisesDiv.innerHTML = '<p style="text-align: center; color: #666;">Select a routine to see exercises.</p>';
    }

    routineSelect.onchange = () => {
        const selectedRoutineId = routineSelect.value;
        if (selectedRoutineId) {
            const selectedRoutine = routines.find(r => r.id === selectedRoutineId);
            if (selectedRoutine && selectedRoutine.exercises && selectedRoutine.exercises.length > 0) {
                displaySelectedRoutineExercises(selectedRoutine.exercises);
            } else {
                selectedRoutineExercisesDiv.innerHTML = '<p style="text-align: center; color: #666;">No exercises found for this routine.</p>';
            }
        } else {
            selectedRoutineExercisesDiv.innerHTML = '<p style="text-align: center; color: #666;">Select a routine to see exercises.</p>';
        }
    };

    function displaySelectedRoutineExercises(exercises) {
        selectedRoutineExercisesDiv.innerHTML = ''; // Clear previous content
        if (exercises.length === 0) {
            selectedRoutineExercisesDiv.innerHTML = '<p style="text-align: center; color: #666;">No exercises in this routine.</p>';
            return;
        }
        exercises.forEach(exercise => {
            const exerciseItem = document.createElement('div');
            exerciseItem.className = 'routine-exercise-item';
            exerciseItem.innerHTML = `<span>${exercise.name} (${exercise.sets}x${exercise.reps})</span>`;
            selectedRoutineExercisesDiv.appendChild(exerciseItem);
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

        xp += 50;
        updateXpDisplay();
        saveUserData();
        authError.textContent = `Completed routine "${routine.name}"! Gained 50 XP.`;
        // Optionally, reset routine selection or switch back to routine builder
        routineSelect.value = ""; // Clear selection
        selectedRoutineExercisesDiv.innerHTML = '<p style="text-align: center; color: #666;">Select a routine to see exercises.</p>';
    };

    // --- Friends Logic ---
    async function loadFriends() {
        if (!currentUser) return;
        try {
            const friendsCollectionRef = collection(doc(collection(db, 'users'), currentUser.uid), 'friends');
            const querySnapshot = await getDocs(friendsCollectionRef);
            friendsList.innerHTML = ''; // Clear current list

            if (querySnapshot.empty) {
                friendsList.innerHTML = '<p style="text-align: center; color: #666;">No friends added yet.</p>';
                return;
            }

            // Fetch XP for each friend
            const friendPromises = querySnapshot.docs.map(async (friendDocSnapshot) => {
                const friendData = friendDocSnapshot.data();
                const friendId = friendDocSnapshot.id; // friendDocSnapshot.id is the UID of the friend
                
                // Get the friend's user data to display their XP
                const friendUserDocRef = doc(collection(db, 'users'), friendId);
                const friendUserDoc = await getDoc(friendUserDocRef);

                let friendXP = 0;
                let friendEmail = friendData.email; // Use email stored in friend's subcollection

                if (friendUserDoc.exists()) {
                    friendXP = friendUserDoc.data().xp || 0;
                    // If the email in the main user doc is more reliable, could use it:
                    // friendEmail = friendUserDoc.data().email || friendEmail;
                }
                return { id: friendId, email: friendEmail, xp: friendXP };
            });

            const friendsData = await Promise.all(friendPromises);

            friendsData.forEach(friend => {
                const div = document.createElement('div');
                div.className = 'friend-item';
                div.innerHTML = `
                    <span>${friend.email}</span>
                    <span>XP: ${friend.xp}</span>
                `;
                friendsList.appendChild(div);
            });

        } catch (e) {
            console.error('Error loading friends:', e);
            authError.textContent = 'Error loading friends.';
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

            const friendUserDoc = usersSnapshot.docs[0]; // Get the first matching user's doc
            const friendUid = friendUserDoc.id; // This is the friend's UID

            // Check if friend is already added
            const friendsSubCollectionRef = collection(doc(collection(db, 'users'), currentUser.uid), 'friends');
            const existingFriendDoc = await getDoc(doc(friendsSubCollectionRef, friendUid));

            if (existingFriendDoc.exists()) {
                authError.textContent = `${friendEmail} is already your friend.`;
                return;
            }

            // Add friend to current user's friends subcollection
            await setDoc(doc(friendsSubCollectionRef, friendUid), {
                email: friendEmail,
                addedAt: serverTimestamp()
            });

            // Optionally, also add current user to friend's friends subcollection (mutual follow)
            // This would make it easier to display mutual friends or follower counts
            // const friendFriendsSubCollectionRef = collection(doc(collection(db, 'users'), friendUid), 'friends');
            // await setDoc(doc(friendFriendsSubCollectionRef, currentUser.uid), {
            //     email: currentUser.email,
            //     addedAt: serverTimestamp()
            // });

            loadFriends(); // Reload friends list after adding
            friendEmailInput.value = ''; // Clear input
            authError.textContent = `Added friend: ${friendEmail}`;
        } catch (e) {
            console.error('Error adding friend:', e);
            authError.textContent = 'Error adding friend.';
        }
    };
}); // End of DOMContentLoaded

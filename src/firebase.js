// src/firebase.js

import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  onValue,
  remove,
  onDisconnect,
  serverTimestamp,
  get
} from 'firebase/database';

import {
  getAuth,
  signInAnonymously,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA348PfwUwSfop8At2uy_4ObfLcScnrY8A",
  authDomain: "planning-poker-ff905.firebaseapp.com",
  databaseURL: "https://planning-poker-ff905-default-rtdb.firebaseio.com",
  projectId: "planning-poker-ff905",
  storageBucket: "planning-poker-ff905.appspot.com",
  messagingSenderId: "732232297324",
  appId: "1:732232297324:web:73cb15e881125255d16149"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Initialize Firebase Auth
const auth = getAuth(app);

// Sign in anonymously on load
signInAnonymously(auth).catch((error) => {
  console.error('Anonymous sign-in failed:', error);
});

// Utility: Set user display name
const setDisplayName = (name) => {
  if (auth.currentUser) {
    updateProfile(auth.currentUser, { displayName: name }).catch((error) =>
      console.error('Failed to update displayName:', error)
    );
  } else {
    // Wait for auth to be ready
    onAuthStateChanged(auth, (user) => {
      if (user) {
        updateProfile(user, { displayName: name }).catch((error) =>
          console.error('Failed to update displayName after auth:', error)
        );
      }
    });
  }
};

// Export everything
export {
  db,
  ref,
  set,
  onValue,
  remove,
  onDisconnect,
  serverTimestamp,
  get,
  auth,
  setDisplayName,
  onAuthStateChanged
};

// src/firebase.js

import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  onValue,
  remove,
  onDisconnect,
  serverTimestamp
} from 'firebase/database';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA348PfwUwSfop8At2uy_4ObfLcScnrY8A",
  authDomain: "planning-poker-ff905.firebaseapp.com",
  databaseURL: "https://planning-poker-ff905-default-rtdb.firebaseio.com",
  projectId: "planning-poker-ff905",
  storageBucket: "planning-poker-ff905.appspot.com", // fixed typo from `.app` to `.appspot.com`
  messagingSenderId: "732232297324",
  appId: "1:732232297324:web:73cb15e881125255d16149"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Export necessary Firebase database functions
export {
  db,
  ref,
  set,
  onValue,
  remove,
  onDisconnect,
  serverTimestamp
};


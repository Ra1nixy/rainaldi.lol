import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB8jQ7dTYBNoIxc4wkO5efTFN883QTyxGQ",
  authDomain: "porto-backend.firebaseapp.com",
  projectId: "porto-backend",
  storageBucket: "porto-backend.firebasestorage.app",
  messagingSenderId: "566364530220",
  appId: "1:566364530220:web:48869a9ed46fa369ee5389",
  measurementId: "G-1PKC7WSMZT"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
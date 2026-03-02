import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAoHPZGroYdaV_ADuwlkY6KbHOpohPe2sw",
  authDomain: "servox-24f97.firebaseapp.com",
  projectId: "servox-24f97",
  storageBucket: "servox-24f97.firebasestorage.app",
  messagingSenderId: "872657725817",
  appId: "1:872657725817:web:f2fecb8921add4f36da7a8",
  measurementId: "G-E5901BHLBC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

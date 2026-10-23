import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDdJ-A7HLoO-MpQ9iF6J4rIYsfFDeForCQ",
  authDomain: "gen-lang-client-0187426344.firebaseapp.com",
  projectId: "gen-lang-client-0187426344",
  storageBucket: "gen-lang-client-0187426344.firebasestorage.app",
  messagingSenderId: "818472187665",
  appId: "1:818472187665:web:855f472d2a2c32a101feb0",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
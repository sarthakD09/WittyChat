import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "novion-schat.firebaseapp.com",
  projectId: "novion-schat",
  storageBucket: "novion-schat.firebasestorage.app",
  messagingSenderId: "895656635994",
  appId: "1:895656635994:web:5daa6614a0412983b37263"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

// Suas credenciais extraídas do FIREBASE.docx
const firebaseConfig = {
  apiKey: "AIzaSyBIvOoNLoVMqITyAVRI_9ASOIi9ANIlrkQ",
  authDomain: "cronoz-app-2026.firebaseapp.com",
  projectId: "cronoz-app-2026",
  storageBucket: "cronoz-app-2026.appspot.com",
  messagingSenderId: "365020473531",
  appId: "1:365020473531:web:2c87515591c28f0995c026",
  measurementId: "G-9L6EETNY65"
};

// Inicialização
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

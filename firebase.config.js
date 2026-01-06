// firebase-config.js - Configuração Firebase v9 modular
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { 
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { 
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

// Sua configuração Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBIvOoNLoVMqITyAVRI_9ASOIi9ANIlrkQ",
  authDomain: "cronoz-app-2026.firebaseapp.com",
  projectId: "cronoz-app-2026",
  storageBucket: "cronoz-app-2026.firebasestorage.app",
  messagingSenderId: "961118541246",
  appId: "1:961118541246:web:5b8afd85ecfa41969795ef"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar serviços
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Exportar métodos Firebase
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  ref,
  uploadBytes,
  getDownloadURL
};

// Verificar conexão
console.log("Firebase configurado com sucesso!");

// ... configuração ...

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Exportar
export { app, auth, db };
export default app;

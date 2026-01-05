// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";

// SUA CONFIGURAÇÃO (mantendo analytics)
const firebaseConfig = {
  apiKey: "AIzaSyBIvOoNLoVMqITyAVRI_9ASOIi9ANIlrkQ",
  authDomain: "cronoz-app-2026.firebaseapp.com",
  projectId: "cronoz-app-2026",
  storageBucket: "cronoz-app-2026.firebasestorage.app",
  messagingSenderId: "961118541246",
  appId: "1:961118541246:web:5b8afd85ecfa41969795ef",
  measurementId: "G-5MKXDX2HR6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export for use in other files
export { app, analytics, auth, db, storage };

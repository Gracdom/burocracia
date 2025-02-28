import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD6VwYbDhPiE1I47tmHcZ7P5N8nTT7fhDE",
  authDomain: "burocraciacero-2637.firebaseapp.com",
  projectId: "burocraciacero-2637",
  storageBucket: "burocraciacero-2637.firebasestorage.app",
  messagingSenderId: "970776000492",
  appId: "1:970776000492:web:97054ab72b48e63bea32c9",
  measurementId: "G-5EB64EQEFT",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
const db = getFirestore(app);

// Exportar los objetos
export { app, db };

// Verificar que Firebase se ha inicializado correctamente
console.log("Firebase Initialized:", app);

// Hacer `app` y `db` accesibles globalmente para pruebas (SOLO EN DESARROLLO)
if (typeof window !== "undefined") {
  window.app = app;
  window.db = db;
}

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOnQFoDEREzPyxgAD9fh73UzOPTchDsiU",
  authDomain: "factplusconsole.firebaseapp.com",
  projectId: "factplusconsole",
  storageBucket: "factplusconsole.firebasestorage.app",
  messagingSenderId: "975828645052",
  appId: "1:975828645052:web:dc1572bec2808660af4cb9",
  measurementId: "G-2EN795Q4BM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Export Firestore and Auth instances
export const db = getFirestore(app);
export const auth = getAuth(app);

// Auth Providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Configure providers
googleProvider.addScope("profile");
googleProvider.addScope("email");

githubProvider.addScope("user:email");

export default app;
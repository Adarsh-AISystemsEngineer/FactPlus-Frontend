import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

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

// Initialize Authentication and get a reference to the service
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth Providers
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

// Configure providers
googleProvider.addScope("profile");
googleProvider.addScope("email");

githubProvider.addScope("user:email");

export default app;

import { useEffect, useState } from "react";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from "firebase/auth";
import { auth, googleProvider, githubProvider } from "@/firebase";

export interface AuthUser extends FirebaseUser {
  authProvider?: string;
}

// Helper to get and refresh ID token
async function getIdToken(force = false): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");
  
  const token = await user.getIdToken(force);
  localStorage.setItem("factplus_token", token);
  localStorage.setItem("factplus_uid", user.uid);
  return token;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("factplus_token");
    const savedUid = localStorage.getItem("factplus_uid");
    
    if (savedToken && savedUid) {
      // Try to restore from localStorage
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        try {
          if (currentUser) {
            // Verify token with backend on auth state change
            const idToken = await currentUser.getIdToken();
            
            const response = await fetch("/api/auth/verify-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken }),
            });

            if (!response.ok) {
              throw new Error("Failed to verify token with backend");
            }

            // Store token
            await getIdToken();
            setUser(currentUser as AuthUser);
          } else {
            localStorage.removeItem("factplus_token");
            localStorage.removeItem("factplus_uid");
            setUser(null);
          }
        } catch (err: any) {
          console.error("Auth state change error:", err);
          setError(err.message);
          localStorage.removeItem("factplus_token");
          localStorage.removeItem("factplus_uid");
          setUser(null);
        } finally {
          setLoading(false);
        }
      });

      return () => unsubscribe();
    } else {
      // No saved credentials, just listen to auth changes
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        try {
          if (currentUser) {
            // Verify token with backend on auth state change
            const idToken = await currentUser.getIdToken();
            
            const response = await fetch("/api/auth/verify-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken }),
            });

            if (!response.ok) {
              throw new Error("Failed to verify token with backend");
            }

            // Store token
            await getIdToken();
            setUser(currentUser as AuthUser);
          } else {
            localStorage.removeItem("factplus_token");
            localStorage.removeItem("factplus_uid");
            setUser(null);
          }
        } catch (err: any) {
          console.error("Auth state change error:", err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      });

      return () => unsubscribe();
    }
  }, []);

  // Google Sign In
  const signInWithGoogle = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, googleProvider);
      await getIdToken();
      return result.user;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to sign in with Google";
      setError(errorMessage);
      throw error;
    }
  };

  // GitHub Sign In
  const signInWithGithub = async () => {
    try {
      setError(null);
      const result = await signInWithPopup(auth, githubProvider);
      await getIdToken();
      return result.user;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to sign in with GitHub";
      setError(errorMessage);
      throw error;
    }
  };

  // Email & Password Sign Up
  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName?: string
  ) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      await getIdToken();
      // Set user immediately to trigger redirect
      setUser(result.user as AuthUser);
      return result.user;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to sign up";
      setError(errorMessage);
      throw error;
    }
  };

  // Email & Password Sign In
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      await getIdToken();
      return result.user;
    } catch (error: any) {
      const errorMessage = error.message || "Failed to sign in";
      setError(errorMessage);
      throw error;
    }
  };

  // Sign Out
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      localStorage.removeItem("factplus_token");
      localStorage.removeItem("factplus_uid");
      setUser(null);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to sign out";
      setError(errorMessage);
      throw error;
    }
  };

  // Get current token
  const getToken = () => localStorage.getItem("factplus_token");

  // Update user profile (display name)
  const updateUserProfile = async (displayName: string) => {
    if (!auth.currentUser) throw new Error("No authenticated user");
    try {
      await updateProfile(auth.currentUser, { displayName });
      setUser({ ...auth.currentUser } as AuthUser);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to update profile";
      setError(errorMessage);
      throw error;
    }
  };

  // Delete user account (requires password for reauthentication)
  const deleteAccount = async (password: string) => {
    if (!auth.currentUser || !auth.currentUser.email) {
      throw new Error("No authenticated user");
    }

    try {
      setError(null);
      
      // Reauthenticate user before deletion
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        password
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Delete user account
      await deleteUser(auth.currentUser);

      // Clean up localStorage
      localStorage.removeItem("factplus_token");
      localStorage.removeItem("factplus_uid");
      setUser(null);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to delete account";
      setError(errorMessage);
      throw error;
    }
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithGithub,
    signUpWithEmail,
    signInWithEmail,
    logout,
    getToken,
    updateUserProfile,
    deleteAccount,
  };
}

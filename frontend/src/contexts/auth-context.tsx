import React, { createContext, useContext, ReactNode } from "react";
import { useAuth, AuthUser } from "@/hooks/use-auth";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<AuthUser | undefined>;
  signInWithGithub: () => Promise<AuthUser | undefined>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<AuthUser | undefined>;
  signInWithEmail: (email: string, password: string) => Promise<AuthUser | undefined>;
  logout: () => Promise<void>;
  getToken: () => string | null;
  updateUserProfile: (displayName: string) => Promise<void>;
  deleteAccount: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}

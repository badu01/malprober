// src/renderer/contexts/AuthContext.tsx (UPDATED)
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { firebaseAuth, UserData } from '../renderer/firebase/authService';
import { scanHistoryService } from '../renderer/firebase/scanHistoryService';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'researcher' | 'user';
  photoURL?: string | null;
  createdAt: Date;
  scanCount: number;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loading: boolean;
  userStats: {
    totalScans: number;
    maliciousCount: number;
    suspiciousCount: number;
    safeCount: number;
    avgConfidence: number;
  } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<AuthContextType['userStats']>(null);

  useEffect(() => {
    // Listen to Firebase auth state
    const unsubscribe = firebaseAuth.onAuthStateChange(async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        // Get additional user data from Firestore
        let userData = await firebaseAuth.getUserData(fbUser.uid);
        if (!userData) {
          await new Promise(resolve => setTimeout(resolve, 500));
          userData = await firebaseAuth.getUserData(fbUser.uid);
        }

        if (userData) {
          const mappedUser: User = {
            id: fbUser.uid,
            username: userData.displayName || fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || '',
            role: userData.role,
            photoURL: fbUser.photoURL || userData.photoURL,
            createdAt: userData.createdAt,
            scanCount: userData.scanCount
          };
          setUser(mappedUser);

          // Load user stats
          const stats = await scanHistoryService.getUserStats();
          setUserStats(stats);
        }
      } else {
        setUser(null);
        setUserStats(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await firebaseAuth.signInWithEmail(email, password);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      await firebaseAuth.signInWithGoogle();
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    try {
      const fbUser = await firebaseAuth.signUpWithEmail(email, password, username);
      // User document is created automatically in the auth service
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await firebaseAuth.signOut();

      // Clear immediately
      setUser(null);
      setFirebaseUser(null);
      setUserStats(null);

    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    await firebaseAuth.resetPassword(email);
  };

  const value = {
    user,
    firebaseUser,
    isAuthenticated: !!firebaseUser && !!user,
    login,
    loginWithGoogle,
    logout,
    register,
    resetPassword,
    loading,
    userStats
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
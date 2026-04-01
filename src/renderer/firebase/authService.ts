// src/renderer/services/firebase/authService.ts (Complete fixed version)

import {
    auth,
    googleProvider,
    db
} from './config';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    User as FirebaseUser,
    onAuthStateChanged
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp
} from 'firebase/firestore';

export interface UserData {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    role: 'admin' | 'researcher' | 'user';
    createdAt: Date;
    lastLogin: Date;
    scanCount: number;
    apiCalls: number;
    isActive: boolean;
}

class FirebaseAuthService {
    private currentUser: FirebaseUser | null = null;
    private authListeners: ((user: FirebaseUser | null) => void)[] = [];

    constructor() {
        onAuthStateChanged(auth, this.handleAuthStateChange);
    }

    private handleAuthStateChange = async (user: FirebaseUser | null) => {
        this.currentUser = user;

        if (user) {
            await this.updateUserLastLogin(user.uid);
        }

        this.authListeners.forEach(listener => listener(user));
    };

    // Add auth state listener
    onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
        this.authListeners.push(callback);
        return () => {
            this.authListeners = this.authListeners.filter(cb => cb !== callback);
        };
    }

    // Get current user
    getCurrentUser(): FirebaseUser | null {
        return this.currentUser;
    }

    // Update user's last login timestamp
    private async updateUserLastLogin(userId: string): Promise<void> {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                await updateDoc(userRef, {
                    lastLogin: new Date()
                });
            }
        } catch (error) {
            console.error('Error updating last login:', error);
        }
    }

    // Create user document in Firestore
    private async createUserDocument(user: FirebaseUser, role: 'admin' | 'researcher' | 'user' = 'user'): Promise<void> {
        try {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                const userData: UserData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
                    photoURL: user.photoURL,
                    role: role,
                    createdAt: new Date(),
                    lastLogin: new Date(),
                    scanCount: 0,
                    apiCalls: 0,
                    isActive: true
                };

                await setDoc(userRef, userData);
            } else {
                // Update last login
                await updateDoc(userRef, {
                    lastLogin: new Date()
                });
            }
        } catch (error) {
            console.error('Error creating user document:', error);
        }
    }

    // Email/Password Sign Up
    async signUpWithEmail(email: string, password: string, displayName: string): Promise<FirebaseUser> {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update profile with display name
            await updateProfile(user, { displayName });

            // Create user document
            await this.createUserDocument(user);

            return user;
        } catch (error: any) {
            console.error('Sign up error:', error);
            throw new Error(this.getErrorMessage(error.code));
        }
    }

    // Email/Password Sign In
    async signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update user document
            await this.createUserDocument(user);

            return user;
        } catch (error: any) {
            console.error('Sign in error:', error);
            throw new Error(this.getErrorMessage(error.code));
        }
    }

    // Google Sign In
    async signInWithGoogle(): Promise<FirebaseUser> {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            // Create user document
            await this.createUserDocument(user);

            return user;
        } catch (error: any) {
            console.error('Google sign in error:', error);
            throw new Error(this.getErrorMessage(error.code));
        }
    }

    // Sign Out
    async signOut(): Promise<void> {
        try {
            await signOut(auth);

            // Force update locally
            this.currentUser = null;
            this.authListeners.forEach(listener => listener(null));

        } catch (error: any) {
            console.error('Sign out error:', error);
            throw new Error(this.getErrorMessage(error.code));
        }
    }

    // Reset Password
    async resetPassword(email: string): Promise<void> {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error: any) {
            console.error('Password reset error:', error);
            throw new Error(this.getErrorMessage(error.code));
        }
    }

    // Update user scan count
    async incrementScanCount(userId: string): Promise<void> {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const currentCount = userSnap.data().scanCount || 0;
                await updateDoc(userRef, {
                    scanCount: currentCount + 1,
                    lastScan: new Date()
                });
            }
        } catch (error) {
            console.error('Error incrementing scan count:', error);
        }
    }

    // Update user API calls
    async incrementApiCalls(userId: string): Promise<void> {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const currentCalls = userSnap.data().apiCalls || 0;
                await updateDoc(userRef, {
                    apiCalls: currentCalls + 1
                });
            }
        } catch (error) {
            console.error('Error incrementing API calls:', error);
        }
    }

    // Get user data
    async getUserData(userId: string): Promise<UserData | null> {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                return userSnap.data() as UserData;
            }
            return null;
        } catch (error) {
            console.error('Get user data error:', error);
            return null;
        }
    }

    // Update user role (admin only)
    async updateUserRole(userId: string, role: 'admin' | 'researcher' | 'user'): Promise<void> {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { role });
        } catch (error) {
            console.error('Error updating user role:', error);
        }
    }

    // Get error message
    private getErrorMessage(errorCode: string): string {
        const errors: Record<string, string> = {
            'auth/email-already-in-use': 'Email already in use',
            'auth/invalid-email': 'Invalid email address',
            'auth/user-disabled': 'Account disabled',
            'auth/user-not-found': 'User not found',
            'auth/wrong-password': 'Wrong password',
            'auth/weak-password': 'Password too weak (min 6 characters)',
            'auth/operation-not-allowed': 'Operation not allowed',
            'auth/popup-closed-by-user': 'Sign in cancelled',
            'auth/network-request-failed': 'Network error. Check connection',
            'auth/too-many-requests': 'Too many failed attempts. Try again later',
        };

        return errors[errorCode] || 'Authentication failed';
    }
}

export const firebaseAuth = new FirebaseAuthService();
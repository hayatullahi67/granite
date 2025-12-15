
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc
} from '../services/firebase';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (user: Partial<User> & { password: string }) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for Firebase Auth state changes using modular function
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
      if (firebaseUser) {
        try {
          // Fetch the extra user details (Role, Name) from 'users' collection
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            // Merge Auth UID with Firestore Data
            setUser({ id: firebaseUser.uid, ...userDoc.data() } as User);
          } else {
            // Self-healing: If user exists in Auth but not Firestore, create a default profile
            const newUserProfile: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                role: UserRole.CLERK, // Default role
                avatar: ''
            };
            await setDoc(userDocRef, newUserProfile);
            setUser(newUserProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const signup = async (newUser: Partial<User> & { password: string }) => {
     try {
       // 1. Create Auth User
       const userCredential = await createUserWithEmailAndPassword(auth, newUser.email!, newUser.password);
       const uid = userCredential.user!.uid;

       // 2. Create Firestore User Document
       const roleToAssign = newUser.role || UserRole.CLERK;

       const userPayload: User = {
         id: uid, 
         name: newUser.name!,
         email: newUser.email!,
         role: roleToAssign 
       };

       await setDoc(doc(db, 'users', uid), userPayload);
       return true;
     } catch (error) {
       console.error("Signup failed:", error);
       return false;
     }
  }

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isAuthenticated: !!user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const ADMIN_EMAIL = 'joe12882@gmail.com';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            // Overwrite role locally so the app sees them as master
            if (data.email === ADMIN_EMAIL) data.role = 'master';
            setProfile(data);
            localStorage.setItem('analy_user_profile', JSON.stringify(data));
          } else {
            // New user registration
            const isMaster = firebaseUser.email === ADMIN_EMAIL;
            const newProfileData = {
              email: firebaseUser.email || '',
              role: isMaster ? 'master' : 'user',
              createdAt: serverTimestamp(),
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || ''
            };
            
            try {
               await setDoc(userRef, newProfileData);
               
               const freshSnap = await getDoc(userRef);
               if (freshSnap.exists()) {
                 const data = freshSnap.data() as UserProfile;
                 if (data.email === ADMIN_EMAIL) data.role = 'master';
                 setProfile(data);
                 localStorage.setItem('analy_user_profile', JSON.stringify(data));
               }
            } catch (err) {
               handleFirestoreError(err, 'create', `/users/${firebaseUser.uid}`);
            }
          }
        } catch (error) {
          console.error("Auth DB Fetch Error", error);
        }
      } else {
        setProfile(null);
        localStorage.removeItem('analy_user_profile');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut: logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

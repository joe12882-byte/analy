import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile as updateFirebaseProfile,
  signOut,
  sendPasswordResetEmail,
  updatePassword
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  getDocFromServer,
  setDoc, 
  serverTimestamp, 
  updateDoc 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';
import { safeStorage } from '../lib/storage';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, pass?: string) => Promise<void>;
  signUpWithEmail: (email: string, name: string, occupation: string) => Promise<void>;
  changePassword: (newPass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ADMIN_EMAIL = 'joe12882@gmail.com';
const STUDENT_KEY = 'analy_student_2026';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  // Use callback for loadProfile to keep identity stable
  const loadProfile = useCallback(async (u: User) => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', u.uid);
      const snap = await getDocFromServer(userRef).catch(() => getDoc(userRef));
      
      if (!isMounted.current) return;

      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        if (u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) data.role = 'master';
        setProfile(data);
      } else {
        const isMaster = u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        const freshProfile = {
          email: u.email?.toLowerCase() || '',
          displayName: u.displayName || (isMaster ? 'Master JOE' : 'Usuario Analy'),
          role: isMaster ? 'master' : 'student',
          occupation: 'Usuario General',
          onboarded: isMaster, 
          analyCalibrated: isMaster,
          createdAt: serverTimestamp()
        };

        await setDoc(userRef, freshProfile);
        if (!isMounted.current) return;
        
        setProfile({
          ...freshProfile,
          uid: u.uid,
          createdAt: new Date().toISOString()
        } as any);
      }
    } catch (e) {
      console.error("Critical Profile Error", e);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!isMounted.current) return;
      setUser(u);
      if (u) {
        loadProfile(u).catch(e => console.error("Profile Load Failed", e));
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted.current = false;
      unsub();
    };
  }, [loadProfile]);

  const signInWithEmail = async (email: string, pass?: string) => {
    const emailLower = email.toLowerCase().trim();
    const isMaster = emailLower === ADMIN_EMAIL.toLowerCase();
    const finalPass = isMaster ? (pass || '') : STUDENT_KEY;
    
    if (isMaster && !pass) throw new Error('Master, ingresa tu clave de seguridad.');
    
    try {
      await signInWithEmailAndPassword(auth, emailLower, finalPass);
    } catch (e: any) {
      // Si el alumno no existe, intentamos registrarlo directamente (Flujo ultra-simple)
      if (e.code === 'auth/user-not-found' && !isMaster) {
         throw new Error('FRESH_USER'); // Señal para el frontend
      }
      throw e;
    }
  };

  const signUpWithEmail = async (email: string, name: string, occupation: string) => {
    const emailLower = email.toLowerCase().trim();
    const isMaster = emailLower === ADMIN_EMAIL.toLowerCase();
    const finalPass = isMaster ? 'Joel120885.' : STUDENT_KEY; // Clave Master por defecto o Estudiante

    const res = await createUserWithEmailAndPassword(auth, emailLower, finalPass);
    await updateFirebaseProfile(res.user, { displayName: name });

    const newProfile: UserProfile = {
      uid: res.user.uid,
      email: emailLower,
      displayName: name,
      occupation,
      role: isMaster ? 'master' : 'student',
      onboarded: true,
      analyCalibrated: false,
      createdAt: new Date().toISOString(),
      conversations_count: 0,
      saved_objects_count: 0,
      last_login: new Date().toISOString(),
      support_code: isMaster ? finalPass : 'STUDENT'
    };
    await setDoc(doc(db, 'users', res.user.uid), newProfile);
    setProfile(newProfile);
  };

  const changePassword = async (newPass: string) => {
    if (!user || user.email !== ADMIN_EMAIL) throw new Error('Acceso denegado');
    await updatePassword(user, newPass);
    await updateDoc(doc(db, 'users', user.uid), { support_code: newPass });
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), { ...data, updatedAt: serverTimestamp() });
    await loadProfile(user);
  };

  const logout = async () => {
    await signOut(auth);
    safeStorage.clear();
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ 
      user, profile, loading, 
      signInWithEmail, signUpWithEmail, 
      changePassword, resetPassword, 
      updateProfile: updateProfileData, 
      logout, refreshProfile: () => user && loadProfile(user)
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

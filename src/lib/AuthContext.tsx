import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  type User, 
  onAuthStateChanged, 
  signInAnonymously, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export type UserRole = 'trainee' | 'coach' | null;
const BERNARDO_PROFILE_PHOTO_URL = '/bernardo-profile-pic.jpg';

interface UserProfile {
  uid: string;
  role: UserRole;
  coachId?: string; // If trainee, who is the coach
  traineeId?: string; // If coach, who is the linked trainee
  name: string;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: UserRole, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function withDefaultProfilePhoto(profile: UserProfile, authPhotoURL?: string | null) {
  if (profile.role === 'trainee' && profile.name.trim().toLowerCase() === 'bernardo') {
    return {
      ...profile,
      photoURL: BERNARDO_PROFILE_PHOTO_URL,
    };
  }

  if (!profile.photoURL && authPhotoURL) {
    return {
      ...profile,
      photoURL: authPhotoURL,
    };
  }

  return profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Fetch custom profile from Firestore
        if (db) {
          try {
            const docRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              const storedProfile = docSnap.data() as UserProfile;
              const hydratedProfile = withDefaultProfilePhoto(storedProfile, currentUser.photoURL);

              if (hydratedProfile.role === 'coach' && !hydratedProfile.traineeId) {
                // Find a trainee to link
                const { collection, query, where, getDocs, limit } = await import('firebase/firestore');
                const q = query(collection(db, 'users'), where('role', '==', 'trainee'), limit(1));
                const traineesSnap = await getDocs(q);
                if (!traineesSnap.empty) {
                  hydratedProfile.traineeId = traineesSnap.docs[0].id;
                }
              }

              if (hydratedProfile.photoURL !== storedProfile.photoURL || hydratedProfile.traineeId !== storedProfile.traineeId) {
                await setDoc(docRef, hydratedProfile, { merge: true });
              }

              setProfile(hydratedProfile);
            } else {
              setProfile(null); // Needs onboarding
            }
          } catch (error) {
            console.error("Error fetching user profile", error);
            setProfile(null);
          }
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginAnonymously = async () => {
    if (!auth) return;
    await signInAnonymously(auth);
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const setRole = async (role: UserRole, name: string) => {
    if (!user || !db) return;
    
    const newProfile = withDefaultProfilePhoto({
      uid: user.uid,
      role,
      name
    }, user.photoURL);
    
    await setDoc(doc(db, 'users', user.uid), newProfile);
    setProfile(newProfile);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithGoogle, loginAnonymously, logout, setRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

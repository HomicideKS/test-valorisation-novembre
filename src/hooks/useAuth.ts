import { useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { UserProfile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(true);
      
      try {
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const profileDoc = await getDoc(userDocRef);
          
          if (profileDoc.exists()) {
            setProfile(profileDoc.data() as UserProfile);
          } else {
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    username: string
  ) => {
    try {
      setError(null);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      const profile: UserProfile = {
        uid: user.uid,
        email,
        firstName,
        lastName,
        username,
        createdAt: Date.now()
      };
      
      await setDoc(doc(db, 'users', user.uid), profile);
      setProfile(profile);
    } catch (err: any) {
      let message = "Erreur lors de la création du compte";
      if (err.code === 'auth/email-already-in-use') {
        message = 'Cet email est déjà enregistré';
      } else if (err.code === 'auth/weak-password') {
        message = 'Le mot de passe doit contenir au moins 6 caractères';
      }
      setError(message);
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      const message = 'Email ou mot de passe invalide';
      setError(message);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      const message = err.code === 'auth/user-not-found' 
        ? 'Aucun compte trouvé avec cet email'
        : "Erreur lors de l'envoi de l'email de réinitialisation";
      setError(message);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
      setUser(null);
      setProfile(null);
    } catch (err) {
      setError('Erreur lors de la déconnexion');
      throw err;
    }
  };

  return {
    user,
    profile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword
  };
}
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { generateKeyPair } from '../crypto';
import { UserData } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authErrorCode, setAuthErrorCode] = useState('');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // If we are offline and user is null, it might be that the cache hasn't loaded yet.
      // Don't stop loadingAuth yet.
      if (!user && !navigator.onLine) {
        return;
      }
      
      clearTimeout(timeoutId);
      setUser(user);
      setLoadingAuth(false);
    });

    // Force stop loading after 5 seconds if auth state hasn't resolved
    timeoutId = setTimeout(() => {
      setLoadingAuth(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setAuthError('');
    setAuthErrorCode('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setAuthErrorCode(error.code);
      setAuthError(getErrorMessage(error.code));
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    setAuthError('');
    setAuthErrorCode('');
    try {
      // Start generating keys immediately
      const keyPromise = generateKeyPair();
      
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Wait for keys
      const { publicKeyJwk, privateKeyJwk } = await keyPromise;
      const uniqueCode = Math.random().toString(36).substring(2, 15).toUpperCase();
      
      const userData: UserData = {
        uid: user.uid,
        displayName,
        email,
        uniqueCode,
        publicKey: publicKeyJwk,
        contacts: []
      };

      // Parallelize Firestore update and Profile update
      await Promise.all([
        setDoc(doc(db, 'users', user.uid), userData),
        setDoc(doc(db, 'privateKeys', user.uid), { uid: user.uid, key: privateKeyJwk }),
        updateProfile(user, { displayName })
      ]);
      
      localStorage.setItem(`privateKey_${user.uid}`, JSON.stringify(privateKeyJwk));
    } catch (error: any) {
      setAuthErrorCode(error.code);
      setAuthError(getErrorMessage(error.code));
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/user-not-found': return 'Usuário não encontrado.';
      case 'auth/wrong-password': return 'Senha incorreta.';
      case 'auth/email-already-in-use': return 'Este e-mail já está sendo usado.';
      case 'auth/weak-password': return 'A senha deve ter pelo menos 6 caracteres.';
      case 'auth/invalid-email': return 'E-mail inválido.';
      default: return 'Ocorreu um erro. Tente novamente.';
    }
  };

  return { user, loadingAuth, authError, authErrorCode, login, register, logout };
};

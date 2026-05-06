import { useState, useEffect } from 'react';
import { auth, db, backupDb, backupAuth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut, onAuthStateChanged, User, signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
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
      if (!user && !navigator.onLine) {
        return;
      }
      
      clearTimeout(timeoutId);
      setUser(user);
      setLoadingAuth(false);

      if (user && !backupAuth.currentUser) {
        signInAnonymously(backupAuth).catch(() => {
          console.warn("[Auth] Backup desativado: Login anônimo não permitido no Servidor de Backup.");
        });
      }
    });

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

  const loginWithGoogle = async () => {
    setAuthError('');
    setAuthErrorCode('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      setAuthErrorCode(error.code);
      setAuthError(getErrorMessage(error.code));
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    setAuthError('');
    setAuthErrorCode('');
    try {
      const keyPromise = generateKeyPair();
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const { publicKeyJwk, privateKeyJwk } = await keyPromise;
      const uniqueCode = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join('');
      
      const userData: UserData = {
        uid: user.uid,
        displayName,
        email,
        uniqueCode,
        publicKey: publicKeyJwk,
        contacts: []
      };

      await Promise.all([
        setDoc(doc(db, 'users', user.uid), userData),
        setDoc(doc(db, 'privateKeys', user.uid), { uid: user.uid, key: privateKeyJwk }),
        updateProfile(user, { displayName }),
        setDoc(doc(backupDb, 'userBackups', uniqueCode), userData),
        setDoc(doc(backupDb, 'privateKeyBackups', uniqueCode), { key: privateKeyJwk })
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

  const completeGoogleProfile = async (displayName: string) => {
    if (!auth.currentUser) throw new Error('Sessao invalida.');
    const user = auth.currentUser;
    const trimmedName = displayName.trim().slice(0, 10);
    if (!trimmedName) throw new Error('Nome invalido.');

    const existing = await getDoc(doc(db, 'users', user.uid));
    if (existing.exists()) return;

    const { publicKeyJwk, privateKeyJwk } = await generateKeyPair();
    const uniqueCode = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10)).join('');
    const userData: UserData = {
      uid: user.uid,
      displayName: trimmedName,
      email: user.email || '',
      uniqueCode,
      publicKey: publicKeyJwk,
      contacts: []
    };

    await Promise.all([
      setDoc(doc(db, 'users', user.uid), userData),
      setDoc(doc(db, 'privateKeys', user.uid), { uid: user.uid, key: privateKeyJwk }),
      updateProfile(user, { displayName: trimmedName }),
      setDoc(doc(backupDb, 'userBackups', uniqueCode), userData),
      setDoc(doc(backupDb, 'privateKeyBackups', uniqueCode), { key: privateKeyJwk })
    ]);

    localStorage.setItem(`privateKey_${user.uid}`, JSON.stringify(privateKeyJwk));
  };

  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'E-mail ou senha incorretos.';
      case 'auth/email-already-in-use':
        return 'Este e-mail já está sendo usado por outra conta.';
      case 'auth/weak-password':
        return 'A senha é muito fraca. Use pelo menos 6 caracteres.';
      case 'auth/invalid-email':
        return 'O formato do e-mail é inválido.';
      case 'auth/too-many-requests':
        return 'Muitas tentativas sem sucesso. Tente novamente mais tarde.';
      default:
        return 'Ocorreu uma falha no acesso. Verifique sua conexão e tente de novo.';
    }
  };

  return { user, loadingAuth, authError, authErrorCode, login, register, loginWithGoogle, completeGoogleProfile, logout };
};

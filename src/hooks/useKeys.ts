import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

export const useKeys = (user: User | null) => {
  const [privateKey, setPrivateKey] = useState<JsonWebKey | null>(null);

  useEffect(() => {
    if (!user) {
      setPrivateKey(null);
      return;
    }

    const loadPrivateKey = async () => {
      try {
        // 1. Try to load from localStorage
        const savedPrivateKey = localStorage.getItem(`privateKey_${user.uid}`);
        if (savedPrivateKey) {
          setPrivateKey(JSON.parse(savedPrivateKey));
          return;
        }

        // 2. If not in localStorage, try to fetch from Firestore
        console.log('[Chat] Private key not found locally. Attempting to restore from server...');
        const keyDoc = await getDoc(doc(db, 'privateKeys', user.uid));
        
        if (keyDoc.exists() && keyDoc.data().key) {
          const restoredKey = keyDoc.data().key;
          localStorage.setItem(`privateKey_${user.uid}`, JSON.stringify(restoredKey));
          setPrivateKey(restoredKey);
          console.log('[Chat] Private key restored from server successfully.');
          return;
        }

        // 3. If not in Firestore (e.g., old account), generate a new one
        console.log('[Chat] Private key not found on server. Generating new keys...');
        const { publicKeyJwk, privateKeyJwk } = await import('../crypto').then(m => m.generateKeyPair());
        
        const batch = writeBatch(db);
        batch.update(doc(db, 'users', user.uid), { publicKey: publicKeyJwk });
        batch.set(doc(db, 'privateKeys', user.uid), { uid: user.uid, key: privateKeyJwk });
        await batch.commit();
        
        localStorage.setItem(`privateKey_${user.uid}`, JSON.stringify(privateKeyJwk));
        setPrivateKey(privateKeyJwk);
        console.log('[Chat] New keys generated and saved to server.');
      } catch (error) {
        console.error('[Chat] Error loading or restoring private key:', error);
      }
    };

    loadPrivateKey();
  }, [user]);

  return { privateKey };
};

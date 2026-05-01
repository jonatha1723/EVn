import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Configuração do Servidor de Backup (testeeeee)
const backupConfig = {
  apiKey: "AIzaSyBiSs-z3089P6-9fx5z-uLn6fVYilot22U",
  authDomain: "testeeeee-12894.firebaseapp.com",
  projectId: "testeeeee-12894",
  storageBucket: "testeeeee-12894.firebasestorage.app",
  messagingSenderId: "728327375572",
  appId: "1:728327375572:web:4439521092b8abf6640941",
  measurementId: "G-0CFC9N0HM1"
};

// Servidor Principal (EVn)
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
}, (firebaseConfig as any).firestoreDatabaseId || '(default)');
export const storage = getStorage(app);

// Servidor de Backup
const backupApp = initializeApp(backupConfig, "backup");
export const backupDb = initializeFirestore(backupApp, {
  localCache: persistentLocalCache({tabManager: persistentMultipleTabManager()})
});
export const backupAuth = getAuth(backupApp);


export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  // Saneamento: Não expomos dados do usuário (authInfo) no log ou erro.
  const message = error instanceof Error ? error.message : String(error);
  const errorCode = (error as any)?.code || 'unknown';
  
  console.error(`[Firestore Error] Op: ${operationType} | Code: ${errorCode}`);
  
  // Retornamos um erro genérico para a interface
  throw new Error(`Erro no banco de dados (${operationType}). Por favor, tente novamente.`);
}

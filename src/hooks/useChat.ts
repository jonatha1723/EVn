import { useState, useEffect, useRef, useMemo } from 'react';
import { User } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, addDoc, serverTimestamp, arrayUnion, writeBatch, deleteDoc, limit, getDocs, getDoc, setDoc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, storage } from '../firebase';
import { encryptMessage, decryptMessage, encryptData } from '../crypto';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserData, Message, DecryptedMessage } from '../types';
import { useKeys } from './useKeys';
import { useSocket } from './useSocket';
import { compressImage } from '../lib/imageUtils';

export const useChat = (user: User | null) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [contacts, setContacts] = useState<UserData[]>([]);
  const [activeContact, setActiveContact] = useState<UserData | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [pendingMessages, setPendingMessages] = useState<DecryptedMessage[]>([]);
  const [messageLimit, setMessageLimit] = useState(50);
  
  const { privateKey } = useKeys(user);
  const { isContactTyping, setTypingStatus } = useSocket(user, activeContact);

  const [localDeletedMessages, setLocalDeletedMessages] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('deletedMessages');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Merge pending and firestore messages
  const allMessages = useMemo(() => {
    // Filter out pending messages that are already in the firestore messages (by clientTimestamp)
    const firestoreTimestamps = new Set(messages.map(m => m.clientTimestamp));
    const uniquePending = pendingMessages.filter(m => !firestoreTimestamps.has(m.clientTimestamp));
    
    return [...messages, ...uniquePending].sort((a, b) => a.clientTimestamp - b.clientTimestamp);
  }, [messages, pendingMessages]);

  // Cleanup pending messages that are now in Firestore
  useEffect(() => {
    if (pendingMessages.length === 0) return;
    const firestoreTimestamps = new Set(messages.map(m => m.clientTimestamp));
    const stillPending = pendingMessages.filter(m => !firestoreTimestamps.has(m.clientTimestamp));
    
    if (stillPending.length !== pendingMessages.length) {
      setPendingMessages(stillPending);
    }
  }, [messages, pendingMessages]);

  // Load user data
  useEffect(() => {
    if (!user) {
      setUserData(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data() as UserData);
      }
    }, (error) => {
      console.error("User data snapshot error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // Load contacts
  useEffect(() => {
    if (!userData?.contacts || userData.contacts.length === 0) {
      setContacts([]);
      return;
    }

    const q = query(collection(db, 'users'), where('uid', 'in', userData.contacts));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contactList = snapshot.docs.map(doc => doc.data() as UserData);
      setContacts(contactList);
    }, (error) => {
      console.error("Contacts snapshot error:", error);
    });

    return () => unsubscribe();
  }, [userData?.contacts]);

  // Load messages
  useEffect(() => {
    if (!user || !activeContact || !privateKey) {
      setMessages([]);
      return;
    }

    const chatId = [user.uid, activeContact.uid].sort().join('_');

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('clientTimestamp', 'desc'),
      limit(messageLimit)
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const msgs: DecryptedMessage[] = [];
      for (const docSnap of snapshot.docs) {
        const msgData = { id: docSnap.id, ...docSnap.data() } as Message;
        const isMe = msgData.senderId === user.uid;
        const encryptedKey = isMe ? msgData.encryptedKeyForSender : msgData.encryptedKeyForReceiver;
        
        try {
          const text = await decryptMessage(
            msgData.encryptedContent,
            encryptedKey,
            msgData.iv,
            privateKey
          );
          msgs.push({ ...msgData, text });
        } catch (err) {
          msgs.push({ ...msgData, text: "[Erro ao descriptografar]" });
        }
      }
      
      const sorted = msgs.reverse().filter(m => !localDeletedMessages.has(m.id));
      setMessages(sorted);
    }, (err) => console.error("Chat query error:", err));

    return () => unsub();
  }, [user, activeContact, privateKey, messageLimit, localDeletedMessages]);

  const sendMessage = async (text: string, replyToId?: string) => {
    if (!user || !activeContact || !userData || !text.trim()) return;

    const clientTimestamp = Date.now();
    const chatId = [user.uid, activeContact.uid].sort().join('_');

    // Optimistic update
    const pendingMsg: DecryptedMessage = {
      id: `pending-${clientTimestamp}`,
      senderId: user.uid,
      receiverId: activeContact.uid,
      chatId,
      text,
      encryptedContent: '',
      encryptedKeyForSender: '',
      encryptedKeyForReceiver: '',
      iv: '',
      clientTimestamp,
      replyToId: replyToId || null,
      isUploading: false,
      isPending: true
    };

    setPendingMessages(prev => [...prev, pendingMsg]);

    try {
      const encrypted = await encryptMessage(
        text,
        userData.publicKey,
        activeContact.publicKey
      );

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        receiverId: activeContact.uid,
        chatId,
        ...encrypted,
        timestamp: serverTimestamp(),
        clientTimestamp,
        replyToId: replyToId || null
      });
    } catch (error) {
      setPendingMessages(prev => prev.filter(m => m.clientTimestamp !== clientTimestamp));
      handleFirestoreError(error, OperationType.WRITE, 'messages');
    }
  };

  const sendFile = async (file: File) => {
    if (!user || !activeContact || !userData) return;
    
    if (!file.type.startsWith('image/')) {
      throw new Error("Apenas imagens são permitidas.");
    }

    const clientTimestamp = Date.now();
    const chatId = [user.uid, activeContact.uid].sort().join('_');
    const localUrl = URL.createObjectURL(file);

    // Optimistic update
    const pendingMsg: DecryptedMessage = {
      id: `pending-${clientTimestamp}`,
      senderId: user.uid,
      receiverId: activeContact.uid,
      chatId,
      text: '',
      encryptedContent: '',
      encryptedKeyForSender: '',
      encryptedKeyForReceiver: '',
      iv: '',
      clientTimestamp,
      fileUrl: localUrl,
      fileName: file.name,
      fileType: file.type,
      isUploading: true,
      isPending: true,
      localUrl
    };

    setPendingMessages(prev => [...prev, pendingMsg]);

    try {
      // Compress image if it's larger than 800KB
      let fileToProcess: Blob | File = file;
      if (file.size > 800 * 1024) {
        console.log(`Compressing image: ${file.size / 1024}KB`);
        fileToProcess = await compressImage(file, 800);
        console.log(`Compressed size: ${fileToProcess.size / 1024}KB`);
      }

      const arrayBuffer = await fileToProcess.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      
      const encrypted = await encryptData(
        data,
        userData.publicKey,
        activeContact.publicKey
      );

      const fileRef = ref(storage, `chat_files/${user.uid}/${clientTimestamp}_${file.name}`);
      await uploadBytes(fileRef, encrypted.encryptedContent);
      const fileUrl = await getDownloadURL(fileRef);

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        receiverId: activeContact.uid,
        chatId,
        encryptedContent: '[Arquivo]',
        encryptedKeyForSender: encrypted.encryptedKeyForSender,
        encryptedKeyForReceiver: encrypted.encryptedKeyForReceiver,
        iv: encrypted.iv,
        timestamp: serverTimestamp(),
        clientTimestamp,
        fileUrl,
        fileName: file.name,
        fileType: file.type
      });
    } catch (error) {
      setPendingMessages(prev => prev.filter(m => m.clientTimestamp !== clientTimestamp));
      URL.revokeObjectURL(localUrl);
      handleFirestoreError(error, OperationType.WRITE, 'messages');
    }
  };

  const addContact = async (code: string) => {
    if (!user || !userData || !code.trim()) return;
    if (code === userData.uniqueCode) throw new Error("Você não pode adicionar a si mesmo.");
    
    const q = query(collection(db, 'users'), where('uniqueCode', '==', code));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("Código inválido ou usuário não encontrado.");
    }

    const contactData = querySnapshot.docs[0].data() as UserData;
    
    if (userData.contacts?.includes(contactData.uid)) {
      throw new Error("Contato já adicionado.");
    }
    
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', user.uid), {
      contacts: arrayUnion(contactData.uid)
    });
    batch.update(doc(db, 'users', contactData.uid), {
      contacts: arrayUnion(user.uid)
    });

    await batch.commit();
  };

  const factoryReset = async () => {
    if (!user || user.email !== 'jogonesteterp@gmail.com') {
      console.error("Apenas o administrador pode fazer isso.");
      return;
    }
    
    console.log("Starting factory reset for user:", user.email);
    
    try {
      const batch = writeBatch(db);
      let operationCount = 0;
      
      // Delete all users EXCEPT the admin
      console.log("Fetching users...");
      const usersSnap = await getDocs(collection(db, 'users'));
      console.log(`Found ${usersSnap.size} users`);
      usersSnap.docs.forEach(docSnap => {
        if (docSnap.id !== user.uid) {
          batch.delete(docSnap.ref);
          operationCount++;
        }
      });

      // Delete all private keys EXCEPT the admin
      console.log("Fetching private keys...");
      const privateKeysSnap = await getDocs(collection(db, 'privateKeys'));
      console.log(`Found ${privateKeysSnap.size} private keys`);
      privateKeysSnap.docs.forEach(docSnap => {
        if (docSnap.id !== user.uid) {
          batch.delete(docSnap.ref);
          operationCount++;
        }
      });
      
      // Delete all chats and messages
      console.log("Fetching chats...");
      const chatsSnap = await getDocs(collection(db, 'chats'));
      console.log(`Found ${chatsSnap.size} chats`);
      for (const chatDoc of chatsSnap.docs) {
        console.log(`Fetching messages for chat ${chatDoc.id}...`);
        const messagesSnap = await getDocs(collection(db, 'chats', chatDoc.id, 'messages'));
        console.log(`Found ${messagesSnap.size} messages in chat ${chatDoc.id}`);
        messagesSnap.docs.forEach(msgDoc => {
          batch.delete(msgDoc.ref);
          operationCount++;
        });
        batch.delete(chatDoc.ref);
        operationCount++;
      }
      
      if (operationCount > 500) {
        console.warn(`Warning: Operation count (${operationCount}) exceeds Firestore batch limit (500). This might fail.`);
      }

      console.log(`Committing batch with ${operationCount} operations...`);
      await batch.commit();
      console.log("Factory reset successful! Reloading...");
      window.location.reload(); // Force reload to clear state
    } catch (error) {
      console.error("Factory reset error:", error);
      throw error;
    }
  };

  const deleteMessage = async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    try {
      await deleteDoc(doc(db, 'chats', msg.chatId, 'messages', msgId));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const clearChatLocally = (messageIds: string[]) => {
    setLocalDeletedMessages(prev => {
      const newSet = new Set(prev);
      messageIds.forEach(id => newSet.add(id));
      localStorage.setItem('deletedMessages', JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  return {
    userData,
    contacts,
    activeContact,
    setActiveContact,
    messages: allMessages,
    sendMessage,
    sendFile,
    addContact,
    deleteMessage,
    clearChatLocally,
    factoryReset,
    localDeletedMessages,
    messageLimit,
    setMessageLimit,
    isContactTyping,
    setTypingStatus,
    hasKeys: !!privateKey,
    privateKey
  };
};


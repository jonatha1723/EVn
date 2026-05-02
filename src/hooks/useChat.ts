import { useState, useEffect, useRef, useMemo } from 'react';
import { User } from 'firebase/auth';
import { doc, onSnapshot, collection, query, where, addDoc, serverTimestamp, arrayUnion, writeBatch, deleteDoc, limit, getDocs, getDoc, setDoc, orderBy, limitToLast } from 'firebase/firestore';
import { db, backupDb, handleFirestoreError, OperationType } from '../firebase';
import { encryptMessage, decryptMessage, encryptData } from '../crypto';
import { UserData, Message, DecryptedMessage, LocalDeletedMessage, MessagePosition, Group } from '../types';
import { useKeys } from './useKeys';
import { useSocket } from './useSocket';
import { compressImage } from '../lib/imageUtils';
import { safeToDate, APP_VERSION } from '../lib/dateUtils';
import { localDb } from '../lib/localDb';
import { uploadToCloudinary } from '../lib/cloudinary';

export const useChat = (user: User | null) => {
  console.log(`[EVN] Inicializando Core v${APP_VERSION}`);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [contacts, setContacts] = useState<UserData[]>([]);
  const [activeContact, setActiveContact] = useState<UserData | null>(null);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [backupMessages, setBackupMessages] = useState<DecryptedMessage[]>([]);
  const [pendingMessages, setPendingMessages] = useState<DecryptedMessage[]>([]);
  const [messageLimit, setMessageLimit] = useState(100);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<UserData[]>([]);

  const lastActiveContactId = useRef<string | null>(null);
  const { privateKey } = useKeys(user);
  const { isContactTyping, setTypingStatus } = useSocket(user, activeContact);

  const [localDeletedMessages, setLocalDeletedMessages] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('deletedMessages');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [localDeletedTimes, setLocalDeletedTimes] = useState<Set<number>>(() => {
    const saved = localStorage.getItem('deletedTimes');
    return saved ? new Set(JSON.parse(saved).map(Number)) : new Set();
  });

  // Funções utilitárias para lidar com tempos de forma robusta
  const getMessageTime = (msg: DecryptedMessage) => {
    if (msg.clientTimestamp) return msg.clientTimestamp;
    return safeToDate(msg.timestamp).getTime();
  };

  // Merge pending, firestore and backup messages
  const allMessages = useMemo(() => {
    const firestoreIds = new Set(messages.map(m => m.id));
    const firestoreTimes = new Set(messages.map(getMessageTime));
    
    // Filtramos backups que já existem nas ativas do Servidor 2
    const filteredBackup = backupMessages.filter(m => 
      !firestoreIds.has(m.id) && !firestoreTimes.has(getMessageTime(m))
    );

    const merged = [...messages, ...filteredBackup];
    const mergedIds = new Set(merged.map(m => m.id));
    const mergedTimes = new Set(merged.map(getMessageTime));

    // As mensagens pendentes só devem aparecer se realmente não estiverem no Firestore ou Backup
    const uniquePending = pendingMessages.filter(m => 
      !mergedIds.has(m.id) && !mergedTimes.has(getMessageTime(m))
    );
    
    const combined = [...merged, ...uniquePending];
    
    // FILTRO CRÍTICO: Remove mensagens marcadas para exclusão localmente ou globalmente
    return combined
      .filter(m => !localDeletedMessages.has(m.id) && !localDeletedTimes.has(getMessageTime(m)))
      .sort((a, b) => getMessageTime(a) - getMessageTime(b));
  }, [messages, backupMessages, pendingMessages, localDeletedMessages, localDeletedTimes]);

  // Snapshot version tracker to avoid race conditions
  const snapshotVersionRef = useRef(0);

  useEffect(() => {
    if (pendingMessages.length === 0) return;
    
    const firestoreTimestamps = new Set(allMessages.map(m => m.clientTimestamp));
    const stillPending = pendingMessages.filter(m => !firestoreTimestamps.has(m.clientTimestamp));
    
    // Auto-cleanup old pending messages (older than 10 seconds)
    const now = Date.now();
    const finalPending = stillPending.filter(m => now - m.clientTimestamp < 10000);
    
    if (finalPending.length !== pendingMessages.length) {
      setPendingMessages(finalPending);
    }
  }, [allMessages, pendingMessages]);

  useEffect(() => {
    if (!user) {
      setUserData(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserData;
        // Failsafe for partial documents (e.g. if generated via useKeys merge)
        if (!data.uid) data.uid = user.uid;
        if (!data.email) data.email = user.email || '';
        if (!data.displayName) data.displayName = user.displayName || 'Usuário';
        if (!data.uniqueCode) data.uniqueCode = Math.random().toString(36).substring(2, 15).toUpperCase();
        setUserData(data);
        
        // Espelhamento de perfil para o Backup se houver mudanças
        setDoc(doc(backupDb, 'userBackups', data.uniqueCode), data, { merge: true }).catch(() => {});
      }
    }, (error) => {
      console.error("User data snapshot error:", error);
    });

    // Heartbeat: Atualizar presença a cada 1 minuto
    const updatePresence = () => {
      setDoc(doc(db, 'users', user.uid), { lastActive: serverTimestamp() }, { merge: true });
    };
    
    updatePresence();
    const presenceInterval = setInterval(updatePresence, 30000);

    return () => {
      unsubscribe();
      clearInterval(presenceInterval);
    };
  }, [user]);

  useEffect(() => {
    if (!userData?.contacts || !Array.isArray(userData.contacts)) {
      setContacts([]);
      return;
    }

    const validContacts = userData.contacts.filter(uid => typeof uid === 'string' && uid.trim() !== '');

    if (validContacts.length === 0) {
      setContacts([]);
      return;
    }

    // Criar uma consulta que monitora a lista de UIDs em tempo real
    console.log("[Chat] Monitorando contatos:", validContacts);
    
    // Consulta de contatos com limite para distinguir de buscas individuais nas Security Rules
    const q = query(
      collection(db, 'users'), 
      where('uid', 'in', validContacts),
      limit(50)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contactList = snapshot.docs.map(doc => doc.data() as UserData);
      console.log("[Chat] Contatos atualizados:", contactList.length);
      setContacts(contactList);
    }, (error) => {
      console.error("Contacts snapshot error:", error);
      // Se for negado por bloqueio, limpamos a lista mas avisamos o estado
      if (error.message?.includes('permission-denied') || (error as any).code === 'permission-denied') {
        setContacts([]); 
      }
    });

    return () => unsubscribe();
  }, [userData?.contacts?.length]); // Monitorar especificamente o tamanho da lista para reagir a novos contatos

  // HISTÓRICO: Carregar 50 últimas mensagens do Backup (Servidor 1)
  useEffect(() => {
    if (!user || !activeContact || !userData || !privateKey) {
      setBackupMessages([]);
      return;
    }

    const backupChatId = [userData.uniqueCode, activeContact.uniqueCode].sort().join('_');
    
    const fetchBackup = async () => {
      try {
        const q = query(
          collection(backupDb, 'history'),
          where('chatId', '==', backupChatId),
          limit(100)
        );
        
        const snap = await getDocs(q);
        const decryptPromises = snap.docs.map(async (docSnap) => {
          const msgData = { id: docSnap.id, ...docSnap.data() } as Message;
          
          // FILTRO ADICIONAL: Ignorar mensagens já marcadas como excluídas localmente
          const time = msgData.clientTimestamp || safeToDate(msgData.timestamp).getTime();
          if (localDeletedMessages.has(msgData.id) || localDeletedTimes.has(time)) {
            return null;
          }

          const isMe = msgData.senderCode === userData.uniqueCode;
          const encryptedKey = isMe ? msgData.encryptedKeyForSender : msgData.encryptedKeyForReceiver;
          
          try {
            if (!encryptedKey) return { ...msgData, text: (msgData as any).text || "[Protegido]" };
            const text = await decryptMessage(msgData.encryptedContent, encryptedKey, msgData.iv, privateKey);
            return { ...msgData, text };
          } catch (err) {
            return { ...msgData, text: "[Histórico]" };
          }
        });
        
        const results = await Promise.all(decryptPromises);
        const msgs = results.filter((m): m is DecryptedMessage => m !== null);
        
        const sortedMsgs = msgs.sort((a, b) => 
          (a.clientTimestamp || 0) - (b.clientTimestamp || 0)
        );
        setBackupMessages(sortedMsgs);
      } catch (e) {
        console.warn("[Backup] Falha ao carregar histórico:", e);
      }
    };

    fetchBackup();
  }, [user?.uid, activeContact?.uid, userData?.uniqueCode, privateKey]);

  useEffect(() => {
    if (!user || !activeContact || !privateKey) {
      setMessages([]);
      return;
    }

    const chatId = [user.uid, activeContact.uid].sort().join('_');
    const currentVersion = ++snapshotVersionRef.current;
    let activeUnsub: (() => void) | null = null;

    const initChat = async () => {
      // 1. Carregar TUDO o que temos no Banco Local primeiro
      const localMsgs = await localDb.getMessagesByChat(chatId);
      
      if (currentVersion !== snapshotVersionRef.current) return;
      setMessages(localMsgs);

      const q = query(
        collection(db, activeGroup ? 'group_messages' : 'chats', chatId, 'messages'),
        orderBy('timestamp', 'asc'),
        limit(100)
      );

      activeUnsub = onSnapshot(q, async (snap) => {
        const removedIds = snap.docChanges()
          .filter(change => change.type === 'removed')
          .map(change => change.doc.id);
          
        if (removedIds.length > 0) {
          await localDb.deleteMessages(removedIds);
          setMessages(prev => prev.filter(m => !removedIds.includes(m.id)));
        }

        if (snap.empty) return;
        
        const changes = snap.docChanges()
          .filter(change => change.type === 'added' || change.type === 'modified')
          .map(change => change.doc);

        if (changes.length > 0) {
          await processDocs(changes);
        }
      }, (err) => {
        console.warn("[Chat] Snapshot error:", err.message);
      });
    };

    const processDocs = async (docs: any[]) => {
      const decryptPromises = docs.map(async (docSnap) => {
        const msgData = { id: docSnap.id, ...docSnap.data() } as Message;
        const isMe = msgData.senderId === user.uid;
        const encryptedKey = isMe ? msgData.encryptedKeyForSender : msgData.encryptedKeyForReceiver;
        
        try {
          if (!encryptedKey || !privateKey) {
            // Fallback para grupos (Base64 protocolo)
            if (msgData.groupId && msgData.iv === 'group-iv') {
              try {
                const text = decodeURIComponent(escape(atob(msgData.encryptedContent)));
                return { ...msgData, text } as DecryptedMessage;
              } catch (e) {
                return { ...msgData, text: "[Protegido]" } as DecryptedMessage;
              }
            }
            return { ...msgData, text: "[Protegido]" } as DecryptedMessage;
          }
          
          const text = await decryptMessage(msgData.encryptedContent, encryptedKey, msgData.iv, privateKey);
          return { ...msgData, text } as DecryptedMessage;
        } catch (err) {
          // Fallback para grupos caso dê erro no decript padrão
          if (msgData.groupId && msgData.iv === 'group-iv') {
            try {
              const text = decodeURIComponent(escape(atob(msgData.encryptedContent)));
              return { ...msgData, text } as DecryptedMessage;
            } catch (e) {}
          }
          return { ...msgData, text: "[Erro]" } as DecryptedMessage;
        }
      });

      const newMsgs = await Promise.all(decryptPromises);
      
      // Salvar no Banco Local
      await localDb.saveMessages(newMsgs);
      
      if (currentVersion === snapshotVersionRef.current) {
        setMessages(prev => {
          const combined = [...prev, ...newMsgs];
          const uniqueMap = new Map();
          combined.forEach(m => uniqueMap.set(m.id, m));
          return Array.from(uniqueMap.values())
            .sort((a, b) => getMessageTime(a) - getMessageTime(b))
            .filter(m => !localDeletedMessages.has(m.id));
        });
      }
    };

    initChat();

    return () => {
      if (activeUnsub) activeUnsub();
    };
  }, [user?.uid, activeContact?.uid, activeGroup?.id, privateKey, localDeletedMessages]);

  const sendMessage = async (text: string, replyToId?: string) => {
    if (!user || !activeContact || !userData || !text.trim()) return;

    const clientTimestamp = Date.now();
    const chatId = [user.uid, activeContact.uid].sort().join('_');
    const backupChatId = [userData.uniqueCode, activeContact.uniqueCode].sort().join('_');

    const pendingMsg: DecryptedMessage = {
      id: `pending-${clientTimestamp}`,
      senderId: user.uid,
      senderUid: user.uid,
      receiverId: activeContact?.uid,
      groupId: activeGroup?.id,
      chatId,
      text,
      encryptedContent: '',
      iv: '',
      clientTimestamp,
      replyToId: replyToId || null,
      isUploading: false,
      isPending: true,
      senderName: userData.displayName
    };

    setPendingMessages(prev => [...prev, pendingMsg]);

    try {
      let encrypted;
      if (activeGroup) {
        // Mock Group Encryption (Base64 for now, explaining in UI)
        encrypted = {
          content: btoa(unescape(encodeURIComponent(text))),
          keySender: '',
          keyReceiver: '',
          iv: 'group-iv'
        };
      } else {
        encrypted = await encryptMessage(
          text,
          userData.publicKey,
          activeContact!.publicKey
        );
      }

      const colName = activeGroup ? 'group_messages' : 'chats';
      const msgId = doc(collection(db, colName, chatId, 'messages')).id;

      const msgPayload = {
        senderId: user.uid,
        senderUid: user.uid,
        receiverId: activeContact?.uid || null,
        groupId: activeGroup?.id || null,
        chatId,
        encryptedContent: encrypted.content,
        encryptedKeyForSender: encrypted.keySender,
        encryptedKeyForReceiver: encrypted.keyReceiver,
        iv: encrypted.iv,
        timestamp: serverTimestamp(),
        clientTimestamp,
        replyToId: replyToId || null,
        senderName: userData.displayName
      };

      await setDoc(doc(db, colName, chatId, 'messages', msgId), msgPayload);

      // 2. Salvar Espelho no Servidor de BACKUP (Usando o mesmo msgId para facilitar deleção)
      await setDoc(doc(backupDb, 'history', msgId), {
        ...msgPayload,
        senderCode: userData.uniqueCode,
        receiverCode: activeContact?.uniqueCode || null,
        chatId: backupChatId
      }).catch(e => console.warn("[Backup] Falha ao espelhar mensagem:", e));

    } catch (error) {
      setPendingMessages(prev => prev.filter(m => m.clientTimestamp !== clientTimestamp));
      handleFirestoreError(error, OperationType.WRITE, 'messages');
    }
  };

  const sendFile = async (file: File) => {
    if (!user || (!activeContact && !activeGroup) || !userData) return;
    
    if (!file.type.startsWith('image/')) {
      throw new Error("Apenas imagens são permitidas.");
    }

    const clientTimestamp = Date.now();
    const chatId = activeGroup ? activeGroup.id : [user.uid, activeContact!.uid].sort().join('_');
    const backupChatId = activeGroup ? activeGroup.id : [userData.uniqueCode, activeContact!.uniqueCode].sort().join('_');
    const localUrl = URL.createObjectURL(file);

    const pendingMsg: DecryptedMessage = {
      id: `pending-${clientTimestamp}`,
      senderId: user.uid,
      receiverId: activeContact?.uid || null,
      groupId: activeGroup?.id || null,
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
      let fileToProcess: Blob | File = file;
      if (file.size > 800 * 1024) {
        fileToProcess = await compressImage(file, 800);
      }

      const arrayBuffer = await fileToProcess.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      
      let encrypted;
      if (activeGroup) {
        encrypted = {
          encryptedContent: btoa(String.fromCharCode(...data)),
          encryptedKeyForSender: '',
          encryptedKeyForReceiver: '',
          iv: 'group-iv'
        };
      } else {
        encrypted = await encryptData(
          data,
          userData.publicKey,
          activeContact!.publicKey
        );
      }

      const encryptedBlob = new Blob([encrypted.encryptedContent], { type: 'application/octet-stream' });
      const cloudinaryResult = await uploadToCloudinary(new File([encryptedBlob], file.name, { type: 'application/octet-stream' }));
      const fileUrl = cloudinaryResult.url;

      const colName = activeGroup ? 'group_messages' : 'chats';
      const msgId = doc(collection(db, colName, chatId, 'messages')).id;

      const msgPayload = {
        senderId: user.uid,
        receiverId: activeContact?.uid || null,
        groupId: activeGroup?.id || null,
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
      };

      // 1. Salvar no Servidor ATIVO
      await setDoc(doc(db, colName, chatId, 'messages', msgId), msgPayload);

      // 2. Salvar Espelho no Servidor de BACKUP
      await setDoc(doc(backupDb, 'history', msgId), {
        ...msgPayload,
        senderCode: userData.uniqueCode,
        receiverCode: activeContact?.uniqueCode || null,
        chatId: backupChatId
      }).catch(e => console.warn("[Backup] Falha ao espelhar arquivo:", e));

    } catch (error) {
      setPendingMessages(prev => prev.filter(m => m.clientTimestamp !== clientTimestamp));
      URL.revokeObjectURL(localUrl);
      handleFirestoreError(error, OperationType.WRITE, 'messages');
    }
  };

  const addContact = async (code: string) => {
    if (!user || !userData || !code.trim()) return;
    if (code === userData.uniqueCode) throw new Error("Você não pode adicionar a si mesmo.");
    
    try {
      const q = query(collection(db, 'users'), where('uniqueCode', '==', code), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Código inválido.");
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
    } catch (error: any) {
      throw error;
    }
  };

  const deleteMessage = async (msgId: string) => {
    const colName = activeGroup ? 'group_messages' : 'chats';
    const chatId = activeGroup ? activeGroup.id : [user?.uid, activeContact?.uid].sort().join('_');
    
    setLocalDeletedMessages(prev => {
      const newSet = new Set(prev);
      newSet.add(msgId);
      localStorage.setItem('deletedMessages', JSON.stringify(Array.from(newSet)));
      return newSet;
    });

    try {
      await deleteDoc(doc(db, colName, chatId, 'messages', msgId));
      await deleteDoc(doc(backupDb, 'history', msgId)).catch(() => {});
      await localDb.deleteMessages([msgId]);
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
    
    if ((activeContact || activeGroup) && user) {
      const chatId = activeGroup ? activeGroup.id : [user.uid, activeContact!.uid].sort().join('_');
      localDb.clearChat(chatId).then(() => {
        setMessages([]);
      });
    }
  };

  const factoryReset = async () => {
    if (!user || user.email !== 'jogonesteterp@gmail.com') return;
    try {
      const batch = writeBatch(db);
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.docs.forEach(docSnap => {
        if (docSnap.id !== user.uid) batch.delete(docSnap.ref);
      });
      const chatsSnap = await getDocs(collection(db, 'chats'));
      for (const chatDoc of chatsSnap.docs) {
        const messagesSnap = await getDocs(collection(db, 'chats', chatDoc.id, 'messages'));
        messagesSnap.docs.forEach(msgDoc => batch.delete(msgDoc.ref));
        batch.delete(chatDoc.ref);
      }
      await batch.commit();
      window.location.reload();
    } catch (error) {
      throw error;
    }
  };

  const [lockTimeRemaining, setLockTimeRemaining] = useState<number | null>(null);

  // Monitorar bloqueio de busca
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'rateLimits', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.lockedUntil) {
          const lockedUntil = (data.lockedUntil as any).toMillis ? (data.lockedUntil as any).toMillis() : data.lockedUntil;
          const remaining = Math.max(0, lockedUntil - Date.now());
          if (remaining > 0) {
            setLockTimeRemaining(Math.ceil(remaining / 1000));
            const timer = setInterval(() => {
              setLockTimeRemaining(prev => {
                if (prev !== null && prev > 0) return prev - 1;
                clearInterval(timer);
                return null;
              });
            }, 1000);
            return () => clearInterval(timer);
          } else {
            setLockTimeRemaining(null);
          }
        }
      }
    }, (err) => {
      console.warn("[Chat] Rate limit snapshot error:", err);
    });
    return () => unsub();
  }, [user?.uid]);

  useEffect(() => {
    if (user?.email !== 'jogonesteterp@gmail.com') return;

    const fetchAdminData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const chatsSnap = await getDocs(collection(db, 'chats'));
        
        setAllUsers(usersSnap.docs.map(d => d.data() as UserData));
        
        setAdminStats({
          totalUsers: usersSnap.size,
          totalChats: chatsSnap.size,
          totalMessages: 0 // Simplificado para evitar custos de subcoleções em loop
        });
      } catch (err) {
        console.error("Admin data error:", err);
      }
    };

    fetchAdminData();
  }, [user]);

  const adminDeleteAllMessages = async () => {
    if (user?.email !== 'jogonesteterp@gmail.com') return;
    try {
      const chatsSnap = await getDocs(collection(db, 'chats'));
      for (const chatDoc of chatsSnap.docs) {
        const messagesSnap = await getDocs(collection(db, 'chats', chatDoc.id, 'messages'));
        for (const msgDoc of messagesSnap.docs) {
          await deleteDoc(msgDoc.ref);
        }
      }
    } catch (err) {
      console.error("Error deleting all messages:", err);
      throw err;
    }
  };

  const adminDeleteAllInvites = async () => {
    if (user?.email !== 'jogonesteterp@gmail.com') return;
    try {
      console.log("[Admin] Tentando buscar convites...");
      const invitesSnap = await getDocs(collection(db, 'inviteTokens'));
      console.log(`[Admin] Encontrou ${invitesSnap.size} convites.`);
      for (const docSnap of invitesSnap.docs) {
        console.log(`[Admin] Deletando: ${docSnap.ref.path}`);
        await deleteDoc(docSnap.ref);
      }
      console.log("[Admin] Convites deletados com sucesso.");
    } catch (err) {
      console.error("Error deleting all invites:", err);
      throw err;
    }
  };

  return {
    userData,
    contacts,
    activeContact: activeContact ? contacts.find(c => c.uid === activeContact.uid) || activeContact : null,
    setActiveContact,
    activeGroup,
    setActiveGroup,
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
    privateKey,
    adminStats,
    allUsers,
    adminDeleteAllMessages,
    adminDeleteAllInvites,
    lockTimeRemaining
  };
};

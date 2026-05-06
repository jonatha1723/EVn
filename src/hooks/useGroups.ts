import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, serverTimestamp, arrayUnion, arrayRemove, getDoc, getDocs, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { Group, GroupRequest, UserData } from '../types';

export const useGroups = (user: { uid: string } | null, userData: UserData | null) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [requests, setRequests] = useState<GroupRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<GroupRequest[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Monitorar grupos onde o usuário é membro
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'groups'),
      where('members', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
      setGroups(groupList);
      setLoadingGroups(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'requests'),
      where('fromUid', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroupRequest));
      setSentRequests(requestList);
    });

    return () => unsubscribe();
  }, [user]);

  // Monitorar solicitações pendentes para o usuário
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'requests'),
      where('toUid', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroupRequest));
      setRequests(requestList);
    });

    return () => unsubscribe();
  }, [user]);

  const createGroup = async (name: string, imageIndex: number, customImageUrl?: string) => {
    if (!user || !userData) return;

    // Verificar se o usuário já tem um grupo (limite de 1)
    const q = query(collection(db, 'groups'), where('adminUid', '==', user.uid));
    const snap = await getDocs(q);
    if (!snap.empty) {
      throw new Error("Você só pode criar 1 grupo.");
    }

    const groupId = crypto.randomUUID();
    const newGroup: Group = {
      id: groupId,
      name,
      adminUid: user.uid,
      members: [user.uid],
      memberJoinedAt: {
        [user.uid]: Date.now(),
      },
      imageIndex,
      customImageUrl: customImageUrl || '',
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'groups', groupId), newGroup);
    return groupId;
  };

  const inviteToGroup = async (targetUid: string, targetName: string, groupId: string, groupName: string) => {
    if (!user || !userData) return;

    // Se já for membro, não convidar
    const groupDoc = await getDoc(doc(db, 'groups', groupId));
    if (groupDoc.exists()) {
      const data = groupDoc.data() as Group;
      if (data.members.includes(targetUid)) return;
    }

    // Criar solicitação
    const requestId = `${groupId}_${targetUid}`;
    const request: GroupRequest = {
      id: requestId,
      type: 'group',
      fromUid: user.uid,
      fromName: userData.displayName,
      toUid: targetUid,
      groupId,
      groupName,
      status: 'pending',
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'requests', requestId), request);
  };

  const handleRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    if (!user) return;

    const requestRef = doc(db, 'requests', requestId);
    const requestSnap = await getDoc(requestRef);
    
    if (!requestSnap.exists()) return;
    const request = requestSnap.data() as GroupRequest;

    if (status === 'accepted') {
      if (request.type === 'group' && request.groupId) {
        // Adicionar ao grupo
        await updateDoc(doc(db, 'groups', request.groupId), {
          members: arrayUnion(user.uid),
          [`memberJoinedAt.${user.uid}`]: Date.now()
        });
      } else if (request.type === 'friend') {
        // Adicionar aos contatos (isso precisaria atualizar o UserData no Firestore)
        await updateDoc(doc(db, 'users', user.uid), {
          contacts: arrayUnion(request.fromUid)
        });
        await updateDoc(doc(db, 'users', request.fromUid), {
          contacts: arrayUnion(user.uid)
        });
      }
    }

    await updateDoc(requestRef, { status, updatedAt: serverTimestamp() });
    if (request.type === 'friend' && request.fromUid) {
      await updateDoc(doc(db, 'requestCounters', request.fromUid), {
        pendingOutgoingCount: increment(-1),
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    }
  };

  const cancelRequest = async (requestId: string) => {
    if (!user) return;
    const requestRef = doc(db, 'requests', requestId);
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) return;

    const request = requestSnap.data() as GroupRequest;
    if (request.fromUid !== user.uid || request.status !== 'pending') return;

    await updateDoc(requestRef, { status: 'cancelled', updatedAt: serverTimestamp() });
    if (request.type === 'friend') {
      await updateDoc(doc(db, 'requestCounters', user.uid), {
        pendingOutgoingCount: increment(-1),
        updatedAt: serverTimestamp(),
      }).catch(() => {});
    }
  };

  const banUser = async (groupId: string, targetUid: string) => {
    if (!user) return;
    const groupRef = doc(db, 'groups', groupId);
    const snap = await getDoc(groupRef);
    if (snap.exists() && snap.data().adminUid === user.uid) {
      await updateDoc(groupRef, {
        members: arrayRemove(targetUid),
        banned: arrayUnion(targetUid)
      });
    }
  };

  return { groups, requests, sentRequests, createGroup, inviteToGroup, handleRequest, cancelRequest, banUser, loadingGroups };
};

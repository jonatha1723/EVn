import React, { useState } from 'react';
import { X, Users, Link, UserPlus, Ban, VolumeX, LogOut, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { arrayRemove, arrayUnion, collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Group, UserData } from '../../types';

interface GroupManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  userData: UserData | null;
  contacts: UserData[];
}

const muteOptions = [
  { label: '10 min', value: 10 * 60 * 1000 },
  { label: '1h', value: 60 * 60 * 1000 },
  { label: '1 dia', value: 24 * 60 * 60 * 1000 },
  { label: '30 dias', value: 30 * 24 * 60 * 60 * 1000 },
];

export const GroupManagementModal: React.FC<GroupManagementModalProps> = ({ isOpen, onClose, group, userData, contacts }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [status, setStatus] = useState('');
  const [copied, setCopied] = useState(false);
  const isAdmin = userData?.uid === group.adminUid;

  const memberName = (uid: string) => {
    if (uid === userData?.uid) return `${userData.displayName} (voce)`;
    return contacts.find(c => c.uid === uid)?.displayName || uid.slice(0, 8);
  };

  const inviteById = async () => {
    if (!userData || !isAdmin || !inviteCode.trim()) return;
    setStatus('');
    const normalized = inviteCode.trim().toUpperCase();
    const snap = await getDocs(query(collection(db, 'users'), where('uniqueCode', '==', normalized)));
    if (snap.empty) {
      setStatus('ID nao encontrado.');
      return;
    }

    const target = snap.docs[0].data() as UserData;
    if (group.banned?.includes(target.uid)) {
      setStatus('Este usuario esta banido do grupo.');
      return;
    }

    const requestId = `${group.id}_${target.uid}`;
    await setDoc(doc(db, 'requests', requestId), {
      id: requestId,
      type: 'group',
      fromUid: userData.uid,
      fromName: userData.displayName,
      fromCode: userData.uniqueCode,
      toUid: target.uid,
      targetCode: normalized,
      groupId: group.id,
      groupName: group.name,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setInviteCode('');
    setStatus('Convite enviado para o sininho.');
  };

  const createGroupLink = async () => {
    if (!userData || !isAdmin) return;
    const tokenId = crypto.randomUUID();
    const now = Date.now();
    await setDoc(doc(db, 'groupInviteTokens', tokenId), {
      groupId: group.id,
      groupName: group.name,
      creatorUid: userData.uid,
      createdAt: now,
      expiresAt: now + 24 * 60 * 60 * 1000,
      revoked: false,
    });
    await navigator.clipboard.writeText(`${window.location.origin}/?groupInvite=${tokenId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setStatus('Link copiado. Ele expira em 24h.');
  };

  const expel = async (uid: string) => {
    if (!isAdmin || uid === group.adminUid) return;
    await updateDoc(doc(db, 'groups', group.id), {
      members: arrayRemove(uid),
      [`memberJoinedAt.${uid}`]: null,
    });
  };

  const ban = async (uid: string) => {
    if (!isAdmin || uid === group.adminUid) return;
    await updateDoc(doc(db, 'groups', group.id), {
      members: arrayRemove(uid),
      banned: arrayUnion(uid),
      [`memberJoinedAt.${uid}`]: null,
    });
  };

  const mute = async (uid: string, duration: number) => {
    if (!isAdmin || uid === group.adminUid) return;
    await updateDoc(doc(db, 'groups', group.id), {
      [`mutedUntil.${uid}`]: Date.now() + duration,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{group.name}</h2>
                  <p className="text-xs text-zinc-500">{group.members.length} membros</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {isAdmin && (
                <section className="grid md:grid-cols-2 gap-3">
                  <button onClick={createGroupLink} className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-widest">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    Gerar link
                  </button>
                  <div className="flex gap-2">
                    <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} placeholder="ID do usuario" className="min-w-0 flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 text-sm text-white focus:outline-none focus:border-emerald-500/40" />
                    <button onClick={inviteById} className="px-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200">
                      <UserPlus className="w-5 h-5" />
                    </button>
                  </div>
                </section>
              )}

              {status && <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-4 py-3">{status}</p>}

              <section className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Membros</h3>
                <div className="space-y-2">
                  {group.members.map(uid => (
                    <div key={uid} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{memberName(uid)}</p>
                        <p className="text-[10px] text-zinc-600 font-mono truncate">{uid}</p>
                        {group.mutedUntil?.[uid] && group.mutedUntil[uid] > Date.now() && (
                          <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest mt-1">Mutado ate {new Date(group.mutedUntil[uid]).toLocaleString()}</p>
                        )}
                      </div>
                      {isAdmin && uid !== group.adminUid && (
                        <div className="flex flex-wrap gap-2">
                          {muteOptions.map(option => (
                            <button key={option.label} onClick={() => mute(uid, option.value)} className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-yellow-500/10 hover:text-yellow-400 text-zinc-400 text-[10px] font-bold">
                              <VolumeX className="w-3 h-3 inline mr-1" />
                              {option.label}
                            </button>
                          ))}
                          <button onClick={() => expel(uid)} className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-red-500/10 hover:text-red-400 text-zinc-400 text-[10px] font-bold">
                            <LogOut className="w-3 h-3 inline mr-1" />
                            Expulsar
                          </button>
                          <button onClick={() => ban(uid)} className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-red-500/10 hover:text-red-400 text-zinc-400 text-[10px] font-bold">
                            <Ban className="w-3 h-3 inline mr-1" />
                            Banir
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

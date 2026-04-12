import React, { useState, useEffect } from 'react';
import { Copy, Check, Share2, Loader2, Clock, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc, query, collection, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserData, InviteToken } from '../../types';

interface UserCodeCardProps {
  userData: UserData | null;
}

export const UserCodeCard: React.FC<UserCodeCardProps> = ({ userData }) => {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [activeInvite, setActiveInvite] = useState<InviteToken | null>(null);
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  // Verificar se já existe um convite ativo ao carregar
  useEffect(() => {
    if (!userData) return;
    checkExistingInvite();
  }, [userData]);

  // Timer de contagem regressiva
  useEffect(() => {
    if (!activeInvite) {
      setTimeLeft('');
      return;
    }

    const updateTimer = () => {
      const remaining = activeInvite.expiresAt - Date.now();
      if (remaining <= 0) {
        setActiveInvite(null);
        setShowLinkPanel(false);
        setTimeLeft('');
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeInvite]);

  const checkExistingInvite = async () => {
    if (!userData) return null;

    const q = query(
      collection(db, 'inviteTokens'),
      where('creatorUid', '==', userData.uid),
      where('used', '==', false),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const tokenData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as InviteToken;
      // Verificar se ainda não expirou
      if (Date.now() < tokenData.expiresAt) {
        setActiveInvite(tokenData);
        return tokenData;
      }
    }
    return null;
  };

  const copyCode = () => {
    if (userData?.uniqueCode) {
      navigator.clipboard.writeText(userData.uniqueCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getInviteLink = (tokenId: string) => `${window.location.origin}/?invite=${tokenId}`;

  const shareInviteLink = async () => {
    if (!userData) return;
    setSharing(true);

    try {
      // Verificar se já existe um convite ativo
      const existing = await checkExistingInvite();

      if (existing) {
        // Reutilizar o link existente
        const link = getInviteLink(existing.id!);
        if (navigator.share) {
          await navigator.share({
            title: 'Convite - Meu ID',
            text: `${userData.displayName} está te convidando para conversar no Meu ID!`,
            url: link,
          });
        } else {
          await navigator.clipboard.writeText(link);
        }
        setShowLinkPanel(true);
        setShared(true);
        setTimeout(() => setShared(false), 3000);
        return;
      }

      // Criar um novo token
      const tokenId = crypto.randomUUID();
      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000;

      const newToken: Omit<InviteToken, 'id'> = {
        creatorUid: userData.uid,
        creatorName: userData.displayName,
        creatorCode: userData.uniqueCode,
        createdAt: now,
        expiresAt: now + ONE_HOUR,
        used: false,
      };

      await setDoc(doc(db, 'inviteTokens', tokenId), newToken);
      
      const savedToken = { id: tokenId, ...newToken };
      setActiveInvite(savedToken);

      const link = getInviteLink(tokenId);
      if (navigator.share) {
        await navigator.share({
          title: 'Convite - Meu ID',
          text: `${userData.displayName} está te convidando para conversar no Meu ID!`,
          url: link,
        });
      } else {
        await navigator.clipboard.writeText(link);
      }

      setShowLinkPanel(true);
      setShared(true);
      setTimeout(() => setShared(false), 3000);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Erro ao gerar convite:', error);
      }
    } finally {
      setSharing(false);
    }
  };

  const copyExistingLink = async () => {
    if (!activeInvite?.id) return;
    const link = getInviteLink(activeInvite.id);
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Cartão do ID */}
      <motion.div 
        whileHover={{ scale: 1.01 }}
        className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 flex items-center justify-between group shadow-lg cursor-default"
      >
        <div className="flex flex-col">
          <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Meu ID</p>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <code className="font-mono text-zinc-200 text-sm tracking-widest font-medium">
              {userData?.uniqueCode ? (
                <>
                  <span className="text-emerald-400/90">{userData.uniqueCode.slice(0, 10)}</span>
                  <span className="text-zinc-400">{userData.uniqueCode.slice(10)}</span>
                </>
              ) : '...'}
            </code>
          </div>
        </div>
        <button 
          onClick={copyCode} 
          className="p-2.5 text-zinc-500 hover:text-emerald-400 active:scale-95 bg-zinc-950 rounded-xl transition-all border border-zinc-800 hover:border-emerald-500/30"
          title="Copiar código"
        >
          {copied && !activeInvite ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </motion.div>

      {/* Botão de compartilhar */}
      <motion.button
        onClick={shareInviteLink}
        disabled={sharing || !userData}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <AnimatePresence mode="wait">
          {sharing ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Loader2 className="w-4 h-4 animate-spin" />
            </motion.div>
          ) : shared ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Link copiado!</span>
            </motion.div>
          ) : activeInvite ? (
            <motion.div key="existing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Compartilhar Link Ativo</span>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Gerar Link de Convite</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Painel do link ativo (visível quando há um convite) */}
      <AnimatePresence>
        {activeInvite && showLinkPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-3.5 space-y-2.5">
              {/* Timer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Link ativo</span>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                  {timeLeft}
                </span>
              </div>

              {/* Link preview clicável */}
              <button
                onClick={copyExistingLink}
                className="w-full flex items-center gap-2 bg-zinc-950 border border-zinc-800 hover:border-emerald-500/30 rounded-xl px-3 py-2.5 transition-all group"
              >
                <code className="text-[10px] text-zinc-400 group-hover:text-zinc-300 truncate flex-1 text-left font-mono">
                  {getInviteLink(activeInvite.id!).replace('https://', '')}
                </code>
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-zinc-600 group-hover:text-emerald-400 shrink-0 transition-colors" />
                )}
              </button>

              <p className="text-[9px] text-zinc-600 text-center font-medium">
                Uso único • Expira automaticamente
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

import React, { useState } from 'react';
import { Copy, Check, Share2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserData } from '../../types';

interface UserCodeCardProps {
  userData: UserData | null;
}

export const UserCodeCard: React.FC<UserCodeCardProps> = ({ userData }) => {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);

  const copyCode = () => {
    if (userData?.uniqueCode) {
      navigator.clipboard.writeText(userData.uniqueCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareInviteLink = async () => {
    if (!userData) return;
    setSharing(true);

    try {
      // Gerar um ID único para o token
      const tokenId = crypto.randomUUID();
      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000;

      // Salvar token no Firestore
      await setDoc(doc(db, 'inviteTokens', tokenId), {
        creatorUid: userData.uid,
        creatorName: userData.displayName,
        creatorCode: userData.uniqueCode,
        createdAt: now,
        expiresAt: now + ONE_HOUR,
        used: false,
      });

      // Gerar e copiar o link
      const link = `${window.location.origin}/?invite=${tokenId}`;

      // Tentar usar a API nativa de compartilhamento (mobile)
      if (navigator.share) {
        await navigator.share({
          title: 'Convite - Meu ID',
          text: `${userData.displayName} está te convidando para conversar no Meu ID!`,
          url: link,
        });
      } else {
        await navigator.clipboard.writeText(link);
      }

      setShared(true);
      setTimeout(() => setShared(false), 3000);
    } catch (error: any) {
      // O usuário pode ter cancelado o share nativo, não é erro real
      if (error.name !== 'AbortError') {
        console.error('Erro ao gerar convite:', error);
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="space-y-3">
      <motion.div 
        whileHover={{ scale: 1.01 }}
        className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 flex items-center justify-between group shadow-lg"
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
        <div className="flex items-center gap-1.5">
          <button 
            onClick={copyCode} 
            className="p-2.5 text-zinc-500 hover:text-emerald-400 active:scale-95 bg-zinc-950 rounded-xl transition-all border border-zinc-800"
            title="Copiar código"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>

      {/* Botão de compartilhar link */}
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
              <span className="text-xs font-bold uppercase tracking-wider">Link copiado! Válido por 1h</span>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Compartilhar Link de Convite</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

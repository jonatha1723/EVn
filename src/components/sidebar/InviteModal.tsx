import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, X, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import { InviteToken } from '../../types';

interface InviteModalProps {
  invite: InviteToken;
  onAccept: () => Promise<void>;
  onDismiss: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ invite, onAccept, onDismiss }) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');

  const timeLeft = Math.max(0, invite.expiresAt - Date.now());
  const minutesLeft = Math.floor(timeLeft / 60000);

  const handleAccept = async () => {
    setIsAccepting(true);
    setError('');
    try {
      await onAccept();
      setAccepted(true);
      setTimeout(() => onDismiss(), 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao aceitar convite.');
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
        >
          {/* Header com gradiente */}
          <div className="relative bg-gradient-to-br from-emerald-600/20 via-emerald-500/10 to-transparent p-8 pb-6">
            <button
              onClick={onDismiss}
              className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              {/* Avatar do remetente */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1, damping: 15 }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mb-4 shadow-lg shadow-emerald-900/30"
              >
                <span className="text-3xl font-bold text-white">
                  {invite.creatorName.charAt(0).toUpperCase()}
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-[10px] text-emerald-400 uppercase tracking-[0.25em] font-bold mb-2">
                  Convite Recebido
                </p>
                <h2 className="text-xl font-bold text-white mb-1">
                  {invite.creatorName}
                </h2>
                <p className="text-zinc-500 text-xs">
                  quer se conectar com você
                </p>
              </motion.div>
            </div>
          </div>

          {/* Info + Ação */}
          <div className="p-6 pt-4 space-y-4">
            {/* Timer */}
            <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {minutesLeft > 0
                  ? `Expira em ${minutesLeft} minuto${minutesLeft !== 1 ? 's' : ''}`
                  : 'Últimos segundos!'}
              </span>
            </div>

            {/* Segurança */}
            <div className="flex items-center justify-center gap-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl py-2 px-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] text-emerald-400/80 font-medium uppercase tracking-wider">
                Conexão criptografada de ponta a ponta
              </span>
            </div>

            {/* Botão de ação */}
            {accepted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center text-sm font-bold"
              >
                ✓ Contato adicionado com sucesso!
              </motion.div>
            ) : (
              <button
                onClick={handleAccept}
                disabled={isAccepting}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-sm transition-all shadow-lg shadow-emerald-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAccepting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Aceitar Convite
                  </>
                )}
              </button>
            )}

            {/* Erro */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-red-400 text-xs text-center font-medium"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

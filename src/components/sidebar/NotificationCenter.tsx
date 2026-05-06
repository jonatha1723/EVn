import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, UserPlus, Users, Check, Trash2, Ban, Send } from 'lucide-react';
import { GroupRequest } from '../../types';
import { safeToDate } from '../../lib/dateUtils';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  requests: GroupRequest[];
  sentRequests: GroupRequest[];
  outgoingFriendRequestCount: number;
  onHandleRequest: (requestId: string, status: 'accepted' | 'declined') => Promise<void>;
  onCancelRequest: (requestId: string) => Promise<void>;
  onBlockInviteUser: (uid: string) => Promise<void>;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  requests,
  sentRequests,
  outgoingFriendRequestCount,
  onHandleRequest,
  onCancelRequest,
  onBlockInviteUser
}) => {
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const visibleRequests = tab === 'received' ? requests : sentRequests;

  const formatDate = (value: any) => {
    const date = safeToDate(value);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Sininho</h2>
                  <p className="text-xs text-zinc-500">Pedidos recebidos e enviados</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 border-b border-zinc-900">
              <div className="grid grid-cols-2 gap-2 bg-zinc-900/50 p-1 rounded-2xl">
                <button
                  onClick={() => setTab('received')}
                  className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest ${tab === 'received' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                >
                  Recebidos ({requests.length})
                </button>
                <button
                  onClick={() => setTab('sent')}
                  className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest ${tab === 'sent' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                >
                  Enviados ({outgoingFriendRequestCount}/3)
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 max-h-[430px] overflow-y-auto custom-scrollbar">
              {visibleRequests.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-zinc-600">
                  <Bell className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm font-medium">Nada por aqui</p>
                </div>
              ) : (
                visibleRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-3xl flex flex-col gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                        {request.type === 'group' ? <Users className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm text-white font-bold truncate">
                          {tab === 'received' ? request.fromName : request.groupName || request.targetCode}
                        </p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5">
                          {request.type === 'group' ? `Grupo: ${request.groupName}` : tab === 'received' ? `ID: ${request.fromCode || 'sem id'}` : 'Aguardando resposta'}
                        </p>
                        <p className="text-[10px] text-zinc-600 font-mono mt-1">{formatDate(request.createdAt)}</p>
                      </div>
                    </div>

                    {tab === 'received' ? (
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => onHandleRequest(request.id, 'accepted')}
                          className="col-span-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest"
                        >
                          <Check className="w-4 h-4" />
                          Aceitar
                        </button>
                        <button
                          onClick={() => onHandleRequest(request.id, 'declined')}
                          className="flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-red-500/10 hover:text-red-400 text-zinc-400 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest"
                        >
                          <Trash2 className="w-4 h-4" />
                          Recusar
                        </button>
                        <button
                          onClick={() => onBlockInviteUser(request.fromUid)}
                          className="flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-red-500/10 hover:text-red-400 text-zinc-400 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest"
                        >
                          <Ban className="w-4 h-4" />
                          Bloquear
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onCancelRequest(request.id)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-red-500/10 hover:text-red-400 text-zinc-400 rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest"
                      >
                        <Send className="w-4 h-4" />
                        Cancelar envio
                      </button>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, UserPlus, Users, Check, Trash2 } from 'lucide-react';
import { GroupRequest } from '../../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  requests: GroupRequest[];
  onHandleRequest: (requestId: string, status: 'accepted' | 'declined') => Promise<void>;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  isOpen, 
  onClose, 
  requests, 
  onHandleRequest 
}) => {
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
            className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <Bell className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Solicitações</h2>
                    <p className="text-xs text-zinc-500">Convites de amizade e grupos</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {requests.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-zinc-600">
                    <Bell className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm font-medium">Nenhuma solicitação pendente</p>
                  </div>
                ) : (
                  requests.map((request) => (
                    <motion.div
                      key={request.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-[2rem] flex flex-col gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                          {request.type === 'group' ? <Users className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm text-white font-bold truncate">{request.fromName}</p>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-0.5">
                            {request.type === 'group' ? `Te convidou para: ${request.groupName}` : 'Quer ser seu amigo'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => onHandleRequest(request.id, 'accepted')}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-900/10"
                        >
                          <Check className="w-4 h-4" />
                          Aceitar
                        </button>
                        <button
                          onClick={() => onHandleRequest(request.id, 'declined')}
                          className="px-4 flex items-center justify-center bg-zinc-800 hover:bg-red-500/10 hover:text-red-400 text-zinc-400 rounded-xl transition-all"
                          title="Recusar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

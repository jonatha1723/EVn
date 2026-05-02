import React from 'react';
import { User as UserIcon, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { UserData } from '../../types';
import { safeToDate, getRelativeTime } from '../../lib/dateUtils';

interface ContactListProps {
  contacts: UserData[];
  activeContact: UserData | null;
  setActiveContact: (contact: UserData | null) => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  activeContact,
  setActiveContact
}) => {
  return (
    <div className="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
      <h2 className="text-[11px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-4 px-4">Conversas</h2>
      <div className="space-y-1">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 mt-4 bg-zinc-900/20 rounded-[2rem] border border-zinc-800/50 border-dashed">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 flex items-center justify-center mb-4">
              <UserIcon className="w-8 h-8 text-zinc-700" />
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed font-medium">Nenhuma conversa ativa.</p>
            <p className="text-zinc-600 text-[10px] mt-1">Adicione um ID ou compartilhe seu link de convite.</p>
          </div>
        ) : (
          contacts.map((contact, index) => {
            const isActive = activeContact?.uid === contact.uid;
            return (
              <motion.button
                key={contact.uid}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveContact(contact)}
                className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all text-left group ${
                  isActive 
                    ? 'bg-emerald-500/5 border border-emerald-500/20 shadow-lg shadow-emerald-900/5' 
                    : 'hover:bg-zinc-900/70 border border-transparent'
                }`}
              >
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 transition-all ${
                  isActive 
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 group-hover:text-emerald-500 group-hover:border-zinc-700'
                }`}>
                  {contact.displayName.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <p className={`font-semibold truncate transition-colors ${
                      isActive ? 'text-emerald-50' : 'text-zinc-100 group-hover:text-white'
                    }`}>
                      {contact.displayName}
                    </p>
                    {/* Indicador de conversa no desktop */}
                    <MessageSquare className={`w-3.5 h-3.5 hidden md:block shrink-0 transition-all ${
                      isActive ? 'text-emerald-500' : 'text-zinc-700 group-hover:text-zinc-500'
                    }`} />
                  </div>
                  {(() => {
                    const lastSeen = contact.lastActive ? safeToDate(contact.lastActive).getTime() : 0;
                    const isOnline = contact.lastActive && (Date.now() - lastSeen < 150000);

                    if (isOnline) {
                      return (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-pulse" />
                          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">ON</p>
                        </div>
                      );
                    }

                    const timeStr = lastSeen ? safeToDate(contact.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                    const dateStr = lastSeen ? safeToDate(contact.lastActive).toLocaleDateString([], { day: '2-digit', month: '2-digit' }) : '';
                    const isToday = lastSeen && new Date().toDateString() === safeToDate(contact.lastActive).toDateString();

                    return (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                          OFF • {getRelativeTime(contact.lastActive)}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </div>
  );
};

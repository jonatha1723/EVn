import React from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { UserData } from '../../types';
import { safeToDate, getRelativeTime } from '../../lib/dateUtils';

interface ChatHeaderProps {
  activeContact: UserData;
  onBack: () => void;
  onClearChat: () => void;
  hasMessages: boolean;
  isTyping: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  activeContact, 
  onBack, 
  onClearChat,
  hasMessages,
  isTyping
}) => {
  const presenceStatus = (() => {
    if (isTyping) return <p className="text-[10px] text-emerald-400 font-bold tracking-wider animate-pulse">Digitando...</p>;
    
    if (!activeContact.lastActive) return <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-0.5">OFF</p>;
    
    const lastSeen = safeToDate(activeContact.lastActive).getTime();
    const isOnline = Date.now() - lastSeen < 120000;

    if (isOnline) return <p className="text-[10px] text-emerald-400 font-bold tracking-widest uppercase mt-0.5">ON</p>;

    return <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-0.5">OFF • {getRelativeTime(activeContact.lastActive)}</p>;
  })();

  return (
    <div className="h-20 border-b border-[var(--border-color)] flex items-center px-4 md:px-8 bg-[var(--bg-chat)] backdrop-blur-xl z-10 sticky top-0 transition-colors duration-300">
      <div className="flex items-center gap-4 w-full">
        <button 
          onClick={onBack}
          className="md:hidden p-2 text-zinc-500 hover:text-white active:bg-zinc-900 rounded-xl transition-all"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-emerald-500 flex items-center justify-center font-bold text-xl shadow-inner">
          {activeContact.displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 overflow-hidden">
          <h2 className="font-bold text-lg truncate text-white tracking-tight">{activeContact.displayName}</h2>
          {presenceStatus}
        </div>
        {hasMessages && (
          <button
            onClick={onClearChat}
            className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all ml-auto"
            title="Limpar Conversa"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

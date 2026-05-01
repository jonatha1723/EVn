import React from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { UserData } from '../../types';

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
  return (
    <div className="h-20 border-b border-zinc-900 flex items-center px-4 md:px-8 bg-zinc-950/80 backdrop-blur-xl z-10 sticky top-0">
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
          {isTyping ? (
            <p className="text-[10px] text-emerald-400 font-bold tracking-wider animate-pulse">Digitando...</p>
          ) : (
            <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-0.5">Online</p>
          )}
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

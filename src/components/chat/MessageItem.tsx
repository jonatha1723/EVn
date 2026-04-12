import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Check, Loader2, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DecryptedMessage, UserData, MessagePosition } from '../../types';
import { MessageFile } from './MessageFile';
import { MessageReply } from './MessageReply';

interface MessageItemProps {
  msg: DecryptedMessage;
  user: User;
  activeContact: UserData;
  repliedMsg?: DecryptedMessage | null;
  isTranslating: boolean;
  translatedText?: string;
  onSelect: (msg: DecryptedMessage, pos: MessagePosition) => void;
  isSelected: boolean;
  privateKey: JsonWebKey | null;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  msg,
  user,
  activeContact,
  repliedMsg,
  isTranslating,
  translatedText,
  onSelect,
  isSelected,
  privateKey
}) => {
  const isMe = msg.senderId === user.uid;
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleSelect = (e: React.TouchEvent | React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSelect(msg, {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.currentTarget;
    timerRef.current = setTimeout(() => {
      const rect = target.getBoundingClientRect();
      onSelect(msg, {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: isSelected ? -10 : 0, 
        scale: isSelected ? 1.05 : 1 
      }}
      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
    >
      <div 
        onContextMenu={(e) => { e.preventDefault(); handleSelect(e); }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
        className={`group relative max-w-[85%] md:max-w-[70%] px-5 py-3 shadow-xl cursor-pointer select-none transition-all hover:ring-2 hover:ring-emerald-500/20 overflow-hidden ${isMe ? 'bg-emerald-600 text-white rounded-[1.5rem] rounded-tr-sm' : 'bg-zinc-900 text-zinc-100 rounded-[1.5rem] rounded-tl-sm border border-zinc-800'} ${isSelected ? 'ring-2 ring-emerald-500' : ''}`}
      >
        {repliedMsg && (
          <MessageReply repliedMsg={repliedMsg} user={user} activeContact={activeContact} />
        )}
        
        <MessageFile msg={msg} privateKey={privateKey} currentUserId={user.uid} />

        {msg.text && (
          <p className="whitespace-pre-wrap break-words break-all text-[15px] leading-relaxed font-medium">{msg.text}</p>
        )}
        
        <AnimatePresence>
          {isTranslating && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-[11px] opacity-70 italic font-medium"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              Traduzindo...
            </motion.div>
          )}
        </AnimatePresence>

        {translatedText && (
          <div className="mt-3 pt-3 border-t border-white/10 text-[14px] opacity-90 italic leading-relaxed">
            <div className="text-[9px] uppercase tracking-[0.2em] font-bold mb-1.5 opacity-50 flex items-center gap-1.5">
              <Languages className="w-3 h-3" /> Tradução
            </div>
            {translatedText}
          </div>
        )}
        
        <div className={`flex items-center justify-end gap-1.5 mt-2 ${isMe ? 'text-emerald-200/70' : 'text-zinc-500'}`}>
          <p className="text-[9px] font-bold tracking-tighter">
            {new Date(msg.timestamp ? msg.timestamp.toDate() : msg.clientTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          {isMe && (
            msg.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin opacity-50" />
            ) : (
              <Check className="w-3 h-3" />
            )
          )}
        </div>
      </div>
    </motion.div>
  );
};

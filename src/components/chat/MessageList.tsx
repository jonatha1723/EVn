import React, { useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { DecryptedMessage, UserData, MessagePosition } from '../../types';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: DecryptedMessage[];
  user: User;
  activeContact: UserData;
  messageLimit: number;
  onLoadMore: () => void;
  onSelectMessage: (msg: DecryptedMessage, pos: MessagePosition) => void;
  isTranslating: string | null;
  translatedMessages: Record<string, string>;
  selectedMessageId: string | null;
  privateKey: JsonWebKey | null;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  user,
  activeContact,
  messageLimit,
  onLoadMore,
  onSelectMessage,
  isTranslating,
  translatedMessages,
  selectedMessageId,
  privateKey
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mountTime = useRef(Date.now());

  useEffect(() => {
    // Se o componente acabou de ser montado (menos de 2 segundos),
    // qualquer atualização de mensagens fará um salto instantâneo.
    const timeSinceMount = Date.now() - mountTime.current;
    
    if (messages.length > 0) {
      if (timeSinceMount < 2000) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      } else {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-zinc-900 rounded-[2rem] flex items-center justify-center mb-6 border border-zinc-800 shadow-inner"
        >
          <MessageSquare className="w-10 h-10 text-zinc-700" />
        </motion.div>
        <p className="text-zinc-300 font-semibold text-lg">Inicie a conversa</p>
        <p className="text-sm mt-2 text-zinc-500 text-center max-w-[280px] leading-relaxed">Envie uma mensagem para começar.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 overflow-y-auto p-4 md:p-8 flex flex-col gap-4 scroll-smooth">
      {messages.length >= messageLimit && (
        <div className="flex justify-center mb-6">
          <button 
            onClick={onLoadMore}
            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[11px] font-bold uppercase tracking-widest px-6 py-2.5 rounded-full transition-all border border-zinc-800 shadow-lg"
          >
            Carregar mais mensagens
          </button>
        </div>
      )}

      {messages.map((msg, idx) => {
        const repliedMsg = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null;
        
        const prevMsg = idx > 0 ? messages[idx - 1] : null;
        
        const msgDate = new Date(msg.clientTimestamp);
        const prevMsgDate = prevMsg ? new Date(prevMsg.clientTimestamp) : null;
        
        const isNewDay = idx === 0 || (prevMsgDate && msgDate.toDateString() !== prevMsgDate.toDateString());
        
        const formatSeparatorText = (date: Date) => {
          const now = new Date();
          const isToday = date.toDateString() === now.toDateString();
          const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
          
          if (isToday) return 'Hoje';
          if (isYesterday) return 'Ontem';
          
          return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
        };
        
        return (
          <React.Fragment key={msg.id}>
            {isNewDay && (
              <div className="flex justify-center my-8">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] bg-zinc-900/30 px-5 py-1.5 rounded-full border border-zinc-800/30 backdrop-blur-md">
                  {formatSeparatorText(msgDate)}
                </span>
              </div>
            )}
            <MessageItem 
              msg={msg}
              user={user}
              activeContact={activeContact}
              repliedMsg={repliedMsg}
              isTranslating={isTranslating === msg.id}
              translatedText={translatedMessages[msg.id]}
              onSelect={onSelectMessage}
              isSelected={selectedMessageId === msg.id}
              privateKey={privateKey}
            />
          </React.Fragment>
        );
      })}
      <div ref={messagesEndRef} className="h-4" />
    </div>
  );
};

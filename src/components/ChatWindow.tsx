import React from 'react';
import { User } from 'firebase/auth';
import { ShieldCheck, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserData, DecryptedMessage, MessagePosition, Group } from '../types';
import { ChatHeader } from './chat/ChatHeader';
import { MessageList } from './chat/MessageList';
import { MessageInput } from './chat/MessageInput';
import { ChatModals } from './chat/ChatModals';
import { useChatWindow } from '../hooks/useChatWindow';

interface ChatWindowProps {
  user: User | null;
  activeContact: UserData | null;
  setActiveContact: (contact: UserData | null) => void;
  activeGroup: Group | null;
  setActiveGroup: (group: Group | null) => void;
  messages: DecryptedMessage[];
  onSendMessage: (text: string, replyToId?: string) => Promise<void>;
  onSendFile: (file: File) => Promise<void>;
  onDeleteMessage: (msgId: string) => Promise<void>;
  onClearChat: () => void;
  localDeletedMessages: Set<string>;
  messageLimit: number;
  setMessageLimit: (val: number | ((prev: number) => number)) => void;
  isContactTyping: boolean;
  setTypingStatus: (isTyping: boolean) => Promise<void>;
  privateKey: JsonWebKey | null;
  settings: any;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  user,
  activeContact,
  setActiveContact,
  activeGroup,
  setActiveGroup,
  messages,
  onSendMessage,
  onSendFile,
  onDeleteMessage,
  onClearChat,
  localDeletedMessages,
  messageLimit,
  setMessageLimit,
  isContactTyping,
  setTypingStatus,
  privateKey,
  settings
}) => {
  const {
    newMessage,
    setNewMessage,
    replyingTo,
    setReplyingTo,
    selectedMessage,
    selectedMessagePosition,
    showDeleteModal,
    setShowDeleteModal,
    translatedMessages,
    isTranslating,
    handleSelectMessage,
    handleDeselectMessage,
    handleSendMessageSubmit,
    handleTranslate
  } = useChatWindow(onSendMessage, setTypingStatus);

  const filteredMessages = messages.filter(m => !localDeletedMessages.has(m.id));

  if (!activeContact && !activeGroup) {
    return (
      <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-zinc-950 p-8 text-center transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <div className="relative mb-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 w-28 h-28 rounded-[2.5rem] border-2 border-dashed border-emerald-500/10"
            />
            <div className="w-28 h-28 bg-zinc-900 rounded-[2.5rem] flex items-center justify-center border border-zinc-800 shadow-2xl">
              <ShieldCheck className="w-14 h-14 text-emerald-500/30" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Privacidade Total</h2>
          <p className="max-w-md text-zinc-500 leading-relaxed font-medium">
            Selecione uma conversa ou grupo para começar a trocar mensagens criptografadas de ponta a ponta.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-zinc-950 relative overflow-hidden h-full">
      <ChatHeader 
        activeContact={activeContact || ({ uid: activeGroup?.id, displayName: activeGroup?.name, email: 'Grupo', isGroup: true } as any)}
        onBack={() => { setActiveContact(null); setActiveGroup(null); }}
        onClearChat={() => setShowDeleteModal(true)}
        hasMessages={messages.length > 0}
        isTyping={isContactTyping}
      />

      <div className="flex-1 overflow-hidden flex flex-col relative">
        <MessageList 
          messages={filteredMessages}
          user={user}
          activeContact={activeContact || ({ uid: activeGroup?.id, displayName: activeGroup?.name } as any)}
          messageLimit={messageLimit}
          onLoadMore={() => setMessageLimit(prev => prev + 50)}
          onSelectMessage={handleSelectMessage}
          isTranslating={!!isTranslating}
          translatedMessages={translatedMessages}
          selectedMessageId={selectedMessage?.id || null}
          privateKey={privateKey}
          settings={settings}
        />
        
        <AnimatePresence>
          {isContactTyping && !activeGroup && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-6 left-6 md:left-10 flex items-center gap-3 py-2 px-4 bg-zinc-950/80 backdrop-blur-xl rounded-2xl border border-emerald-500/10 shadow-2xl z-20"
            >
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
              </div>
              <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-[0.2em]">
                {activeContact?.displayName} está digitando...
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MessageInput 
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        activeContact={activeContact || ({ uid: activeGroup?.id, displayName: activeGroup?.name } as any)}
        user={user}
        onSubmit={handleSendMessageSubmit}
        onSendFile={onSendFile}
        onTyping={(status) => setTypingStatus(status)}
      />

      <ChatModals 
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        selectedMessage={selectedMessage}
        setSelectedMessage={handleDeselectMessage}
        selectedMessagePosition={selectedMessagePosition}
        onClearChat={onClearChat}
        onReply={setReplyingTo}
        onCopy={(text) => navigator.clipboard.writeText(text)}
        onTranslate={handleTranslate}
        onDeleteForEveryone={onDeleteMessage}
        isOwnMessage={selectedMessage?.senderId === user?.uid}
      />
    </div>
  );
};

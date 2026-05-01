import React from 'react';
import { User } from 'firebase/auth';
import { ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserData, DecryptedMessage, MessagePosition } from '../types';
import { ChatHeader } from './chat/ChatHeader';
import { MessageList } from './chat/MessageList';
import { MessageInput } from './chat/MessageInput';
import { ChatModals } from './chat/ChatModals';
import { useChatWindow } from '../hooks/useChatWindow';

interface ChatWindowProps {
  user: User;
  activeContact: UserData | null;
  setActiveContact: (contact: UserData | null) => void;
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

  return (
    <div className={`flex-1 min-w-0 flex flex-col bg-[var(--bg-chat)] relative transition-colors duration-300 ${!activeContact ? 'hidden md:flex' : 'flex'}`}>
      <AnimatePresence mode="wait">
        {activeContact ? (
          <motion.div 
            key={activeContact.uid}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col h-full"
          >
            <ChatHeader 
              activeContact={activeContact}
              onBack={() => setActiveContact(null)}
              onClearChat={() => setShowDeleteModal(true)}
              hasMessages={messages.length > 0}
              isTyping={isContactTyping}
            />

            <MessageList 
              messages={filteredMessages}
              user={user}
              activeContact={activeContact}
              messageLimit={messageLimit}
              onLoadMore={() => setMessageLimit(prev => prev + 50)}
              onSelectMessage={handleSelectMessage}
              isTranslating={isTranslating}
              translatedMessages={translatedMessages}
              selectedMessageId={selectedMessage?.id || null}
              privateKey={privateKey}
              settings={settings}
            />

            <MessageInput 
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              activeContact={activeContact}
              user={user}
              onSubmit={handleSendMessageSubmit}
              onSendFile={onSendFile}
              onTyping={setTypingStatus}
            />
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="hidden md:flex flex-1 flex-col items-center justify-center text-zinc-500 bg-zinc-950"
          >
            {/* Anel animado */}
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
            <p className="max-w-md text-center text-zinc-500 leading-relaxed font-medium">
              Selecione uma conversa na barra lateral para começar a trocar mensagens criptografadas de ponta a ponta.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

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
        isOwnMessage={selectedMessage?.senderId === user.uid}
      />
    </div>
  );
};

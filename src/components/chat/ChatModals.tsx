import React from 'react';
import { Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DecryptedMessage, MessagePosition } from '../../types';
import { MessageMenu } from './MessageMenu';

interface ChatModalsProps {
  showDeleteModal: boolean;
  setShowDeleteModal: (val: boolean) => void;
  selectedMessage: DecryptedMessage | null;
  setSelectedMessage: (msg: DecryptedMessage | null) => void;
  selectedMessagePosition: MessagePosition | null;
  onClearChat: () => void;
  onReply: (msg: DecryptedMessage) => void;
  onCopy: (text: string) => void;
  onTranslate: (msg: DecryptedMessage) => void;
  onDeleteForEveryone: (msgId: string) => void;
  isOwnMessage: boolean;
}

export const ChatModals: React.FC<ChatModalsProps> = ({
  showDeleteModal,
  setShowDeleteModal,
  selectedMessage,
  setSelectedMessage,
  selectedMessagePosition,
  onClearChat,
  onReply,
  onCopy,
  onTranslate,
  onDeleteForEveryone,
  isOwnMessage
}) => {
  const formatTime = (msg: DecryptedMessage) => {
    const date = msg.timestamp ? msg.timestamp.toDate() : new Date(msg.clientTimestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const menuPos = React.useMemo(() => {
    if (!selectedMessagePosition) return { bottom: 20, left: '50%', right: 'auto', transform: 'translateX(-50%)' };
    
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const menuWidth = 230;
    const menuHeight = 320; // Estimated height with preview
    const bottomBuffer = 90; // Buffer for input area and safe margin
    
    // Initial vertical position: align with top of message
    let top = selectedMessagePosition.top;
    
    // Horizontal position: to the side of the message
    let left = isOwnMessage 
      ? selectedMessagePosition.left - menuWidth - 12 // Left of my message
      : selectedMessagePosition.left + selectedMessagePosition.width + 12; // Right of contact's message
    
    // Horizontal boundary checks
    if (left < 16) {
      // If left is blocked, try right side
      left = selectedMessagePosition.left + selectedMessagePosition.width + 12;
    }
    if (left + menuWidth > screenWidth - 16) {
      // If right is blocked, try left side
      left = selectedMessagePosition.left - menuWidth - 12;
    }
    // Final horizontal fallback: center if both sides fail (unlikely but safe)
    if (left < 16 || left + menuWidth > screenWidth - 16) {
      left = (screenWidth - menuWidth) / 2;
    }
    
    // Vertical boundary check: if it goes off the bottom, shift it up
    if (top + menuHeight > screenHeight - bottomBuffer) {
      top = screenHeight - bottomBuffer - menuHeight;
    }
    
    // Ensure it doesn't go off the top
    if (top < 16) top = 16;
    
    return { 
      top, 
      left,
      right: 'auto',
      transform: 'none' 
    };
  }, [selectedMessagePosition, isOwnMessage]);
  return (
    <>
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            key="delete-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 border border-zinc-800 rounded-[3rem] p-10 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Limpar Conversa?</h3>
              <p className="text-zinc-500 text-sm leading-relaxed mb-10">Isso ocultará todas as mensagens desta conversa apenas no seu dispositivo.</p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { onClearChat(); setShowDeleteModal(false); }} 
                  className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-red-900/20"
                >
                  Confirmar Limpeza
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)} 
                  className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-2xl transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedMessage && (
        <MessageMenu
          selectedMessage={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          menuPos={menuPos}
          formatTime={formatTime}
          onReply={onReply}
          onCopy={onCopy}
          onTranslate={onTranslate}
          onDeleteForEveryone={onDeleteForEveryone}
          isOwnMessage={isOwnMessage}
        />
      )}
    </>
  );
};

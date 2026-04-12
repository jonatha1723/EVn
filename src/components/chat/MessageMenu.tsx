import React from 'react';
import { Trash2, Reply, Copy, Languages, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DecryptedMessage, MessagePosition } from '../../types';

interface MessageMenuProps {
  selectedMessage: DecryptedMessage;
  onClose: () => void;
  menuPos: { top: number; left: string | number; right: string | number; transform: string };
  formatTime: (msg: DecryptedMessage) => string;
  onReply: (msg: DecryptedMessage) => void;
  onCopy: (text: string) => void;
  onTranslate: (msg: DecryptedMessage) => void;
  onDeleteForEveryone: (msgId: string) => void;
  isOwnMessage: boolean;
}

export const MessageMenu: React.FC<MessageMenuProps> = ({
  selectedMessage,
  onClose,
  menuPos,
  formatTime,
  onReply,
  onCopy,
  onTranslate,
  onDeleteForEveryone,
  isOwnMessage
}) => {
  return (
    <motion.div 
      key="message-options-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/40" 
      onClick={onClose}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", damping: 25, stiffness: 400 }}
        style={{ 
          position: 'fixed',
          top: menuPos.top,
          left: menuPos.left,
          right: menuPos.right,
          transform: menuPos.transform
        }}
        className="bg-[#1e1e1e] rounded-[1.8rem] w-[230px] shadow-[0_15px_50px_rgba(0,0,0,0.6)] overflow-hidden border border-white/5" 
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-3 border-b border-white/5 bg-white/5">
          <p className="text-zinc-200 text-[14px] font-medium truncate mb-1">{selectedMessage.text}</p>
          <p className="text-zinc-500 text-[11px] font-medium">Hoy, {formatTime(selectedMessage)}</p>
        </div>

        <div className="px-1.5 py-2">
          <button 
            onClick={() => { onReply(selectedMessage); onClose(); }} 
            className="w-full flex items-center gap-3.5 py-2.5 px-4 hover:bg-white/5 text-zinc-100 rounded-[1.2rem] transition-all group"
          >
            <Reply className="w-5 h-5 text-zinc-100" /> 
            <span className="font-medium text-[15px]">Responder</span>
          </button>

          <button 
            onClick={() => { onCopy(selectedMessage.text); onClose(); }} 
            className="w-full flex items-center gap-3.5 py-2.5 px-4 hover:bg-white/5 text-zinc-100 rounded-[1.2rem] transition-all group"
          >
            <Copy className="w-5 h-5 text-zinc-100" /> 
            <span className="font-medium text-[15px]">Copiar</span>
          </button>

          <button 
            onClick={() => { onClose(); }} 
            className="w-full flex items-center gap-3.5 py-2.5 px-4 hover:bg-white/5 text-zinc-100 rounded-[1.2rem] transition-all group"
          >
            <FileText className="w-5 h-5 text-zinc-100" /> 
            <span className="font-medium text-[15px]">Selecionar texto</span>
          </button>

          <button 
            onClick={() => { onTranslate(selectedMessage); onClose(); }} 
            className="w-full flex items-center gap-3.5 py-2.5 px-4 hover:bg-white/5 text-zinc-100 rounded-[1.2rem] transition-all group"
          >
            <Languages className="w-5 h-5 text-zinc-100" /> 
            <span className="font-medium text-[15px]">Traduzir</span>
          </button>

          {isOwnMessage && (
            <button 
              onClick={() => { onDeleteForEveryone(selectedMessage.id); onClose(); }} 
              className="w-full flex items-center gap-3.5 py-2.5 px-4 hover:bg-red-500/10 text-red-500 rounded-[1.2rem] transition-all group"
            >
              <Trash2 className="w-5 h-5" /> 
              <span className="font-medium text-[15px]">Excluir para todos</span>
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

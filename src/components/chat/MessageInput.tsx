import React, { useRef, useState, useLayoutEffect } from 'react';
import { Send, X, Camera, Image as ImageIcon, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DecryptedMessage, UserData } from '../../types';

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (val: string) => void;
  replyingTo: DecryptedMessage | null;
  setReplyingTo: (msg: DecryptedMessage | null) => void;
  activeContact: UserData;
  user: any;
  onSubmit: (e: React.FormEvent) => void;
  onSendFile: (file: File) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  setNewMessage,
  replyingTo,
  setReplyingTo,
  activeContact,
  user,
  onSubmit,
  onSendFile,
  onTyping
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-adjust textarea height
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 150);
      textarea.style.height = `${newHeight}px`;
    }
  }, [newMessage]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewMessage(val);
    if (val.trim()) {
      onTyping(true);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Start upload in background, don't await
    onSendFile(file).catch((error: any) => {
      console.error("Upload error:", error);
      alert("Erro ao enviar imagem: " + (error.message || "Erro desconhecido"));
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-3 md:p-4 bg-zinc-950 border-t border-zinc-900 pb-safe">
      <div className="max-w-5xl mx-auto flex flex-col gap-2">
        <AnimatePresence>
          {replyingTo && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-zinc-900/80 backdrop-blur-md rounded-2xl p-2.5 flex items-center justify-between border-l-4 border-emerald-500 shadow-2xl"
            >
              <div className="flex-1 overflow-hidden pl-2">
                <p className="text-[11px] font-bold text-emerald-400 mb-0.5">
                  {replyingTo.senderId === user.uid ? 'Você' : activeContact.displayName}: {replyingTo.text}
                </p>
              </div>
              <button 
                onClick={() => setReplyingTo(null)} 
                className="p-1.5 ml-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <form onSubmit={onSubmit} className="flex gap-2 items-center bg-zinc-900 rounded-full px-2 py-1.5 border border-zinc-800 shadow-xl">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
          
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="w-10 h-10 rounded-full bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20"
          >
            <Camera className="w-5 h-5" />
          </motion.button>

          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleTextChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e as any);
                }
              }}
              placeholder={replyingTo ? "Responder uma mensa..." : "Escreva uma mensagem..."}
              rows={1}
              className="w-full bg-transparent border-none px-2 py-2 focus:outline-none transition-all text-[15px] text-zinc-100 placeholder:text-zinc-500 resize-none overflow-y-auto max-h-[150px] scrollbar-hide"
            />
          </div>

          <div className="flex items-center gap-1 pr-1">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ImageIcon className="w-6 h-6" />
            </button>
            {newMessage.trim() && (
              <motion.button 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-500 text-white w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-lg shadow-emerald-900/20"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </motion.button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

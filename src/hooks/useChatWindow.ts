import React, { useState } from 'react';
import { DecryptedMessage, MessagePosition } from '../types';
import { translateToPortuguese } from '../lib/translation';

export const useChatWindow = (
  onSendMessage: (text: string, replyToId?: string) => Promise<void>,
  setTypingStatus: (isTyping: boolean) => Promise<void>
) => {
  const [newMessage, setNewMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<DecryptedMessage | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<DecryptedMessage | null>(null);
  const [selectedMessagePosition, setSelectedMessagePosition] = useState<MessagePosition | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState<string | null>(null);

  const handleSelectMessage = (msg: DecryptedMessage, pos: MessagePosition) => {
    setSelectedMessage(msg);
    setSelectedMessagePosition(pos);
  };

  const handleDeselectMessage = () => {
    setSelectedMessage(null);
    setSelectedMessagePosition(null);
  };

  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const text = newMessage;
    const replyId = replyingTo?.id;
    setNewMessage('');
    setReplyingTo(null);
    setTypingStatus(false);
    await onSendMessage(text, replyId);
  };

  const handleTranslate = async (msg: DecryptedMessage) => {
    if (translatedMessages[msg.id]) {
      setTranslatedMessages(prev => {
        const next = { ...prev };
        delete next[msg.id];
        return next;
      });
      return;
    }

    setIsTranslating(msg.id);
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const translated = translateToPortuguese(msg.text);
      setTranslatedMessages(prev => ({ ...prev, [msg.id]: translated }));
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setIsTranslating(null);
    }
  };

  return {
    newMessage,
    setNewMessage,
    replyingTo,
    setReplyingTo,
    selectedMessage,
    setSelectedMessage,
    selectedMessagePosition,
    setSelectedMessagePosition,
    showDeleteModal,
    setShowDeleteModal,
    translatedMessages,
    isTranslating,
    handleSelectMessage,
    handleDeselectMessage,
    handleSendMessageSubmit,
    handleTranslate
  };
};

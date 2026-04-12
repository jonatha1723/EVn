import React from 'react';
import { DecryptedMessage, UserData } from '../../types';
import { User } from 'firebase/auth';

interface MessageReplyProps {
  repliedMsg: DecryptedMessage;
  user: User;
  activeContact: UserData;
}

export const MessageReply: React.FC<MessageReplyProps> = ({ repliedMsg, user, activeContact }) => {
  return (
    <div className="bg-black/20 rounded-xl p-3 mb-3 border-l-4 border-emerald-400 text-sm opacity-90 backdrop-blur-sm">
      <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider mb-1">
        {repliedMsg.senderId === user.uid ? 'Você' : activeContact.displayName}
      </p>
      <p className="truncate text-zinc-200 text-xs">
        {repliedMsg.text || (repliedMsg.fileUrl ? '[Arquivo]' : '')}
      </p>
    </div>
  );
};

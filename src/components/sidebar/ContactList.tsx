import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { UserData } from '../../types';

interface ContactListProps {
  contacts: UserData[];
  activeContact: UserData | null;
  setActiveContact: (contact: UserData | null) => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  contacts,
  activeContact,
  setActiveContact
}) => {
  return (
    <div className="flex-1 overflow-y-auto px-3 py-4">
      <h2 className="text-[11px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-4 px-4">Conversas</h2>
      <div className="space-y-1">
        {contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 mt-4 bg-zinc-900/20 rounded-[2rem] border border-zinc-800/50 border-dashed">
            <UserIcon className="w-8 h-8 text-zinc-700 mb-3" />
            <p className="text-zinc-500 text-xs leading-relaxed">Nenhuma conversa ativa.<br/>Adicione um ID para começar.</p>
          </div>
        ) : (
          contacts.map(contact => (
            <motion.button
              key={contact.uid}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveContact(contact)}
              className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all text-left ${activeContact?.uid === contact.uid ? 'bg-zinc-900 border border-zinc-800 shadow-lg' : 'hover:bg-zinc-900/50 border border-transparent'}`}
            >
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-emerald-500 flex items-center justify-center font-bold text-lg shadow-inner">
                {contact.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold text-zinc-100 truncate">{contact.displayName}</p>
                <p className="text-[10px] text-zinc-500 font-mono truncate mt-0.5 tracking-wider">{contact.uniqueCode}</p>
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  );
};

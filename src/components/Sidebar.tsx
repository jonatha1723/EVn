import React from 'react';
import { Trash2, AlertTriangle, Loader2, MessageSquare, Users as UsersIcon } from 'lucide-react';
import { UserData, Group, GroupRequest } from '../types';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SettingsModal } from './sidebar/SettingsModal';
import { CreateGroupModal } from './sidebar/CreateGroupModal';
import { NotificationCenter } from './sidebar/NotificationCenter';
import { APP_VERSION } from '../lib/dateUtils';
import { UserCodeCard } from './sidebar/UserCodeCard';
import { AddContactForm } from './sidebar/AddContactForm';
import { ContactList } from './sidebar/ContactList';
import { useGroups } from '../hooks/useGroups';
import { motion } from 'motion/react';

interface SidebarProps {
  userData: UserData | null;
  contacts: UserData[];
  activeContact: UserData | null;
  setActiveContact: (contact: UserData | null) => void;
  activeGroup: Group | null;
  setActiveGroup: (group: Group | null) => void;
  onLogout: () => void;
  onAddContact: (code: string) => Promise<void>;
  onFactoryReset: () => Promise<void>;
  hasKeys: boolean;
  settings: any;
  onUpdateSettings: (settings: any) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userData,
  contacts,
  activeContact,
  setActiveContact,
  activeGroup,
  setActiveGroup,
  onLogout,
  onAddContact,
  onFactoryReset,
  hasKeys,
  settings,
  onUpdateSettings
}) => {
  const [isConfirming, setIsConfirming] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [showCreateGroup, setShowCreateGroup] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'chats' | 'groups'>('chats');

  const { groups, requests, createGroup, handleRequest, loadingGroups } = useGroups(userData, userData);

  const handleReset = async () => {
    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    setIsResetting(true);
    try {
      await onFactoryReset();
    } catch (err) {
      alert("Erro ao resetar banco de dados");
      setIsConfirming(false);
      setIsResetting(false);
    }
  };

  const handleSelectContact = (contact: UserData | null) => {
    setActiveGroup(null);
    setActiveContact(contact);
  };

  const handleSelectGroup = (group: Group | null) => {
    setActiveContact(null);
    setActiveGroup(group);
  };

  return (
    <div className={`w-full md:w-96 border-r border-zinc-800 flex flex-col bg-zinc-950 ${activeContact || activeGroup ? 'hidden md:flex' : 'flex'}`}>
      {/* App Bar */}
      <div className="p-6 bg-zinc-950 border-b border-zinc-900 sticky top-0 z-10">
        <SidebarHeader 
          onLogout={onLogout} 
          onOpenSettings={() => setShowSettings(true)}
          onCreateGroup={() => setShowCreateGroup(true)}
          onOpenNotifications={() => setShowNotifications(true)}
          hasNotifications={requests.length > 0}
        />
        <UserCodeCard userData={userData} />
      </div>

      {/* Tabs */}
      <div className="flex p-2 gap-1 bg-zinc-950 border-b border-zinc-900">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all font-bold text-[10px] uppercase tracking-widest ${
            activeTab === 'chats' ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Conversas
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all font-bold text-[10px] uppercase tracking-widest ${
            activeTab === 'groups' ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <UsersIcon className="w-4 h-4" />
          Grupos
        </button>
      </div>

      {/* Modais */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdate={onUpdateSettings}
      />
      
      <CreateGroupModal 
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreate={createGroup}
      />

      <NotificationCenter 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        requests={requests}
        onHandleRequest={handleRequest}
      />

      {/* Search/Add Section (Só para chats) */}
      {activeTab === 'chats' && <AddContactForm onAddContact={onAddContact} />}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' ? (
          <ContactList 
            contacts={contacts}
            activeContact={activeContact}
            setActiveContact={handleSelectContact}
          />
        ) : (
          <div className="p-4 space-y-1">
            {groups.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-zinc-600 px-8 text-center">
                <UsersIcon className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">Nenhum grupo encontrado</p>
                <p className="text-[10px] mt-1 text-zinc-700">Crie um grupo ou aguarde convites.</p>
              </div>
            ) : (
              groups.map((group) => {
                const isActive = activeGroup?.id === group.id;
                return (
                  <motion.button
                    key={group.id}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectGroup(group)}
                    className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all text-left group ${
                      isActive 
                        ? 'bg-emerald-500/5 border border-emerald-500/20 shadow-lg' 
                        : 'hover:bg-zinc-900/70 border border-transparent'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                      <img 
                        src={[
                          "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=100&h=100&fit=crop",
                          "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=100&h=100&fit=crop",
                          "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=100&h=100&fit=crop"
                        ][group.imageIndex]} 
                        className="w-full h-full object-cover"
                        alt={group.name}
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className={`font-semibold truncate transition-colors ${isActive ? 'text-emerald-50' : 'text-zinc-100'}`}>
                        {group.name}
                      </p>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">
                        {group.members.length} {group.members.length === 1 ? 'membro' : 'membros'}
                      </p>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Version */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-950/50">
        <p className="text-[9px] text-zinc-700 text-center font-mono">
          EVN-CORE v{APP_VERSION} • {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Danger Zone - Only for Admin */}
      {userData?.email === 'jogonesteterp@gmail.com' && (
        <div className="p-4 border-t border-zinc-900 bg-zinc-950/50">
          {isConfirming ? (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] text-red-500 font-bold text-center uppercase tracking-tighter">
                Tem certeza? Isso apagará TUDO!
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleReset}
                  disabled={isResetting}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 flex items-center justify-center"
                >
                  {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : "SIM"}
                </button>
                <button
                  onClick={() => setIsConfirming(false)}
                  disabled={isResetting}
                  className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all text-[10px] font-bold uppercase tracking-widest"
                >
                  NÃO
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirming(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all border border-red-500/20 text-xs font-bold uppercase tracking-widest"
            >
              <Trash2 className="w-4 h-4" />
              Resetar Banco
            </button>
          )}
        </div>
      )}
    </div>
  );
};

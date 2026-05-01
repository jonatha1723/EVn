import React from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { UserData } from '../types';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { SettingsModal } from './sidebar/SettingsModal';
import { APP_VERSION } from '../lib/dateUtils';
import { UserCodeCard } from './sidebar/UserCodeCard';
import { AddContactForm } from './sidebar/AddContactForm';
import { ContactList } from './sidebar/ContactList';

interface SidebarProps {
  userData: UserData | null;
  contacts: UserData[];
  activeContact: UserData | null;
  setActiveContact: (contact: UserData | null) => void;
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

  return (
    <div className={`w-full md:w-96 border-r border-zinc-800 flex flex-col bg-zinc-950 ${activeContact ? 'hidden md:flex' : 'flex'}`}>
      {/* App Bar */}
      <div className="p-6 bg-zinc-950 border-b border-zinc-900 sticky top-0 z-10">
        <SidebarHeader 
          onLogout={onLogout} 
          onOpenSettings={() => setShowSettings(true)}
        />
        <UserCodeCard userData={userData} />
      </div>

      {/* Modal de Configurações */}
      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdate={onUpdateSettings}
      />

      {/* Add Contact Section */}
      <AddContactForm onAddContact={onAddContact} />

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        <ContactList 
          contacts={contacts}
          activeContact={activeContact}
          setActiveContact={setActiveContact}
        />
      </div>

      {/* Version */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-950/50 flex flex-col gap-2">
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : "SIM, APAGAR TUDO"}
                </button>
                <button
                  onClick={() => setIsConfirming(false)}
                  disabled={isResetting}
                  className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  CANCELAR
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all border border-red-500/20 text-xs font-bold uppercase tracking-widest"
            >
              <Trash2 className="w-4 h-4" />
              Resetar Banco de Dados
            </button>
          )}
        </div>
      )}
    </div>
  );
};

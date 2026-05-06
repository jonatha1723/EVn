import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Type, Palette, Monitor, Sun, Moon, Square, LayoutGrid, Shield, UserX } from 'lucide-react';
import { ChatTheme } from '../../hooks/useSettings';
import { UserData } from '../../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    fontSize: number;
    chatTheme: ChatTheme;
    letterSpacing: number;
  };
  onUpdate: (settings: any) => void;
  userData: UserData | null;
  contacts: UserData[];
  onUpdateUserPrivacySettings: (settings: Partial<NonNullable<UserData['settings']>>) => Promise<void>;
  onUnblockInviteUser: (uid: string) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdate,
  userData,
  contacts,
  onUpdateUserPrivacySettings,
  onUnblockInviteUser
}) => {
  if (!isOpen) return null;

  const themes: { id: ChatTheme; name: string; icon: any; class: string }[] = [
    { id: 'dark', name: 'Escuro Clássico', icon: Moon, class: 'bg-zinc-900 border-zinc-800' },
    { id: 'black-spark', name: 'Black Spark', icon: Square, class: 'bg-black border-emerald-500/20' },
    { id: 'light', name: 'Claro', icon: Sun, class: 'bg-zinc-100 border-zinc-300' },
    { id: 'white', name: 'Branco Total', icon: LayoutGrid, class: 'bg-white border-zinc-200' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <Monitor className="w-5 h-5 text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">Configurações</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-zinc-900 rounded-xl transition-all text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Fonte Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-400">
                <Type className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Personalizar Texto</h3>
              </div>
              
              <div className="space-y-6 bg-zinc-900/30 p-5 rounded-3xl border border-zinc-800">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-zinc-300">Tamanho da Letra</label>
                    <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                      {settings.fontSize}px
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="12" 
                    max="24" 
                    value={settings.fontSize}
                    onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-zinc-300">Espaçamento</label>
                    <span className="text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                      {settings.letterSpacing}px
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="-1" 
                    max="5" 
                    step="0.5"
                    value={settings.letterSpacing}
                    onChange={(e) => onUpdate({ letterSpacing: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              </div>
            </section>

            {/* Temas Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-400">
                <Palette className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Tema Visual</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => onUpdate({ chatTheme: theme.id })}
                    className={`flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all ${
                      settings.chatTheme === theme.id 
                        ? 'border-emerald-500 bg-emerald-500/5' 
                        : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 text-zinc-500'
                    }`}
                  >
                    <div className={`p-3 rounded-2xl ${theme.class} border shadow-lg`}>
                      <theme.icon className={`w-5 h-5 ${settings.chatTheme === theme.id ? 'text-emerald-500' : 'text-zinc-400'}`} />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${settings.chatTheme === theme.id ? 'text-emerald-400' : ''}`}>
                      {theme.name}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Preview Section */}
            <section className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 text-center">Prévia das Mensagens</h3>
              <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-3xl p-6 space-y-4">
                <div 
                  className="bg-emerald-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm self-end max-w-[80%] ml-auto"
                  style={{ fontSize: `${settings.fontSize}px`, letterSpacing: `${settings.letterSpacing}px` }}
                >
                  Exemplo de como sua mensagem vai aparecer.
                </div>
                <div 
                  className="bg-zinc-800 text-zinc-100 px-4 py-2 rounded-2xl rounded-tl-sm self-start max-w-[80%]"
                  style={{ fontSize: `${settings.fontSize}px`, letterSpacing: `${settings.letterSpacing}px` }}
                >
                  Legal! O tema está ficando ótimo.
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-zinc-400">
                <Shield className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Pedidos e Bloqueios</h3>
              </div>

              <div className="space-y-4 bg-zinc-900/30 p-5 rounded-3xl border border-zinc-800">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">Aceitar pedidos automaticamente</p>
                    <p className="text-xs text-zinc-600 mt-1">Quando desligado, os pedidos chegam no sininho.</p>
                  </div>
                  <button
                    onClick={() => onUpdateUserPrivacySettings({
                      friendRequestsMode: userData?.settings?.friendRequestsMode === 'auto' ? 'manual' : 'auto'
                    })}
                    className={`w-12 h-7 rounded-full p-1 transition-all ${userData?.settings?.friendRequestsMode === 'auto' ? 'bg-emerald-600' : 'bg-zinc-800'}`}
                  >
                    <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${userData?.settings?.friendRequestsMode === 'auto' ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                <div className="border-t border-zinc-800 pt-4">
                  <div className="flex items-center gap-2 mb-3 text-zinc-500">
                    <UserX className="w-4 h-4" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Bloqueados para convites</p>
                  </div>
                  {(!userData?.settings?.blockedInviteUids || userData.settings.blockedInviteUids.length === 0) ? (
                    <p className="text-xs text-zinc-600">Nenhum usuario bloqueado.</p>
                  ) : (
                    <div className="space-y-2">
                      {userData.settings.blockedInviteUids.map(uid => {
                        const contact = contacts.find(c => c.uid === uid);
                        return (
                          <div key={uid} className="flex items-center justify-between gap-3 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-sm text-zinc-200 font-semibold truncate">{contact?.displayName || uid.slice(0, 8)}</p>
                              <p className="text-[10px] text-zinc-600 font-mono truncate">{uid}</p>
                            </div>
                            <button
                              onClick={() => onUnblockInviteUser(uid)}
                              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-emerald-600 text-zinc-300 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all"
                            >
                              Desbloquear
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="p-4 bg-zinc-900/30 border-t border-zinc-900 text-center">
            <p className="text-[9px] text-zinc-600 font-medium uppercase tracking-[0.2em]">As alterações são salvas automaticamente</p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

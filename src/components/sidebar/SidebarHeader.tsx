import { FC } from 'react';
import { LogOut, Settings, Users, Bell } from 'lucide-react';

interface SidebarHeaderProps {
  onLogout: () => void;
  onOpenSettings: () => void;
  onCreateGroup: () => void;
  onOpenNotifications: () => void;
  hasNotifications: boolean;
}

export const SidebarHeader: FC<SidebarHeaderProps> = ({ 
  onLogout, 
  onOpenSettings,
  onCreateGroup,
  onOpenNotifications,
  hasNotifications
}) => {
  return (
    <div className="flex items-center justify-between mb-6 px-1">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
          <Users className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">EVn</h1>
      </div>
      
      <div className="flex items-center gap-1">
        <button 
          onClick={onOpenNotifications}
          className="p-2.5 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-xl transition-all relative"
          title="Notificações"
        >
          <Bell className="w-5 h-5" />
          {hasNotifications && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-zinc-950" />
          )}
        </button>
        <button 
          onClick={onCreateGroup}
          className="p-2.5 text-zinc-500 hover:text-emerald-400 hover:bg-zinc-900 rounded-xl transition-all"
          title="Criar Grupo"
        >
          <Users className="w-5 h-5" />
        </button>
        <button 
          onClick={onOpenSettings}
          className="p-2.5 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-xl transition-all"
          title="Configurações"
        >
          <Settings className="w-5 h-5" />
        </button>
        <button 
          onClick={onLogout}
          className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-xl transition-all"
          title="Sair"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

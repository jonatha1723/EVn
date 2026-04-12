import React from 'react';
import { ShieldCheck, LogOut } from 'lucide-react';

interface SidebarHeaderProps {
  onLogout: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ onLogout }) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-emerald-500" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">Meu ID</h1>
      </div>
      <button 
        onClick={onLogout} 
        className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-xl transition-all"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  );
};

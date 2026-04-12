import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { UserData } from '../../types';

interface UserCodeCardProps {
  userData: UserData | null;
}

export const UserCodeCard: React.FC<UserCodeCardProps> = ({ userData }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    if (userData?.uniqueCode) {
      navigator.clipboard.writeText(userData.uniqueCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 flex items-center justify-between group shadow-lg"
    >
      <div className="flex flex-col">
        <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-1">Meu ID</p>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <code className="font-mono text-zinc-200 text-sm tracking-widest font-medium">
            {userData?.uniqueCode ? (
              <>
                <span className="text-emerald-400/90">{userData.uniqueCode.slice(0, 10)}</span>
                <span className="text-zinc-400">{userData.uniqueCode.slice(10)}</span>
              </>
            ) : '...'}
          </code>
        </div>
      </div>
      <button 
        onClick={copyCode} 
        className="p-2.5 text-zinc-500 hover:text-emerald-400 active:scale-95 bg-zinc-950 rounded-xl transition-all border border-zinc-800"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
      </button>
    </motion.div>
  );
};

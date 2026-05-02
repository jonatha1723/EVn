import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Check, Loader2 } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, imageIndex: number, customImageUrl?: string) => Promise<void>;
}

const PRESET_IMAGES = [
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=200&h=200&fit=crop"
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (name.length > 15) {
      setError("O nome do grupo deve ter no máximo 15 caracteres.");
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await onCreate(name, selectedIndex, customImageUrl);
      onClose();
      setName('');
      setCustomImageUrl('');
    } catch (err: any) {
      setError(err.message || "Erro ao criar grupo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Criar Grupo</h2>
                    <p className="text-xs text-zinc-500">Defina o nome e a imagem do seu grupo</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3 px-1">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">
                      Nome do Grupo
                    </label>
                    <span className={`text-[10px] font-bold ${name.length > 15 ? 'text-red-500' : 'text-zinc-600'}`}>
                      {name.length}/15
                    </span>
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 20))} // Allow slightly more for visual feedback then error
                    placeholder="Ex: Equipe de Elite"
                    maxLength={15}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-900 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-3 px-1">
                    URL da Imagem (Opcional)
                  </label>
                  <input
                    type="url"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="https://link-da-imagem.com/foto.jpg"
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:bg-zinc-900 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-4 px-1">
                    Ou escolha uma predefinida
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {PRESET_IMAGES.map((url, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => { setSelectedIndex(index); setCustomImageUrl(''); }}
                        className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                          selectedIndex === index && !customImageUrl ? 'border-emerald-500 scale-105 shadow-lg shadow-emerald-500/20' : 'border-transparent opacity-50 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt={`Opção ${index + 1}`} className="w-full h-full object-cover" />
                        {selectedIndex === index && !customImageUrl && (
                          <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                            <div className="bg-emerald-500 rounded-full p-1">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold rounded-2xl transition-all shadow-xl shadow-emerald-900/10 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "CRIAR GRUPO AGORA"}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

import React from 'react';
import { UserCircle, Mail, Key, ArrowRight, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginFormProps {
  isRegistering: boolean;
  setIsRegistering: (val: boolean) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  displayName: string;
  setDisplayName: (val: string) => void;
  authError: string;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  isRegistering,
  setIsRegistering,
  email,
  setEmail,
  password,
  setPassword,
  displayName,
  setDisplayName,
  authError,
  onSubmit,
  isSubmitting
}) => {
  const [acceptTerms, setAcceptTerms] = React.useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = React.useState(false);
  const canProceed = !isRegistering || (acceptTerms && acceptPrivacy);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl">
      <form onSubmit={onSubmit} className="space-y-5">
        {isRegistering && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 ml-1">Nome</label>
            <div className="relative">
              <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
              <input
                type="text"
                placeholder="Seu nome"
                maxLength={10}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500 transition-all text-sm"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value.slice(0, 10))}
                required
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400 ml-1">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
            <input
              type="email"
              placeholder="seu@email.com"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500 transition-all text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-400 ml-1">Senha</label>
          <div className="relative">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
            <input
              type="password"
              placeholder="Sua senha"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500 transition-all text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {authError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-xs text-red-400 text-center font-medium">{authError}</p>
          </div>
        )}

        {isRegistering && (
          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-2 text-xs text-zinc-400">
              <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-0.5" />
              <span>Concordo com os <a href="/termos.html" target="_blank" rel="noreferrer" className="text-emerald-400 inline-flex items-center gap-1">Termos de Uso <ExternalLink className="w-3 h-3" /></a>.</span>
            </label>
            <label className="flex items-start gap-2 text-xs text-zinc-400">
              <input type="checkbox" checked={acceptPrivacy} onChange={(e) => setAcceptPrivacy(e.target.checked)} className="mt-0.5" />
              <span>Concordo com a <a href="/privacidade.html" target="_blank" rel="noreferrer" className="text-emerald-400 inline-flex items-center gap-1">Política de Privacidade <ExternalLink className="w-3 h-3" /></a>.</span>
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !canProceed}
          className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
            />
          ) : (
            <>
              <span>{isRegistering ? 'Cadastrar' : 'Entrar'}</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
        <button
          onClick={() => setIsRegistering(!isRegistering)}
          className="text-sm text-zinc-400 hover:text-emerald-500 transition-colors"
        >
          {isRegistering ? (
            <>Já tem uma conta? <span className="font-bold">Entrar</span></>
          ) : (
            <>Não tem uma conta? <span className="font-bold">Criar agora</span></>
          )}
        </button>
      </div>
    </div>
  );
};

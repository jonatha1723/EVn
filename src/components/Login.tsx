import React from 'react';
import { motion } from 'motion/react';
import { LoginBackground } from './auth/LoginBackground';
import { LoginForm } from './auth/LoginForm';

interface LoginProps {
  isRegistering: boolean;
  setIsRegistering: (val: boolean) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  displayName: string;
  setDisplayName: (val: string) => void;
  authError: string;
  authErrorCode: string;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleLogin: () => Promise<void>;
  isSubmitting: boolean;
}

export const Login: React.FC<LoginProps> = (props) => {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-zinc-100 font-sans overflow-hidden relative">
      <LoginBackground />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">
            {props.isRegistering ? 'Criar conta' : 'Entrar'}
          </h1>
          <p className="text-zinc-500 text-sm">
            {props.isRegistering 
              ? 'Preencha os dados para começar.' 
              : 'Bem-vindo de volta!'}
          </p>
        </div>

        <LoginForm {...props} />
      </motion.div>
    </div>
  );
};

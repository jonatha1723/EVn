import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './hooks/useAuth';
import { useChat } from './hooks/useChat';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { InviteModal } from './components/sidebar/InviteModal';
import { InviteToken } from './types';
import { useSettings } from './hooks/useSettings';

export default function App() {
  const { user, loadingAuth, authError, authErrorCode, login, register, logout } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { 
    userData, 
    contacts, 
    activeContact, 
    setActiveContact, 
    messages, 
    sendMessage, 
    sendFile,
    addContact, 
    deleteMessage, 
    clearChatLocally, 
    factoryReset,
    localDeletedMessages,
    messageLimit,
    setMessageLimit,
    isContactTyping,
    setTypingStatus,
    hasKeys,
    privateKey
  } = useChat(user);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado do convite
  const [pendingInvite, setPendingInvite] = useState<InviteToken | null>(null);
  const [inviteError, setInviteError] = useState('');

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Modern browsers require this to show the prompt
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F5 and Ctrl+R (Cmd+R on Mac)
      if (
        e.key === 'F5' || 
        ((e.ctrlKey || e.metaKey) && e.key === 'r')
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Detectar convite na URL
  useEffect(() => {
    const processInvite = async () => {
      const params = new URLSearchParams(window.location.search);
      const inviteId = params.get('invite');

      if (!inviteId) return;

      // Guardar o ID do convite no localStorage para processar após login
      if (!user) {
        localStorage.setItem('pendingInviteId', inviteId);
        // Limpar URL sem recarregar
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      try {
        await loadInvite(inviteId);
      } catch {
        // Erro já tratado dentro de loadInvite
      }

      // Limpar URL sem recarregar
      window.history.replaceState({}, document.title, window.location.pathname);
    };

    processInvite();
  }, [user]);

  // Após o login, verificar se há convite pendente no localStorage
  useEffect(() => {
    if (!user || !userData) return;

    const pendingId = localStorage.getItem('pendingInviteId');
    if (pendingId) {
      localStorage.removeItem('pendingInviteId');
      loadInvite(pendingId);
    }
  }, [user, userData]);

  const loadInvite = async (inviteId: string) => {
    try {
      const tokenDoc = await getDoc(doc(db, 'inviteTokens', inviteId));

      if (!tokenDoc.exists()) {
        setInviteError('Este convite não existe ou já foi removido.');
        return;
      }

      const tokenData = { id: tokenDoc.id, ...tokenDoc.data() } as InviteToken;

      // Verificar se expirou
      if (Date.now() > tokenData.expiresAt) {
        setInviteError('Este convite expirou. Peça um novo link ao remetente.');
        return;
      }

      // Verificar se já foi usado
      if (tokenData.used) {
        setInviteError('Este convite já foi utilizado.');
        return;
      }

      // Verificar se o usuário não está tentando se adicionar
      if (user && tokenData.creatorUid === user.uid) {
        setInviteError('Você não pode usar seu próprio convite.');
        return;
      }

      // Tudo certo, exibir o modal
      setPendingInvite(tokenData);
    } catch (error) {
      setInviteError('Erro ao processar o convite. Tente novamente.');
    }
  };

  const handleAcceptInvite = async () => {
    if (!pendingInvite || !user) return;

    // Adicionar o contato usando o código
    await addContact(pendingInvite.creatorCode);

    // Marcar o token como usado
    await updateDoc(doc(db, 'inviteTokens', pendingInvite.id!), {
      used: true,
      usedBy: user.uid,
    });
  };

  const handleDismissInvite = () => {
    setPendingInvite(null);
    setInviteError('');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (isRegistering) {
      await register(email, password, displayName);
    } else {
      await login(email, password);
    }
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence mode="wait">
      {!user && !loadingAuth ? (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full"
        >
          <Login 
            isRegistering={isRegistering}
            setIsRegistering={setIsRegistering}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            displayName={displayName}
            setDisplayName={setDisplayName}
            authError={authError}
            authErrorCode={authErrorCode}
            onSubmit={handleAuthSubmit}
            isSubmitting={isSubmitting}
          />
        </motion.div>
      ) : user ? (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex h-[100dvh] bg-[var(--bg-app)] text-zinc-100 font-sans overflow-hidden selection:bg-emerald-500/30 w-full md:p-2 lg:p-3 transition-colors duration-300"
        >
          <div className="flex flex-1 h-full w-full max-w-[1920px] mx-auto overflow-hidden bg-[var(--bg-app)] md:rounded-[2rem] md:border border-[var(--border-color)] md:shadow-2xl">
            <Sidebar 
              userData={userData}
              contacts={contacts}
              activeContact={activeContact}
              setActiveContact={setActiveContact}
              onLogout={logout}
              onAddContact={addContact}
              onFactoryReset={factoryReset}
              hasKeys={hasKeys}
              settings={settings}
              onUpdateSettings={updateSettings}
            />
            
            <ChatWindow 
              user={user}
              activeContact={activeContact}
              setActiveContact={setActiveContact}
              messages={messages}
              onSendMessage={sendMessage}
              onSendFile={sendFile}
              onDeleteMessage={deleteMessage}
              onClearChat={() => clearChatLocally(messages.map(m => m.id))}
              localDeletedMessages={localDeletedMessages}
              messageLimit={messageLimit}
              setMessageLimit={setMessageLimit}
              isContactTyping={isContactTyping}
              setTypingStatus={setTypingStatus}
              privateKey={privateKey}
              settings={settings}
            />
          </div>

          {/* Modal de Convite */}
          {pendingInvite && (
            <InviteModal
              invite={pendingInvite}
              onAccept={handleAcceptInvite}
              onDismiss={handleDismissInvite}
            />
          )}

          {/* Erro de Convite (toast) */}
          <AnimatePresence>
            {inviteError && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-red-500/10 border border-red-500/20 backdrop-blur-xl text-red-400 px-6 py-4 rounded-2xl shadow-2xl max-w-sm text-center"
              >
                <p className="text-sm font-medium">{inviteError}</p>
                <button
                  onClick={() => setInviteError('')}
                  className="mt-2 text-xs text-red-500 hover:text-red-400 font-bold uppercase tracking-wider"
                >
                  Fechar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div 
          key="loading"
          className="min-h-screen bg-zinc-950 w-full" 
        />
      )}
    </AnimatePresence>
  );
}

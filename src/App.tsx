import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { arrayUnion, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from './hooks/useAuth';
import { useChat } from './hooks/useChat';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { InviteModal } from './components/sidebar/InviteModal';
import { GroupInviteToken, InviteToken } from './types';
import { useSettings } from './hooks/useSettings';

export default function App() {
  const { user, loadingAuth, authError, authErrorCode, login, register, loginWithGoogle, completeGoogleProfile, logout } = useAuth();
  const { settings, updateSettings } = useSettings();
  const { 
    userData, 
    contacts, 
    activeContact, 
    setActiveContact, 
    activeGroup,
    setActiveGroup,
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
    privateKey,
    updateUserPrivacySettings,
    blockInviteUser,
    unblockInviteUser,
    outgoingFriendRequestCount
  } = useChat(user);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Estado do convite
  const [pendingInvite, setPendingInvite] = useState<InviteToken | null>(null);
  const [pendingGroupInvite, setPendingGroupInvite] = useState<GroupInviteToken | null>(null);
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
      const groupInviteId = params.get('groupInvite');

      if (!inviteId && !groupInviteId) return;

      // Guardar o ID do convite no localStorage para processar após login
      if (!user) {
        if (inviteId) localStorage.setItem('pendingInviteId', inviteId);
        if (groupInviteId) localStorage.setItem('pendingGroupInviteId', groupInviteId);
        // Limpar URL sem recarregar
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      try {
        if (inviteId) await loadInvite(inviteId);
        if (groupInviteId) await loadGroupInvite(groupInviteId);
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
    const pendingGroupId = localStorage.getItem('pendingGroupInviteId');
    if (pendingGroupId) {
      localStorage.removeItem('pendingGroupInviteId');
      loadGroupInvite(pendingGroupId);
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

  const loadGroupInvite = async (inviteId: string) => {
    try {
      const tokenDoc = await getDoc(doc(db, 'groupInviteTokens', inviteId));
      if (!tokenDoc.exists()) {
        setInviteError('Este convite de grupo nao existe ou ja foi removido.');
        return;
      }

      const tokenData = { id: tokenDoc.id, ...tokenDoc.data() } as GroupInviteToken;
      if (Date.now() > tokenData.expiresAt || tokenData.revoked) {
        setInviteError('Este convite de grupo expirou.');
        return;
      }

      setPendingGroupInvite(tokenData);
    } catch {
      setInviteError('Erro ao processar o convite de grupo.');
    }
  };

  const handleAcceptGroupInvite = async () => {
    if (!pendingGroupInvite || !user) return;
    await setDoc(doc(db, 'requests', `${pendingGroupInvite.groupId}_${user.uid}`), {
      id: `${pendingGroupInvite.groupId}_${user.uid}`,
      type: 'group',
      fromUid: user.uid,
      fromName: userData?.displayName || 'Usuario',
      fromCode: userData?.uniqueCode || '',
      toUid: user.uid,
      groupId: pendingGroupInvite.groupId,
      groupName: pendingGroupInvite.groupName,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'groups', pendingGroupInvite.groupId), {
      members: arrayUnion(user.uid),
      [`memberJoinedAt.${user.uid}`]: Date.now(),
    });
    await updateDoc(doc(db, 'requests', `${pendingGroupInvite.groupId}_${user.uid}`), {
      status: 'accepted',
      updatedAt: serverTimestamp(),
    });
    setPendingGroupInvite(null);
  };

  const handleDismissInvite = () => {
    setPendingInvite(null);
    setPendingGroupInvite(null);
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

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    await loginWithGoogle();
    setIsSubmitting(false);
  };

  const needsProfileCompletion = !!user && !loadingAuth && !userData;

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    await completeGoogleProfile(profileName);
    setSavingProfile(false);
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
            onGoogleLogin={handleGoogleLogin}
            isSubmitting={isSubmitting}
          />
        </motion.div>
      ) : needsProfileCompletion ? (
        <motion.div key="profile-completion" className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
          <form onSubmit={handleCompleteProfile} className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 space-y-4">
            <h2 className="text-xl font-bold text-white">Escolha seu nome de usuário</h2>
            <p className="text-xs text-zinc-500">Máximo de 10 caracteres.</p>
            <input
              value={profileName}
              onChange={(e) => setProfileName(e.target.value.slice(0, 10))}
              maxLength={10}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 text-zinc-100"
              placeholder="Seu nome"
            />
            <button disabled={savingProfile} className="w-full bg-emerald-600 hover:bg-emerald-500 rounded-xl py-3 font-bold text-white">
              {savingProfile ? 'Salvando...' : 'Continuar'}
            </button>
          </form>
        </motion.div>
      ) : user ? (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex h-[100dvh] bg-[var(--bg-app)] text-zinc-100 font-sans overflow-hidden selection:bg-emerald-500/30 w-full transition-colors duration-300"
        >
          <div className="flex flex-1 h-full w-full overflow-hidden bg-[var(--bg-app)] border-r border-[var(--border-color)]">
            <Sidebar 
              userData={userData}
              contacts={contacts}
              activeContact={activeContact}
              setActiveContact={setActiveContact}
              activeGroup={activeGroup}
              setActiveGroup={setActiveGroup}
              onLogout={logout}
              onAddContact={addContact}
              onFactoryReset={factoryReset}
              hasKeys={hasKeys}
              settings={settings}
              onUpdateSettings={updateSettings}
              onUpdateUserPrivacySettings={updateUserPrivacySettings}
              onBlockInviteUser={blockInviteUser}
              onUnblockInviteUser={unblockInviteUser}
              outgoingFriendRequestCount={outgoingFriendRequestCount}
            />
            
            <ChatWindow 
              user={user}
              activeContact={activeContact}
              contacts={contacts}
              setActiveContact={setActiveContact}
              activeGroup={activeGroup}
              setActiveGroup={setActiveGroup}
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
              userData={userData}
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

          {pendingGroupInvite && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleDismissInvite} />
              <div className="relative w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-center">
                <p className="text-[10px] text-emerald-400 uppercase tracking-[0.25em] font-bold mb-2">Convite de grupo</p>
                <h2 className="text-xl font-bold text-white mb-2">{pendingGroupInvite.groupName}</h2>
                <p className="text-xs text-zinc-500 mb-6">Ao entrar, voce so vera as mensagens permitidas a partir da sua entrada.</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleDismissInvite} className="py-3 rounded-2xl bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-widest">Cancelar</button>
                  <button onClick={handleAcceptGroupInvite} className="py-3 rounded-2xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-widest">Entrar</button>
                </div>
              </div>
            </div>
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

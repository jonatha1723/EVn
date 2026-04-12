import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './hooks/useAuth';
import { useChat } from './hooks/useChat';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';

export default function App() {
  const { user, loadingAuth, authError, authErrorCode, login, register, logout } = useAuth();
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
          className="flex h-[100dvh] bg-zinc-950 text-zinc-100 font-sans overflow-hidden selection:bg-emerald-500/30 w-full"
        >
          <Sidebar 
            userData={userData}
            contacts={contacts}
            activeContact={activeContact}
            setActiveContact={setActiveContact}
            onLogout={logout}
            onAddContact={addContact}
            onFactoryReset={factoryReset}
            hasKeys={hasKeys}
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
          />
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

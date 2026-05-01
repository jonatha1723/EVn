import { useState, useEffect } from 'react';

export type ChatTheme = 'dark' | 'light' | 'black-spark' | 'white';

interface Settings {
  fontSize: number;
  chatTheme: ChatTheme;
  letterSpacing: number;
}

const DEFAULT_SETTINGS: Settings = {
  fontSize: 15,
  chatTheme: 'dark',
  letterSpacing: 0,
};

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('user_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('user_settings', JSON.stringify(settings));
    
    // Aplicar classes de tema ao elemento raiz se necessário
    document.documentElement.setAttribute('data-chat-theme', settings.chatTheme);
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return { settings, updateSettings };
};

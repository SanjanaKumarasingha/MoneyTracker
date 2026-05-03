import React, { useContext, useEffect, useState } from 'react';

const COLOR_SCHEME_QUERY = '(prefers-color-scheme: dark)';
interface ProviderValue {
  isDarkMode: boolean;
  toggle: () => void;
  enable: () => void;
  disable: () => void;
}

const DarkModeContext = React.createContext<any>({});

export const useDarkMode = () => {
  return useContext<ProviderValue>(DarkModeContext);
};

export const DarkModeProvider = ({ children }: any) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const getMatches = (query: string): boolean => {
    // Prevents SSR issues
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const classToggle = (isDark: boolean) => {
    if (isDark) {
      localStorage.setItem('DarkMode', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      localStorage.setItem('DarkMode', 'light');
      document.documentElement.classList.remove('dark');
    }
    setIsDarkMode(isDark);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia(COLOR_SCHEME_QUERY);
    const handleSystemModeChange = (event: MediaQueryListEvent) => {
      if (!localStorage.getItem('DarkMode')) {
        classToggle(event.matches);
      }
    };

    if (localStorage.getItem('DarkMode')) {
      if (localStorage.getItem('DarkMode') === 'dark') {
        classToggle(true);
      } else if (localStorage.getItem('DarkMode') === 'light') {
        classToggle(false);
      } else {
        classToggle(getMatches(COLOR_SCHEME_QUERY));
      }
    } else {
      classToggle(getMatches(COLOR_SCHEME_QUERY));
    }

    mediaQuery.addEventListener('change', handleSystemModeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleSystemModeChange);
    };
  }, []);

  const handleChange = () => {
    setIsDarkMode((prev) => {
      // true -> open dark mode
      // use ! to change it as current mode first to check
      classToggle(!prev);

      return !prev;
    });
  };

  return (
    <DarkModeContext.Provider
      value={{
        isDarkMode,
        toggle: () => handleChange(),
        enable: () => classToggle(true),
        disable: () => classToggle(false),
      }}
    >
      {children}
    </DarkModeContext.Provider>
  );
};

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
    if (localStorage.getItem('DarkMode')) {
      if (localStorage.getItem('DarkMode') === 'dark') {
        classToggle(true);
      } else if (localStorage.getItem('DarkMode') === 'light') {
        classToggle(false);
      } else {
        classToggle(getMatches(COLOR_SCHEME_QUERY));
      }
    } else {
      const isDarkOS = getMatches(COLOR_SCHEME_QUERY);
      window
        .matchMedia(COLOR_SCHEME_QUERY)
        .addEventListener('change', (event) => classToggle(event.matches));

      classToggle(isDarkOS);
      return () => {
        // Need to remove the eventListener in useEffect if addEventListener is added
        // Otherwise it will have many eventListener
        // setInterval() also
        window
          .matchMedia(COLOR_SCHEME_QUERY)
          .removeEventListener('change', () => {});
      };
    }
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

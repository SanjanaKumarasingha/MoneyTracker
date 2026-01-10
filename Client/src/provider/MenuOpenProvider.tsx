import React, { useContext, useState } from 'react';

interface ProviderValue {
  isSideBarOpen: boolean;
  toggle: () => void;
}

const MenuContext = React.createContext<any>({});

export const useMenu = () => {
  return useContext<ProviderValue>(MenuContext);
};

export const MenuOpenProvider = ({ children }: any) => {
  const [isSideBarOpen, setIsSideBarOpen] = useState<boolean>(false);

  const toggle = () => {
    setIsSideBarOpen((prev) => !prev);
  };

  return (
    <MenuContext.Provider value={{ isSideBarOpen, toggle }}>
      {children}
    </MenuContext.Provider>
  );
};

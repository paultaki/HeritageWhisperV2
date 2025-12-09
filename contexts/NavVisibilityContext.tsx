"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface NavVisibilityContextType {
  isNavHidden: boolean;
  hideNav: () => void;
  showNav: () => void;
}

const NavVisibilityContext = createContext<NavVisibilityContextType | undefined>(undefined);

export function NavVisibilityProvider({ children }: { children: ReactNode }) {
  const [isNavHidden, setIsNavHidden] = useState(false);

  const hideNav = useCallback(() => setIsNavHidden(true), []);
  const showNav = useCallback(() => setIsNavHidden(false), []);

  return (
    <NavVisibilityContext.Provider value={{ isNavHidden, hideNav, showNav }}>
      {children}
    </NavVisibilityContext.Provider>
  );
}

export function useNavVisibility() {
  const context = useContext(NavVisibilityContext);
  if (!context) {
    throw new Error("useNavVisibility must be used within NavVisibilityProvider");
  }
  return context;
}

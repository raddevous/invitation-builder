"use client";

import { createContext, useContext, ReactNode } from "react";

interface ThemeContextType {
  isDarkMode: boolean;
  accentColor: string;
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: true,
  accentColor: "#2563EB",
});

export function ThemeProvider({ 
  children, 
  isDarkMode = true, 
  accentColor = "#2563EB" 
}: { 
  children: ReactNode; 
  isDarkMode?: boolean; 
  accentColor?: string; 
}) {
  return (
    <ThemeContext.Provider value={{ isDarkMode, accentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

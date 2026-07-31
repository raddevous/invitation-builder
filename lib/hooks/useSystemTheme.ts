import { useState, useEffect } from "react";
import { getStoredItem, setStoredItem, removeStoredItem } from "@/lib/utils/storage";

export type ThemeMode = "light" | "dark";

export interface ThemeColors {
  bg: string;
  cardBg: string;
  leftPanelBg: string;
  rightPanelBg: string;
  rightPanelGradient: string;
  accent: string;
  accentGradient: string;
  accentGradientEnd: string;
  brandColor: string;
  headingColor: string;
  subtitleColor: string;
  inputBg: string;
  inputText: string;
  inputBorder: string;
  inputShadow: string;
  inputFocusShadow: string;
  loginBtnShadow: string;
  dividerBorder: string;
  dividerBg: string;
  footerColor: string;
  footerOpacity: number;
  hoverBg: string;
  cardShadow: string;
  featureTextColor: string;
}

export const lightTheme: ThemeColors = {
  bg: "#e9e4de",
  cardBg: "white",
  leftPanelBg: "#fff8f3",
  rightPanelBg: "#ffffff",
  rightPanelGradient: "linear-gradient(180deg, #ffffff 0%, #f8faff 100%)",
  accent: "#6998EE",
  accentGradient: "linear-gradient(135deg, #6998EE 0%, #5a87d6 100%)",
  accentGradientEnd: "#5a87d6",
  brandColor: "#6998EE",
  headingColor: "#6998EE",
  subtitleColor: "#6998EE",
  inputBg: "white",
  inputText: "#5c4a3a",
  inputBorder: "#6998EE",
  inputShadow: "0 1px 3px rgba(105,152,238,0.08)",
  inputFocusShadow: "0 0 0 3px rgba(105,152,238,0.15)",
  loginBtnShadow: "0 2px 8px rgba(105,152,238,0.2)",
  dividerBorder: "#6998EE",
  dividerBg: "linear-gradient(180deg, #ffffff 0%, #f8faff 100%)",
  footerColor: "#6998EE",
  footerOpacity: 0.4,
  hoverBg: "rgba(105,152,238,0.06)",
  cardShadow: "",
  featureTextColor: "#1B3B5F",
};

export const darkTheme: ThemeColors = {
  bg: "#0f0f1a",
  cardBg: "#1a1a2e",
  leftPanelBg: "#161624",
  rightPanelBg: "#1a1a2e",
  rightPanelGradient: "linear-gradient(180deg, #1a1a2e 0%, #20203a 100%)",
  accent: "#7ba8f5",
  accentGradient: "linear-gradient(135deg, #7ba8f5 0%, #6998EE 100%)",
  accentGradientEnd: "#6998EE",
  brandColor: "#7ba8f5",
  headingColor: "#7ba8f5",
  subtitleColor: "#7ba8f5",
  inputBg: "#252538",
  inputText: "#e0e0ec",
  inputBorder: "#7ba8f5",
  inputShadow: "0 1px 3px rgba(123,168,245,0.1)",
  inputFocusShadow: "0 0 0 3px rgba(123,168,245,0.2)",
  loginBtnShadow: "0 2px 8px rgba(123,168,245,0.25)",
  dividerBorder: "#7ba8f5",
  dividerBg: "linear-gradient(180deg, #1a1a2e 0%, #20203a 100%)",
  footerColor: "#7ba8f5",
  footerOpacity: 0.5,
  hoverBg: "rgba(123,168,245,0.1)",
  cardShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
  featureTextColor: "#7BA8F5",
};

export function getThemeColors(mode: ThemeMode): ThemeColors {
  return mode === "dark" ? darkTheme : lightTheme;
}

const THEME_OVERRIDE_KEY = "themeOverride";

export function useSystemTheme(): { mode: ThemeMode; colors: ThemeColors; setMode: (mode: ThemeMode) => void; toggle: () => void } {
  const [mode, setModeState] = useState<ThemeMode>("light");

  useEffect(() => {
    let mounted = true;

    (async () => {
      // Check for manual override first
      const override = await getStoredItem(THEME_OVERRIDE_KEY);
      if (mounted && (override === "light" || override === "dark")) {
        setModeState(override);
        return;
      }

      // Fall back to system theme
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      if (mounted) setModeState(mq.matches ? "dark" : "light");

      const handler = async (e: MediaQueryListEvent) => {
        // Only follow system if no manual override
        const ov = await getStoredItem(THEME_OVERRIDE_KEY);
        if (ov) return;
        if (mounted) setModeState(e.matches ? "dark" : "light");
      };

      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    })();

    return () => { mounted = false; };
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setStoredItem(THEME_OVERRIDE_KEY, newMode);
    setModeState(newMode);
  };

  const toggle = () => {
    setMode(mode === "dark" ? "light" : "dark");
  };

  return { mode, colors: mode === "dark" ? darkTheme : lightTheme, setMode, toggle };
}

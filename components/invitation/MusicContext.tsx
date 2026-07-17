"use client";

import { createContext, useContext, useRef, useState, useCallback, type ReactNode } from "react";

interface MusicContextValue {
  isPlaying: boolean;
  toggle: () => void;
  registerAudio: (audio: HTMLAudioElement | null) => void;
}

const MusicContext = createContext<MusicContextValue | null>(null);

export function MusicProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = useCallback(() => setIsPlaying(true), []);
  const handlePause = useCallback(() => setIsPlaying(false), []);

  const registerAudio = useCallback((audio: HTMLAudioElement | null) => {
    const current = audioRef.current;
    if (current && current !== audio) {
      current.removeEventListener("play", handlePlay);
      current.removeEventListener("pause", handlePause);
    }
    if (audio) {
      audioRef.current = audio;
      audio.addEventListener("play", handlePlay);
      audio.addEventListener("pause", handlePause);
      setIsPlaying(!audio.paused);
    } else {
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, [handlePlay, handlePause]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, []);

  return (
    <MusicContext.Provider value={{ isPlaying, toggle, registerAudio }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used within MusicProvider");
  return ctx;
}

// Helper function to convert Google Drive share URL to direct download URL
export const convertGoogleDriveUrl = (url: string): string => {
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}&alt=media`;
  }
  return url;
};

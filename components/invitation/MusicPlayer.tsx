"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { InvitationData } from "@/lib/types/invitation";
import { useMusic, convertGoogleDriveUrl } from "./MusicContext";

interface MusicPlayerProps {
  data: InvitationData;
  autoPlay?: boolean;
}

export default function MusicPlayer({ data, autoPlay = false }: MusicPlayerProps) {
  const { isPlaying, registerAudio } = useMusic();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [trackUrls, setTrackUrls] = useState<string[]>([]);
  const autoPlayedRef = useRef(false);
  const wasPlayingRef = useRef(false);

  useEffect(() => {
    async function resolveTracks() {
      const musicList = data.backgroundMusic || [];
      if (musicList.length === 0) {
        // Fallback to old musicTrack if backgroundMusic is empty
        if (data.musicEnabled && data.musicTrack) {
          try {
            const res = await fetch("/stock/music/assets.json");
            const assets = await res.json();
            const found = assets.find((a: { id: string; url: string }) => a.id === data.musicTrack);
            if (found?.url) {
              setTrackUrls([found.url]);
            }
          } catch {
            // no music available
          }
        }
        return;
      }

      // Convert Google Drive URLs to direct download URLs
      const convertedUrls = musicList
        .filter(url => url && url.trim() !== "")
        .map(convertGoogleDriveUrl);
      
      setTrackUrls(convertedUrls);
    }
    resolveTracks();
  }, [data.backgroundMusic, data.musicEnabled, data.musicTrack]);

  // Register the audio element with the shared MusicContext via callback ref
  const audioCallbackRef = useCallback((audio: HTMLAudioElement | null) => {
    audioRef.current = audio;
    registerAudio(audio);
  }, [registerAudio]);

  useEffect(() => {
    if (!audioRef.current || trackUrls.length === 0) return;

    const currentUrl = trackUrls[currentTrackIndex];
    if (!currentUrl) return;

    audioRef.current.volume = data.musicVolume ?? 0.5;

    // Only set src if it's different
    if (audioRef.current.src !== currentUrl) {
      audioRef.current.src = currentUrl;
      audioRef.current.load();
    }

    // Resume playback when the track changes while music was already playing
    if (wasPlayingRef.current && isPlaying) {
      audioRef.current.play().catch(() => {});
    } else if (autoPlay && data.musicEnabled && !autoPlayedRef.current) {
      // Attempt a one-shot auto-play when the invitation is opened
      autoPlayedRef.current = true;
      setTimeout(() => {
        audioRef.current?.play().catch((err) => {
          console.log("Auto-play prevented by browser:", err);
        });
      }, 100);
    }

    wasPlayingRef.current = isPlaying;
  }, [trackUrls, currentTrackIndex, autoPlay, data.musicEnabled, data.musicVolume, isPlaying]);

  const handleTrackEnd = () => {
    if (trackUrls.length <= 1) return;

    // Move to next track, or loop back to first
    const nextIndex = (currentTrackIndex + 1) % trackUrls.length;
    setCurrentTrackIndex(nextIndex);
  };

  if (!data.musicEnabled || trackUrls.length === 0) return null;

  return (
    <audio
      ref={audioCallbackRef}
      onEnded={handleTrackEnd}
      preload="auto"
      loop={trackUrls.length === 1}
    />
  );
}

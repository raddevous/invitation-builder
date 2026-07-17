"use client";

import { useEffect, useRef, useState } from "react";
import type { InvitationData } from "@/lib/types/invitation";

interface MusicPlayerProps {
  data: InvitationData;
  autoPlay?: boolean;
}

// Helper function to convert Google Drive share URL to direct download URL
const convertGoogleDriveUrl = (url: string): string => {
  // Match Google Drive file URLs
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    // Use the direct link format that's more compatible with audio players
    return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}&alt=media`;
  }
  return url;
};

export default function MusicPlayer({ data, autoPlay = false }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [trackUrls, setTrackUrls] = useState<string[]>([]);

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
    
    // Attempt to play when autoPlay is enabled
    if (autoPlay && data.musicEnabled) {
      // Small delay to ensure audio is ready
      setTimeout(() => {
        if (audioRef.current && !playing) {
          audioRef.current.play().then(() => setPlaying(true)).catch((err) => {
            console.log("Auto-play prevented by browser:", err);
          });
        }
      }, 100);
    }
  }, [trackUrls, currentTrackIndex, autoPlay, data.musicEnabled, data.musicVolume, playing]);

  const handleTrackEnd = () => {
    if (trackUrls.length === 0) return;
    
    // Move to next track, or loop back to first
    const nextIndex = (currentTrackIndex + 1) % trackUrls.length;
    setCurrentTrackIndex(nextIndex);
  };

  const toggle = () => {
    if (!audioRef.current || trackUrls.length === 0) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  };

  if (!data.musicEnabled || trackUrls.length === 0) return null;

  return (
    <audio 
      ref={audioRef} 
      onEnded={handleTrackEnd}
      preload="auto"
      loop={trackUrls.length === 1}
    />
  );
}

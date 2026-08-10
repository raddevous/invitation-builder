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
  // Shuffle state — track played indices to avoid repeats until all played
  const shuffleOrderRef = useRef<number[]>([]);
  const shufflePosRef = useRef(0);

  const shuffle = data.musicShuffle ?? false;
  const repeat = data.musicRepeat ?? true;

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
      // Reset shuffle state when tracks change
      shuffleOrderRef.current = [];
      shufflePosRef.current = 0;
      setCurrentTrackIndex(0);
    }
    resolveTracks();
  }, [data.backgroundMusic, data.musicEnabled, data.musicTrack]);

  // Build a fresh shuffle order
  const buildShuffleOrder = useCallback(() => {
    const indices = Array.from({ length: trackUrls.length }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    shuffleOrderRef.current = indices;
    shufflePosRef.current = 0;
  }, [trackUrls.length]);

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
    // Skip if audio is already playing (handleTrackEnd handles next-track playback directly)
    if (wasPlayingRef.current && isPlaying && audioRef.current.paused) {
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
    if (trackUrls.length === 0) return;

    // Single track: loop if repeat, otherwise stop
    if (trackUrls.length === 1) {
      if (repeat && audioRef.current) {
        audioRef.current.src = trackUrls[0];
        audioRef.current.load();
        audioRef.current.play().catch(() => {});
      }
      return;
    }

    let nextIndex: number;

    if (shuffle) {
      // Build shuffle order if empty or exhausted
      if (shuffleOrderRef.current.length === 0 || shufflePosRef.current >= shuffleOrderRef.current.length) {
        buildShuffleOrder();
      }
      nextIndex = shuffleOrderRef.current[shufflePosRef.current];
      shufflePosRef.current++;

      // If we've played all tracks and repeat is off, stop
      if (shufflePosRef.current >= shuffleOrderRef.current.length && !repeat) {
        return; // Don't play next — playlist is done
      }
    } else {
      // Sequential order
      nextIndex = currentTrackIndex + 1;
      if (nextIndex >= trackUrls.length) {
        if (!repeat) return; // Playlist is done
        nextIndex = 0; // Loop back to first
      }
    }

    setCurrentTrackIndex(nextIndex);

    // Play next track directly — don't rely on useEffect which checks isPlaying,
    // because some browsers fire 'pause' when audio ends, setting isPlaying to false
    if (audioRef.current && trackUrls[nextIndex]) {
      audioRef.current.src = trackUrls[nextIndex];
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
  };

  if (!data.musicEnabled || trackUrls.length === 0) return null;

  return (
    <audio
      ref={audioCallbackRef}
      onEnded={handleTrackEnd}
      preload="auto"
      loop={trackUrls.length === 1 && repeat}
    />
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSystemTheme } from "@/lib/hooks/useSystemTheme";

interface Props {
  messages: string[];
  index: number;
  onCycle: () => void;
  fading: boolean;
}

export default function FeatureText({ messages, index, onCycle, fading }: Props) {
  const { colors: t } = useSystemTheme();
  const [internalIndex, setInternalIndex] = useState(index);
  const [internalFading, setInternalFading] = useState(false);

  useEffect(() => {
    setInternalIndex(index);
  }, [index]);

  useEffect(() => {
    if (messages.length <= 1) return;
    const interval = setInterval(() => {
      setInternalFading(true);
      setTimeout(() => {
        setInternalIndex((prev) => (prev + 1) % messages.length);
        setInternalFading(false);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, [messages.length]);

  const displayFading = fading || internalFading;
  const displayIndex = internalIndex;

  return (
    <div className="text-center" style={{ minHeight: "14px" }}>
      <p
        key={`feature-msg-${displayIndex}`}
        className="text-[10px] tracking-[0.2em] uppercase text-center"
        style={{
          color: t.featureTextColor,
          fontFamily: "Inter, sans-serif",
          opacity: displayFading ? 0 : 0.6,
          transition: "opacity 400ms ease",
        }}
      >
        {messages[displayIndex] || "Tap to explore designs"}
      </p>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import type { InvitationData } from "@/lib/types/invitation";
import { getElement, getScreenDef } from "@/lib/welcome-screens";

interface Props {
  data: InvitationData;
  onOpen: () => void;
}

const PETAL_COUNT = 8;
const PETAL_EMOJIS = ["🌸", "🌺", "🌼", "🌷", "💐", "🌹", "🌻", "🏵️"];

function petalPos(i: number, radius: number) {
  const angle = (i / PETAL_COUNT) * Math.PI * 2 - Math.PI / 2;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

export default function Bloom({ data, onOpen }: Props) {
  const [blooming, setBlooming] = useState(false);
  const displayName = data.nameType === "couple" 
    ? `${data.hisName || ""} ${data.andText || "&"} ${data.herName || ""}`.trim()
    : data.coupleName;

  const def = getScreenDef("bloom");
  const subtitleEl = def.elements.find((e) => e.id === "subtitle")!;
  const subtitleSettings = getElement("bloom", "subtitle", data.welcomeElements, subtitleEl);

  const handleTap = useCallback(() => {
    if (blooming) return;
    setBlooming(true);
    setTimeout(() => onOpen(), 1100);
  }, [blooming, onOpen]);

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden"
      style={{ backgroundColor: data.mainColor1 }}
      onClick={handleTap}
    >
      {/* Outer ring of flowers — they bloom outward */}
      <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
        {Array.from({ length: PETAL_COUNT }).map((_, i) => {
          const pos = petalPos(i, 110);
          const bloomPos = petalPos(i, 220);
          return (
            <div
              key={i}
              className="absolute text-2xl transition-all pointer-events-none"
              style={{
                transitionDuration: `${0.5 + i * 0.05}s`,
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                transform: blooming
                  ? `translate(${bloomPos.x}px, ${bloomPos.y}px) scale(0) rotate(${360 + i * 20}deg)`
                  : `translate(${pos.x}px, ${pos.y}px) scale(1) rotate(${i * 45}deg)`,
                opacity: blooming ? 0 : 1,
                left: "50%",
                top: "50%",
                marginLeft: "-0.75rem",
                marginTop: "-0.75rem",
              }}
            >
              {PETAL_EMOJIS[i % PETAL_EMOJIS.length]}
            </div>
          );
        })}

        {/* Inner ring — smaller flowers */}
        {Array.from({ length: 6 }).map((_, i) => {
          const pos = petalPos(i, 55);
          const bloomPos = petalPos(i, 150);
          return (
            <div
              key={`inner-${i}`}
              className="absolute text-base transition-all pointer-events-none"
              style={{
                transitionDuration: `${0.4 + i * 0.04}s`,
                transitionDelay: blooming ? "0.1s" : "0s",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                transform: blooming
                  ? `translate(${bloomPos.x}px, ${bloomPos.y}px) scale(0)`
                  : `translate(${pos.x}px, ${pos.y}px) scale(1) rotate(${i * 60}deg)`,
                opacity: blooming ? 0 : 0.7,
                left: "50%",
                top: "50%",
                marginLeft: "-0.5rem",
                marginTop: "-0.5rem",
              }}
            >
              🌸
            </div>
          );
        })}

        {/* Center content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 transition-all duration-500"
          style={{ opacity: blooming ? 0 : 1, transform: blooming ? "scale(1.1)" : "scale(1)" }}
        >
          <p
            className="text-xs tracking-[0.4em] uppercase mb-3"
            style={{ color: data.neutralColor2, fontFamily: `${data.bodyFont}, serif`, opacity: 0.65 }}
          >
            You are invited
          </p>
          <h1
            className="leading-tight"
            style={{ fontSize: "1.9rem", color: data.mainColor2, fontFamily: `${data.headingFont}, serif` }}
          >
            {displayName}
          </h1>
          <p className="mt-2 italic text-sm opacity-70" style={{ color: data.neutralColor1, fontFamily: `${data.bodyFont}, serif` }}>
            {data.subtitle}
          </p>
        </div>
      </div>

      {/* Tap prompt */}
      {subtitleSettings.visible && (
        <div
          className="mt-10 flex flex-col items-center gap-2 transition-opacity duration-300"
          style={{ color: data.neutralColor2, opacity: blooming ? 0 : 0.55 }}
        >
          <p className="text-sm tracking-[0.25em] uppercase" style={{ fontFamily: `${data.bodyFont}, serif` }}>
            {subtitleSettings.text}
          </p>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      )}

      {/* Background floating petals */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={`bg-${i}`}
          className="petal absolute text-xs pointer-events-none opacity-30"
          style={{ left: `${10 + i * 15}%`, animationDelay: `${i * 1.2}s`, animationDuration: `${6 + i}s` }}
        >🌸</div>
      ))}
    </div>
  );
}

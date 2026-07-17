"use client";

import { useState, useEffect, useCallback } from "react";
import type { InvitationData } from "@/lib/types/invitation";
import { getElement, getScreenDef } from "@/lib/welcome-screens";

interface Props {
  data: InvitationData;
  onOpen: () => void;
}

export default function ClassicEnvelope({ data, onOpen }: Props) {
  const [flapOpen, setFlapOpen] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [petals, setPetals] = useState<{ id: number; x: number; delay: number; duration: number }[]>([]);
  const [butterflies, setButterflies] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);
  const displayName = data.nameType === "couple" 
    ? `${data.hisName || ""} ${data.andText || "&"} ${data.herName || ""}`.trim()
    : data.coupleName;

  const def = getScreenDef("classic-envelope");
  const tapEl = def.elements.find((e) => e.id === "tapText")!;
  const tapSettings = getElement("classic-envelope", "tapText", data.welcomeElements, tapEl);

  useEffect(() => {
    setPetals(Array.from({ length: 10 }, (_, i) => ({
      id: i, x: Math.random() * 100, delay: Math.random() * 6, duration: 5 + Math.random() * 4,
    })));
    setButterflies(Array.from({ length: 3 }, (_, i) => ({
      id: i, x: 15 + i * 30, y: 20 + Math.random() * 40, delay: i * 2,
    })));
  }, []);

  const handleTap = useCallback(() => {
    if (flapOpen) return;
    setFlapOpen(true);
    setTimeout(() => setExiting(true), 700);
    setTimeout(() => onOpen(), 1400);
  }, [flapOpen, onOpen]);

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden"
      style={{ backgroundColor: data.mainColor1 }}
      onClick={handleTap}
    >
      {/* Falling petals */}
      {petals.map((p) => (
        <div
          key={p.id}
          className="petal absolute text-sm pointer-events-none"
          style={{ left: `${p.x}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }}
        >🌸</div>
      ))}

      {/* Butterflies */}
      {butterflies.map((b) => (
        <div
          key={b.id}
          className="absolute text-lg pointer-events-none animate-butterfly"
          style={{ left: `${b.x}%`, top: `${b.y}%`, animationDelay: `${b.delay}s`, animationDuration: `${4 + b.id}s` }}
        >🦋</div>
      ))}

      {/* Envelope + content */}
      <div
        className="flex flex-col items-center"
        style={{
          opacity: exiting ? 0 : 1,
          transition: "opacity 0.6s ease",
        }}
      >
        {/* 3D Envelope */}
        <div
          className="relative mb-8"
          style={{ width: 220, height: 160, animation: flapOpen ? "none" : "float 3s ease-in-out infinite" }}
        >
          {/* Body */}
          <div
            className="absolute inset-0 rounded-lg shadow-xl"
            style={{ backgroundColor: "white", border: `1.5px solid ${data.accentColor}` }}
          />

          {/* Bottom-left triangle */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 220 160" style={{ overflow: "visible" }}>
            <path d="M0 55 L0 155 L110 100 Z" fill={data.accentColor} opacity="0.5" />
            <path d="M220 55 L220 155 L110 100 Z" fill={data.accentColor} opacity="0.4" />
            <line x1="30" y1="128" x2="190" y2="128" stroke={data.accentColor} strokeWidth="0.6" strokeDasharray="4 4" />
            <line x1="30" y1="140" x2="190" y2="140" stroke={data.accentColor} strokeWidth="0.6" strokeDasharray="4 4" />
          </svg>

          {/* Wax seal */}
          <div
            className="absolute flex items-center justify-center rounded-full shadow"
            style={{
              width: 38, height: 38,
              backgroundColor: data.mainColor2,
              top: "55%", left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 2,
            }}
          >
            <span className="text-white text-base">♥</span>
          </div>

          {/* Flap — animates with 3D rotateX */}
          <div
            className="absolute top-0 left-0 right-0 overflow-hidden"
            style={{
              height: 70,
              transformOrigin: "top center",
              perspective: "500px",
              transition: "transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: flapOpen ? "perspective(500px) rotateX(-185deg)" : "perspective(500px) rotateX(0deg)",
              zIndex: 3,
            }}
          >
            <svg width="220" height="70" viewBox="0 0 220 70" style={{ display: "block" }}>
              <polygon points="0,0 220,0 110,65" fill={data.accentColor} />
              <polygon points="0,0 220,0 110,65" fill="white" opacity="0.25" />
            </svg>
          </div>
        </div>

        {/* Names */}
        <div className="text-center mb-4">
          <p className="text-xs tracking-[0.35em] uppercase mb-2" style={{ color: data.neutralColor2, fontFamily: `${data.bodyFont}, serif` }}>
            You are invited to
          </p>
          <h1 className="text-4xl leading-tight" style={{ color: data.mainColor2, fontFamily: `${data.headingFont}, serif` }}>
            {displayName}
          </h1>
          <p className="mt-2 italic opacity-70" style={{ color: data.neutralColor1, fontFamily: `${data.bodyFont}, serif` }}>
            {data.subtitle}
          </p>
        </div>

        {/* Decoration */}
        <div className="mb-4">
          <svg width="56" height="20" viewBox="0 0 56 20" fill="none">
            <ellipse cx="28" cy="10" rx="7" ry="4" fill={data.accentColor} opacity="0.7" />
            <ellipse cx="14" cy="9" rx="5" ry="3" fill={data.accentColor} opacity="0.5" />
            <ellipse cx="42" cy="9" rx="5" ry="3" fill={data.accentColor} opacity="0.5" />
            <ellipse cx="5" cy="12" rx="4" ry="2.5" fill={data.accentColor} opacity="0.3" />
            <ellipse cx="51" cy="12" rx="4" ry="2.5" fill={data.accentColor} opacity="0.3" />
          </svg>
        </div>

        {/* Tap prompt */}
        {tapSettings.visible && (
          <div className="flex flex-col items-center gap-2 opacity-60" style={{ color: data.neutralColor2 }}>
            <div className="w-px h-6" style={{ backgroundColor: data.neutralColor2, opacity: 0.4 }} />
            <p
              className="text-sm tracking-[0.2em] uppercase"
              style={{
                fontFamily: `${data.bodyFont}, serif`,
                transform: `scale(${tapSettings.scale}) rotate(${tapSettings.rotation}deg)`,
              }}
            >
              {tapSettings.text}
            </p>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

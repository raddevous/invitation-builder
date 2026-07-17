"use client";

import { useState, useEffect, useCallback } from "react";
import type { InvitationData } from "@/lib/types/invitation";
import EditableZone from "../EditableZone";
import { getFontFamily } from "@/lib/utils/fonts";

interface WelcomeScreenProps {
  data: InvitationData;
  onOpen: () => void;
}

export default function WelcomeScreen({ data, onOpen }: WelcomeScreenProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [petals, setPetals] = useState<{ id: number; x: number; delay: number; duration: number; size: number }[]>([]);
  const displayName = data.nameType === "couple" 
    ? `${data.hisName || ""} ${data.andText || "&"} ${data.herName || ""}`.trim()
    : data.coupleName;

  useEffect(() => {
    const p = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 6,
      duration: 5 + Math.random() * 4,
      size: 8 + Math.random() * 10,
    }));
    setPetals(p);
  }, []);

  const handleOpen = useCallback(() => {
    if (isOpening) return;
    setIsOpening(true);
    setTimeout(() => {
      onOpen();
    }, 900);
  }, [isOpening, onOpen]);

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-center justify-center cursor-pointer select-none"
      style={{ backgroundColor: data.mainColor1 }}
      onClick={handleOpen}
    >
      {/* Floating petals */}
      {petals.map((p) => (
        <div
          key={p.id}
          className="petal"
          style={{
            left: `${p.x}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            fontSize: `${p.size}px`,
          }}
        >
          🌸
        </div>
      ))}

      {/* Envelope */}
      <div
        className={`flex flex-col items-center transition-all duration-700 ${isOpening ? "scale-110 opacity-0 -translate-y-16" : "scale-100 opacity-100 translate-y-0"}`}
      >
        {/* SVG Envelope */}
        <EditableZone field="welcomeEnvelope" category="envelopes" label="Envelope Style" className="relative mb-8" style={{ animation: isOpening ? "none" : "float 3s ease-in-out infinite" }}>
          {data.welcomeEnvelope && data.welcomeEnvelope !== "envelope-default" ? (
            <img src={data.welcomeEnvelope} alt="Envelope" className="w-[200px] h-[150px] object-contain" />
          ) : (
            <EnvelopeSVG color={data.mainColor2} accentColor={data.accentColor} />
          )}
        </EditableZone>

        {/* Couple name on envelope */}
        <div className="text-center mb-6">
          <p
            className="text-sm tracking-[0.3em] uppercase mb-2"
            style={{ color: data.mainColor2, fontFamily: getFontFamily(data.bodyFont, "body") }}
          >
            You are invited to
          </p>
          <h1
            className="text-4xl leading-tight"
            style={{ color: data.mainColor2, fontFamily: getFontFamily(data.headingFont, "heading") }}
          >
            {displayName}
          </h1>
          <p
            className="mt-2 text-lg italic"
            style={{ color: data.mainColor2, fontFamily: getFontFamily(data.bodyFont, "body"), opacity: 0.75 }}
          >
            {data.subtitle}
          </p>
        </div>

        {/* Flower decoration */}
        <EditableZone field="flowerDecoration" category="flowers" label="Flower Decoration" className="mb-3">
          {data.flowerDecoration && data.flowerDecoration !== "flower-default" ? (
            <img src={data.flowerDecoration} alt="Decoration" className="w-16 h-16 object-contain" />
          ) : (
            <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
              <ellipse cx="24" cy="12" rx="6" ry="4" fill={data.accentColor} opacity="0.6" />
              <ellipse cx="12" cy="10" rx="5" ry="3" fill={data.accentColor} opacity="0.4" />
              <ellipse cx="36" cy="10" rx="5" ry="3" fill={data.accentColor} opacity="0.4" />
              <ellipse cx="6" cy="14" rx="4" ry="2.5" fill={data.accentColor} opacity="0.3" />
              <ellipse cx="42" cy="14" rx="4" ry="2.5" fill={data.accentColor} opacity="0.3" />
            </svg>
          )}
        </EditableZone>

        {/* Tap prompt */}
        <div
          className="flex flex-col items-center gap-2"
          style={{ color: data.mainColor2, opacity: 0.6 }}
        >
          <div
            className="w-px h-8"
            style={{ backgroundColor: data.mainColor2, opacity: 0.4 }}
          />
          <p
            className="text-sm tracking-[0.2em] uppercase"
            style={{ fontFamily: `${data.bodyFont}, serif` }}
          >
            Tap to open
          </p>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function EnvelopeSVG({ color, accentColor }: { color: string; accentColor: string }) {
  return (
    <svg
      width="200"
      height="150"
      viewBox="0 0 200 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.12))" }}
    >
      {/* Envelope body */}
      <rect x="10" y="40" width="180" height="110" rx="4" fill="white" stroke={accentColor} strokeWidth="1.5" />
      
      {/* Envelope flap (closed) */}
      <path d="M10 40 L100 90 L190 40 Z" fill={accentColor} stroke={accentColor} strokeWidth="1.5" strokeLinejoin="round" />
      
      {/* Bottom triangle left */}
      <path d="M10 40 L10 150 L100 95 Z" fill="#f5e8e0" stroke={accentColor} strokeWidth="0.5" />
      {/* Bottom triangle right */}
      <path d="M190 40 L190 150 L100 95 Z" fill="#edddd4" stroke={accentColor} strokeWidth="0.5" />

      {/* Wax seal */}
      <circle cx="100" cy="90" r="18" fill={color} opacity="0.9" />
      <text
        x="100"
        y="95"
        textAnchor="middle"
        fill="white"
        fontSize="12"
        fontFamily="serif"
        fontStyle="italic"
      >
        ♥
      </text>

      {/* Decorative lines on envelope */}
      <line x1="35" y1="120" x2="165" y2="120" stroke={accentColor} strokeWidth="0.5" strokeDasharray="3 3" />
      <line x1="35" y1="130" x2="165" y2="130" stroke={accentColor} strokeWidth="0.5" strokeDasharray="3 3" />
    </svg>
  );
}

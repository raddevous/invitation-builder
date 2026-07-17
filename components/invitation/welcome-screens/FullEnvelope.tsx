"use client";

import { useState, useCallback } from "react";
import type { InvitationData } from "@/lib/types/invitation";
import { getElement, getScreenDef } from "@/lib/welcome-screens";

interface Props {
  data: InvitationData;
  onOpen: () => void;
}

export default function FullEnvelope({ data, onOpen }: Props) {
  const [flapOpen, setFlapOpen] = useState(false);
  const [sliding, setSliding] = useState(false);
  const displayName = data.nameType === "couple" 
    ? `${data.hisName || ""} ${data.andText || "&"} ${data.herName || ""}`.trim()
    : data.coupleName;

  const def = getScreenDef("full-envelope");
  const tapEl = def.elements.find((e) => e.id === "tapText")!;
  const tapSettings = getElement("full-envelope", "tapText", data.welcomeElements, tapEl);

  const handleTap = useCallback(() => {
    if (flapOpen) return;
    setFlapOpen(true);
    setTimeout(() => setSliding(true), 800);
    setTimeout(() => onOpen(), 1700);
  }, [flapOpen, onOpen]);

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col items-end justify-center cursor-pointer select-none overflow-hidden"
      style={{ backgroundColor: data.mainColor1 }}
      onClick={handleTap}
    >
      {/* Envelope container — fades out to reveal */}
      <div
        className="w-full"
        style={{
          opacity: sliding ? 0 : 1,
          transition: "opacity 0.7s ease",
          height: "100vh",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Envelope body */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: "white" }}
        />

        {/* Envelope side triangles */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 45 L0 100 L50 70 Z" fill={data.accentColor} opacity="0.35" />
          <path d="M100 45 L100 100 L50 70 Z" fill={data.accentColor} opacity="0.25" />
        </svg>

        {/* Decorative lines */}
        <div className="absolute bottom-20 left-0 right-0 flex flex-col items-center gap-3 opacity-20">
          <div className="w-4/5 h-px" style={{ backgroundColor: data.mainColor2 }} />
          <div className="w-3/5 h-px" style={{ backgroundColor: data.mainColor2 }} />
        </div>

        {/* Center content on envelope */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-10">
          {/* Wax seal */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg mb-2"
            style={{ backgroundColor: data.mainColor2 }}
          >
            <span className="text-white text-2xl">♥</span>
          </div>

          <p className="text-xs tracking-[0.4em] uppercase" style={{ color: data.neutralColor2, fontFamily: `${data.bodyFont}, serif`, opacity: 0.6 }}>
            Together with their families
          </p>
          <h1
            className="text-center leading-tight"
            style={{ fontSize: "2.4rem", color: data.mainColor2, fontFamily: `${data.headingFont}, serif` }}
          >
            {displayName}
          </h1>
          <p className="text-center italic opacity-70" style={{ color: data.neutralColor1, fontFamily: `${data.bodyFont}, serif` }}>
            {data.subtitle}
          </p>
          <p className="text-sm tracking-[0.2em]" style={{ color: data.neutralColor1, fontFamily: `${data.bodyFont}, serif`, opacity: 0.5 }}>
            {data.date}
          </p>
        </div>

        {/* FLAP — top of envelope, hinged at top */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: "45%",
            transformOrigin: "top center",
            transition: "transform 0.75s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: flapOpen ? "perspective(800px) rotateX(-185deg)" : "perspective(800px) rotateX(0deg)",
            zIndex: 5,
          }}
        >
          {/* Main flap surface */}
          <div className="absolute inset-0" style={{ backgroundColor: data.accentColor }} />
          {/* V-shape cutout bottom */}
          <svg
            className="absolute bottom-0 left-0 right-0 w-full"
            height="60"
            viewBox="0 0 100 60"
            preserveAspectRatio="none"
          >
            <polygon points="0,0 100,0 50,60" fill={data.mainColor1} />
          </svg>
          {/* Subtle shimmer on flap */}
          <div
            className="absolute inset-0 opacity-20"
            style={{ background: "linear-gradient(135deg, white 0%, transparent 60%)" }}
          />
        </div>

        {/* Tap prompt at bottom */}
        {tapSettings.visible && (
          <div
            className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-2"
            style={{
              color: data.neutralColor2,
              opacity: flapOpen ? 0 : 0.55,
              transition: "opacity 0.3s",
            }}
          >
            <p className="text-sm tracking-[0.25em] uppercase" style={{ fontFamily: `${data.bodyFont}, serif` }}>
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

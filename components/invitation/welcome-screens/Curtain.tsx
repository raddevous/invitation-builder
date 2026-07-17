"use client";

import { useState, useCallback } from "react";
import type { InvitationData } from "@/lib/types/invitation";
import { getElement, getScreenDef } from "@/lib/welcome-screens";

interface Props {
  data: InvitationData;
  onOpen: () => void;
}

export default function Curtain({ data, onOpen }: Props) {
  const [opening, setOpening] = useState(false);
  const displayName = data.nameType === "couple" 
    ? `${data.hisName || ""} ${data.andText || "&"} ${data.herName || ""}`.trim()
    : data.coupleName;

  const def = getScreenDef("curtain");
  const titleEl = def.elements.find((e) => e.id === "titleText")!;
  const titleSettings = getElement("curtain", "titleText", data.welcomeElements, titleEl);

  const handleTap = useCallback(() => {
    if (opening) return;
    setOpening(true);
    setTimeout(() => onOpen(), 1400);
  }, [opening, onOpen]);

  const panelStyle = {
    background: `linear-gradient(135deg, ${data.mainColor2}dd 0%, ${data.accentColor} 50%, ${data.mainColor2}bb 100%)`,
  };

  return (
    <div
      className="fixed inset-0 z-40 cursor-pointer select-none overflow-hidden"
      style={{ backgroundColor: data.mainColor1 }}
      onClick={handleTap}
    >
      {/* Content behind the curtain (slightly visible) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 pointer-events-none">
        <h1 style={{ color: data.mainColor2, fontFamily: `${data.headingFont}, serif`, fontSize: "2.5rem" }}>
          {displayName}
        </h1>
      </div>

      {/* Left curtain panel */}
      <div
        className="absolute top-0 left-0 bottom-0"
        style={{
          width: "51%",
          transition: opening ? "transform 1.2s cubic-bezier(0.65, 0, 0.35, 1)" : "none",
          transform: opening ? "translateX(-100%)" : "translateX(0)",
          ...panelStyle,
          zIndex: 2,
        }}
      >
        {/* Curtain fabric folds (right edge) */}
        <div className="absolute top-0 right-0 bottom-0 w-6"
          style={{ background: `linear-gradient(to right, transparent, ${data.mainColor2}50)` }}
        />
        {/* Vertical fold lines */}
        {[15, 35, 55, 75].map((pct, i) => (
          <div key={i} className="absolute top-0 bottom-0 w-px opacity-20"
            style={{ left: `${pct}%`, backgroundColor: "white" }}
          />
        ))}
        {/* Curtain tie */}
        <div className="absolute bottom-1/3 right-0 w-6 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: data.accentColor, border: `2px solid ${data.mainColor2}` }} />
        </div>
      </div>

      {/* Right curtain panel */}
      <div
        className="absolute top-0 right-0 bottom-0"
        style={{
          width: "51%",
          transition: opening ? "transform 1.2s cubic-bezier(0.65, 0, 0.35, 1) 0.05s" : "none",
          transform: opening ? "translateX(100%)" : "translateX(0)",
          ...panelStyle,
          zIndex: 2,
        }}
      >
        {/* Curtain fabric folds (left edge) */}
        <div className="absolute top-0 left-0 bottom-0 w-6"
          style={{ background: `linear-gradient(to left, transparent, ${data.mainColor2}50)` }}
        />
        {[25, 45, 65, 85].map((pct, i) => (
          <div key={i} className="absolute top-0 bottom-0 w-px opacity-20"
            style={{ left: `${pct}%`, backgroundColor: "white" }}
          />
        ))}
        {/* Curtain tie */}
        <div className="absolute bottom-1/3 left-0 w-6 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: data.accentColor, border: `2px solid ${data.mainColor2}` }} />
        </div>
      </div>

      {/* Center decoration — between the two curtains */}
      <div
        className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center gap-4 pointer-events-none"
        style={{ zIndex: 3, width: "2px" }}
      >
        {/* Floral knot */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
            style={{ backgroundColor: data.mainColor1, border: `2px solid ${data.accentColor}` }}
          >
            <span style={{ color: data.mainColor2, fontSize: "1.2rem" }}>✿</span>
          </div>
          <div className="w-px h-12 opacity-40" style={{ backgroundColor: data.mainColor2 }} />
        </div>
      </div>

      {/* Center text overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none"
        style={{ zIndex: 4 }}
      >
        <div
          className="px-8 py-6 text-center rounded-2xl"
          style={{
            backgroundColor: `${data.mainColor1}ee`,
            backdropFilter: "blur(4px)",
          }}
        >
          {titleSettings.visible && (
            <p className="text-xs tracking-[0.35em] uppercase mb-3"
              style={{ color: data.neutralColor2, fontFamily: `${data.bodyFont}, serif`, opacity: 0.7 }}
            >
              {titleSettings.text}
            </p>
          )}
          <h1
            className="leading-tight"
            style={{ fontSize: "2rem", color: data.mainColor2, fontFamily: `${data.headingFont}, serif` }}
          >
            {displayName}
          </h1>
          <p className="mt-2 text-sm italic opacity-70" style={{ color: data.neutralColor1, fontFamily: `${data.bodyFont}, serif` }}>
            {data.subtitle}
          </p>
          <div className="mt-5 flex flex-col items-center gap-1 opacity-50" style={{ color: data.neutralColor2 }}>
            <p className="text-xs tracking-[0.25em] uppercase" style={{ fontFamily: `${data.bodyFont}, serif` }}>
              {opening ? "Opening…" : "Tap to open"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

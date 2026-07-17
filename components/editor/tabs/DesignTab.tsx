"use client";

import { useState, useEffect } from "react";
import type { InvitationData, WelcomeScreenType } from "@/lib/types/invitation";
import { WELCOME_SCREENS } from "@/lib/welcome-screens";
import WelcomeEditor from "../welcome/WelcomeEditor";
import ColorControl from "@/components/shared/ColorControl";
import FontControl from "@/components/shared/FontControl";
import { usePredefinedOptions } from "@/lib/hooks/usePredefinedOptions";

interface DesignTabProps {
  data: InvitationData;
  onChange: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  isDarkMode?: boolean;
  accentColor?: string;
}

export default function DesignTab({ data, onChange, isDarkMode = false, accentColor = "#B88A78" }: DesignTabProps) {
  const [editingType, setEditingType] = useState<WelcomeScreenType | null>(null);
  const active = data.welcomeScreenType ?? "classic-envelope";

  // Local state for pending changes
  const [pendingData, setPendingData] = useState<InvitationData>(data);

  // Update pending data when parent data changes (e.g., after save)
  useEffect(() => {
    setPendingData(data);
  }, [data]);

  // Local change handler that updates pending state and queues the change
  const handleLocalChange = (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => {
    setPendingData(prev => ({ ...prev, [field]: value }));
    onChange(field, value);
  };

  // Fetch predefined options from Supabase
  const { options: predefinedSectionColors } = usePredefinedOptions('section_colors');
  const { options: predefinedHeadingFonts } = usePredefinedOptions('heading_fonts');
  const { options: predefinedBodyFonts } = usePredefinedOptions('body_fonts');

  if (editingType) {
    return (
      <WelcomeEditor
        screenType={editingType}
        data={pendingData}
        onChange={handleLocalChange}
        onBack={() => setEditingType(null)}
      />
    );
  }

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? "bg-gray-800" : ""}`}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">      {WELCOME_SCREENS.map((screen) => {
        const isSelected = pendingData.welcomeScreenType === screen.id;
        return (
          <div
            key={screen.id}
            onClick={() => handleLocalChange("welcomeScreenType", screen.id)}
            className={`rounded-2xl border-2 overflow-hidden transition-all cursor-pointer ${
              isSelected
                ? ""
                : (isDarkMode ? "border-gray-700 hover:border-gray-600" : "border-gray-100 hover:border-gray-200")
            }`}
            style={{ borderColor: isSelected ? accentColor : undefined }}           
          >
            {/* Preview area */}
            <div
              className={`relative h-28 flex items-center justify-center border-2 transition-colors ${
                isSelected ? "" : (isDarkMode ? "border-gray-700" : "border-gray-200")
              }`}
              style={{ backgroundColor: isSelected ? "#fff8f3" : (isDarkMode ? "#1f2937" : "#fafafa"), borderColor: isSelected ? accentColor : undefined }}
            >
              <WelcomePreview id={screen.id} data={pendingData} />

              {/* Selected badge */}
              {isSelected && (
                <div className="absolute top-2 right-2 text-white rounded-full w-6 h-6 flex items-center justify-center"
                style={{ backgroundColor: accentColor }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
              )}
            </div>

            {/* Info + buttons */}
            <div className={`px-4 py-3 flex items-center justify-between ${isDarkMode ? "border-gray-700" : "bg-white"}`}
            style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base">{screen.icon}</span>
                  <span className={`text-sm font-semibold ${isDarkMode ? "text-gray-200" : "text-[#5c4a3a]"}`}>{screen.label}</span>
                </div>
                <p className={`text-[11px] mt-0.5 leading-snug ${isDarkMode ? "text-gray-400" : "text-gray-400"}`}>{screen.description}</p>
              </div>

              <div className="flex flex-col gap-1.5 ml-3 shrink-0">
                {screen.id !== "none" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingType(screen.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium ${isDarkMode ? "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600" : "bg-[#fff8f3] border-[#e8cfc3] hover:bg-[#f5e8e0]"} transition-colors`}
                    style={{ color: isDarkMode ? undefined : accentColor }}
                  >
                    Edit ✏️
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Divider */}
      <div className={`border-t my-4 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`} />

      {/* Design controls moved from Design tab */}
      <div className="space-y-4">
        <label className="block text-base font-bold tracking-wide uppercase text-center" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>DESIGN THEME</label>

        <div className="pt-4">
          <ColorControl
            label="Main Color #1 (Background)"
            value={pendingData.mainColor1}
            onChange={(v) => handleLocalChange("mainColor1", v)}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
            predefinedColors={predefinedSectionColors.map(c => c.value)}
          />
        </div>
        <ColorControl
          label="Main Color #2 (Headings)"
          value={pendingData.mainColor2}
          onChange={(v) => handleLocalChange("mainColor2", v)}
          isDarkMode={isDarkMode}
          accentColor={accentColor}
          predefinedColors={predefinedSectionColors.map(c => c.value)}
        />
        <ColorControl
          label="Neutral Color 1 (Body)"
          value={pendingData.neutralColor1}
          onChange={(v) => handleLocalChange("neutralColor1", v)}
          isDarkMode={isDarkMode}
          accentColor={accentColor}
          predefinedColors={predefinedSectionColors.map(c => c.value)}
        />
        <ColorControl
          label="Neutral Color 2"
          value={pendingData.neutralColor2}
          onChange={(v) => handleLocalChange("neutralColor2", v)}
          isDarkMode={isDarkMode}
          accentColor={accentColor}
          predefinedColors={predefinedSectionColors.map(c => c.value)}
        />

        <div className={`border-t pt-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
          <label className="block text-base font-bold tracking-wide uppercase text-center" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>TYPOGRAPHY</label>
          <FontControl
            label="Heading Font"
            value={pendingData.headingFont}
            onChange={(v) => handleLocalChange("headingFont", v)}
            type="heading"
            isDarkMode={isDarkMode}
            accentColor={accentColor}
            predefinedFonts={predefinedHeadingFonts}
          />
          <FontControl
            label="Body Font"
            value={pendingData.bodyFont}
            onChange={(v) => handleLocalChange("bodyFont", v)}
            type="body"
            isDarkMode={isDarkMode}
            accentColor={accentColor}
            predefinedFonts={predefinedBodyFonts}
          />
        </div>
      </div>
      </div>
    </div>
  );
}

function WelcomePreview({ id, data }: { id: WelcomeScreenType; data: InvitationData }) {
  const mc1 = data.mainColor1;
  const mc2 = data.mainColor2;
  const nc1 = data.neutralColor1;
  const nc2 = data.neutralColor2;
  const ac = data.accentColor;

  if (id === "classic-envelope") {
    return (
      <div className="flex flex-col items-center gap-2 scale-75">
        <div className="relative" style={{ width: 80, height: 58 }}>
          <div className="absolute inset-0 rounded bg-white shadow" style={{ border: `1px solid ${ac}` }} />
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 58">
            <polygon points="0,0 80,0 40,28" fill={ac} />
            <path d="M0 20 L0 56 L40 36 Z" fill={ac} opacity="0.4" />
            <path d="M80 20 L80 56 L40 36 Z" fill={ac} opacity="0.3" />
          </svg>
          <div className="absolute rounded-full flex items-center justify-center"
            style={{ width: 14, height: 14, background: mc2, top: "55%", left: "50%", transform: "translate(-50%,-50%)" }}>
            <span className="text-white text-[8px]">♥</span>
          </div>
        </div>
        <p className="text-[9px] uppercase tracking-wider" style={{ color: mc2, opacity: 0.6 }}>Tap to open</p>
      </div>
    );
  }

  if (id === "full-envelope") {
    return (
      <div className="w-full h-full relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundColor: "white" }} />
        <div className="absolute inset-x-0 top-0" style={{ height: "45%", backgroundColor: ac }}>
          <svg className="absolute bottom-0 left-0 right-0 w-full" height="20" viewBox="0 0 100 20" preserveAspectRatio="none">
            <polygon points="0,0 100,0 50,20" fill={mc1} />
          </svg>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 mt-4">
          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: mc2 }}>
            <span className="text-white text-[8px]">♥</span>
          </div>
          <p className="text-[9px] font-semibold" style={{ color: mc2, fontFamily: `${data.headingFont}, serif` }}>
            {data.coupleName}
          </p>
        </div>
      </div>
    );
  }

  if (id === "curtain") {
    return (
      <div className="w-full h-full relative overflow-hidden flex">
        <div className="flex-1" style={{ background: `linear-gradient(135deg, ${mc2}cc, ${ac})` }}>
          {[20, 50, 80].map((p, i) => (
            <div key={i} className="absolute top-0 bottom-0 w-px opacity-20" style={{ left: `${p * 0.48}%`, backgroundColor: "white" }} />
          ))}
        </div>
        <div className="w-px" style={{ backgroundColor: mc1 }} />
        <div className="flex-1" style={{ background: `linear-gradient(225deg, ${mc2}cc, ${ac})` }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${mc1}ee`, color: mc2 }}>
            {data.coupleName}
          </p>
        </div>
      </div>
    );
  }

  if (id === "bloom") {
    return (
      <div className="relative flex items-center justify-center" style={{ width: 80, height: 80 }}>
        {["🌸", "🌺", "🌼", "🌷", "🌸", "🌺", "🌼", "🌷"].map((e, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const r = 32;
          return (
            <span key={i} className="absolute text-sm"
              style={{ left: `${50 + Math.cos(angle) * r}%`, top: `${50 + Math.sin(angle) * r}%`, transform: "translate(-50%,-50%)" }}>
              {e}
            </span>
          );
        })}
        <p className="absolute text-[8px] font-semibold text-center leading-tight" style={{ color: mc2, fontFamily: `${data.headingFont}, serif`, maxWidth: 44 }}>
          {data.coupleName}
        </p>
      </div>
    );
  }

  if (id === "none") {
    return (
      <div className="flex flex-col items-center gap-2">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={mc2} strokeWidth="1.5" opacity="0.5">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
        <p className="text-[10px]" style={{ color: mc2, opacity: 0.5 }}>No welcome screen</p>
      </div>
    );
  }

  return null;
}

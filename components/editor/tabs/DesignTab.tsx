"use client";

import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import type { InvitationData, WelcomeScreenType } from "@/lib/types/invitation";
import { WELCOME_SCREENS, getScreenDef, getElement } from "@/lib/welcome-screens";
import WelcomeEditor from "../welcome/WelcomeEditor";
import ClassicEnvelopeSettings from "../welcome/ClassicEnvelopeSettings";
import ColorControl from "@/components/shared/ColorControl";
import FontControl from "@/components/shared/FontControl";
import HybridFontControl from "@/components/shared/HybridFontControl";
import HybridDropdown from "@/components/shared/HybridDropdown";
import { usePredefinedOptions } from "@/lib/hooks/usePredefinedOptions";

interface DesignTabProps {
  data: InvitationData;
  onChange: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  isDarkMode?: boolean;
  accentColor?: string;
  onHeaderChange?: (header: { title: string; description: string; onBack: () => void } | null) => void;
}

export default function DesignTab({ data, onChange, isDarkMode = false, accentColor = "#6998EE", onHeaderChange }: DesignTabProps) {
  const [editingType, setEditingType] = useState<WelcomeScreenType | null>(null);
  const [openColorIndex, setOpenColorIndex] = useState<number | null>(null);
  const [openSection, setOpenSection] = useState<string | null>("colorTypography");

  // Local state for pending changes
  const [pendingData, setPendingData] = useState<InvitationData>(data);

  const active = pendingData.welcomeScreenType ?? "classic-envelope";

  // Update pending data when parent data changes (e.g., after save)
  useEffect(() => {
    setPendingData(data);
  }, [data]);

  // Report header override when editing a welcome screen
  useEffect(() => {
    if (editingType) {
      const screenLabel = WELCOME_SCREENS.find((s) => s.id === editingType)?.label ?? editingType;
      onHeaderChange?.({
        title: `${screenLabel.toUpperCase()} SETTINGS`,
        description: "Edit elements",
        onBack: () => setEditingType(null),
      });
    } else {
      onHeaderChange?.(null);
    }
  }, [editingType, onHeaderChange]);

  // Local change handler that updates pending state and queues the change
  const handleLocalChange = (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => {
    setPendingData(prev => ({ ...prev, [field]: value }));
    onChange(field, value);
  };

  // Fetch predefined options from Supabase
  const { options: predefinedSectionColors } = usePredefinedOptions('section_colors');
  const { options: predefinedHeadingFonts } = usePredefinedOptions('heading_fonts');
  const { options: predefinedBodyFonts } = usePredefinedOptions('body_fonts');

  const welcomeScreens = WELCOME_SCREENS;
  const currentScreenIndex = welcomeScreens.findIndex(s => s.id === (pendingData.welcomeScreenType ?? "classic-envelope"));
  const currentScreen = welcomeScreens[currentScreenIndex] ?? welcomeScreens[0];
  const currentScreenDef = getScreenDef(active);

  const goToSlide = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(welcomeScreens.length - 1, index));
    handleLocalChange("welcomeScreenType", welcomeScreens[clamped].id);
  }, [welcomeScreens, handleLocalChange]);

  const goPrev = useCallback(() => {
    goToSlide(currentScreenIndex - 1);
  }, [currentScreenIndex, goToSlide]);

  const goNext = useCallback(() => {
    goToSlide(currentScreenIndex + 1);
  }, [currentScreenIndex, goToSlide]);

  if (editingType) {
    return (
      <WelcomeEditor
        screenType={editingType}
        data={pendingData}
        onChange={handleLocalChange}
        onBack={() => setEditingType(null)}
        isDarkMode={isDarkMode}
        accentColor={accentColor}
      />
    );
  }

  return (
    <div className={`flex flex-col h-full ${isDarkMode ? "bg-gray-800" : ""}`}>
      {/* Welcome Screen Carousel - fixed, not scrollable */}
      <div className="p-4 pb-0 flex flex-col items-center">
        <WelcomeCarousel
          screens={welcomeScreens}
          currentIndex={currentScreenIndex}
          data={pendingData}
          onSelect={(id) => handleLocalChange("welcomeScreenType", id)}
          onPrev={goPrev}
          onNext={goNext}
          onEdit={(id) => setEditingType(id)}
          accentColor={accentColor}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Welcome Screen Settings */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setOpenSection(openSection === "settings" ? null : "settings")}
            className="w-full flex items-center justify-between"
          >
            <label className="block text-base font-bold tracking-wide uppercase text-left" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>
              {currentScreen.label.toUpperCase()} SETTINGS
            </label>
            <svg
              className={`w-5 h-5 transition-transform duration-200 ${openSection === "settings" ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: accentColor }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div
            className="grid transition-all duration-300 ease-in-out"
            style={{
              gridTemplateRows: openSection === "settings" ? "1fr" : "0fr",
              opacity: openSection === "settings" ? 1 : 0,
            }}
          >
            <div className="overflow-hidden">
              <div className="mt-2 p-3">
              {(active === "classic-envelope" || active === "full-envelope") ? (
                <>
                  {/* Envelope Design */}
                  <div className="space-y-4">
                    <h4
                      className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      ENVELOPE DESIGN
                    </h4>
                    <HybridDropdown
                      label=""
                      value={pendingData.welcomeEnvelopeTexture || "envA"}
                      onChange={(value) => handleLocalChange("welcomeEnvelopeTexture", String(value))}
                      options={[
                        { name: "Envelope A", value: "envA" },
                        { name: "Envelope B", value: "envB" },
                        { name: "Envelope C", value: "envC" }
                      ]}
                      isDarkMode={isDarkMode}
                      accentColor={accentColor}
                    />
                  </div>

                  {/* Color */}
                  <div className="space-y-4 mt-6">
                    <h4
                      className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      COLOR
                    </h4>
                    <ColorControl
                      label="Envelope Color"
                      value={pendingData.welcomeEnvelopeColor || pendingData.mainColor1 || "#ffffff"}
                      onChange={(value) => handleLocalChange("welcomeEnvelopeColor", value)}
                      isDarkMode={isDarkMode}
                      accentColor={accentColor}
                      predefinedColors={predefinedSectionColors.map(c => c.value)}
                    />
                  </div>

                  {/* Random Welcome Screen */}
                  <div className="flex items-center justify-between mt-6">
                    <span className="text-xs font-medium tracking-wide uppercase" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#d1d5db" : "#4b5563" }}>
                      RANDOM WELCOME SCREEN
                    </span>
                    <button
                      type="button"
                      onClick={() => handleLocalChange("welcomeRandomScreen", !(pendingData.welcomeRandomScreen ?? false))}
                      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200"
                      style={{ backgroundColor: (pendingData.welcomeRandomScreen ?? false) ? accentColor : (isDarkMode ? "#374151" : "#d1d5db") }}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${pendingData.welcomeRandomScreen ? "translate-x-4" : "translate-x-1"}`}
                      />
                    </button>
                  </div>
                </>
              ) : active === "curtain" ? (
                <div className="space-y-3">
                  {currentScreenDef.elements.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No editable elements for this screen.</p>
                  )}
                  {currentScreenDef.elements.map((elDef) => {
                    const settings = getElement(active, elDef.id, pendingData.welcomeElements, elDef);
                    return (
                      <div key={elDef.id} className="bg-gray-50 rounded-2xl p-4 space-y-4">
                        <span className="text-sm font-semibold text-[#5c4a3a]">{elDef.label}</span>
                        <p className="text-xs text-gray-400">Element controls available in full editor.</p>
                      </div>
                    );
                  })}
                </div>
              ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* MESSAGE collapsible */}
        {(active === "classic-envelope" || active === "full-envelope") && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setOpenSection(openSection === "message" ? null : "message")}
              className="w-full flex items-center justify-between"
            >
              <label className="block text-base font-bold tracking-wide uppercase text-left" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>
                MESSAGE
              </label>
              <svg
                className={`w-5 h-5 transition-transform duration-200 ${openSection === "message" ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: accentColor }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              className="grid transition-all duration-300 ease-in-out"
              style={{
                gridTemplateRows: openSection === "message" ? "1fr" : "0fr",
                opacity: openSection === "message" ? 1 : 0,
              }}
            >
              <div className="overflow-hidden">
                <div className="mt-2 p-3">
                  <ClassicEnvelopeSettings
                    data={pendingData}
                    onChange={handleLocalChange}
                    isDarkMode={isDarkMode}
                    accentColor={accentColor}
                    showStdImage={active === "full-envelope"}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Divider */}
      <div className={`border-t my-4 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`} />

      {/* Color & Typography */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setOpenSection(openSection === "colorTypography" ? null : "colorTypography")}
          className="w-full flex items-center justify-between"
        >
          <label className="block text-base font-bold tracking-wide uppercase text-left" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>MAIN COLOR & TYPOGRAPHY</label>
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${openSection === "colorTypography" ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: accentColor }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div
          className="grid transition-all duration-300 ease-in-out"
          style={{
            gridTemplateRows: openSection === "colorTypography" ? "1fr" : "0fr",
            opacity: openSection === "colorTypography" ? 1 : 0,
          }}
        >
          <div className="overflow-hidden">
            <div className="mt-2 space-y-2">
              <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>COLOR</label>
              {[
                { label: "Main Color #1 (Background)", key: "mainColor1" as const },
                { label: "Main Color #2 (Headings)", key: "mainColor2" as const },
                { label: "Neutral Color 1 (Body)", key: "neutralColor1" as const },
                { label: "Neutral Color 2", key: "neutralColor2" as const },
              ].map((item, i) => (
                <CollapsibleColorControl
                  key={item.key}
                  label={item.label}
                  value={pendingData[item.key]}
                  onChange={(v) => handleLocalChange(item.key, v)}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  predefinedColors={predefinedSectionColors.map(c => c.value)}
                  isOpen={openColorIndex === i}
                  onToggle={() => setOpenColorIndex(openColorIndex === i ? null : i)}
                />
              ))}

              <div className={`border-t pt-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
                <HybridFontControl
                  label="Heading Font"
                  value={pendingData.headingFont}
                  onChange={(v) => handleLocalChange("headingFont", v)}
                  type="heading"
                  showPreview={false}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  predefinedFonts={predefinedHeadingFonts}
                />
                <HybridFontControl
                  label="Body Font"
                  value={pendingData.bodyFont}
                  onChange={(v) => handleLocalChange("bodyFont", v)}
                  type="body"
                  showPreview={false}
                  isDarkMode={isDarkMode}
                  accentColor={accentColor}
                  predefinedFonts={predefinedBodyFonts}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

interface WelcomeCarouselProps {
  screens: typeof WELCOME_SCREENS;
  currentIndex: number;
  data: InvitationData;
  onSelect: (id: WelcomeScreenType) => void;
  onPrev: () => void;
  onNext: () => void;
  onEdit: (id: WelcomeScreenType) => void;
  accentColor: string;
  isDarkMode: boolean;
}

function WelcomeCarousel({ screens, currentIndex, data, onSelect, onPrev, onNext, onEdit, accentColor, isDarkMode }: WelcomeCarouselProps) {
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
    setIsSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsSwiping(false);
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        onNext();
      } else {
        onPrev();
      }
    }
  }, [onNext, onPrev]);

  const currentScreen = screens[currentIndex];

  return (
    <div className="flex flex-col items-center w-full max-w-[180px]">
      {/* Phone frame with preview inside + overlay arrows + pagination dots */}
      <div className="relative flex items-center">
        {/* Left arrow - overlaying phone image, vertically centered */}
        <button
          onClick={onPrev}
          disabled={currentIndex === 0}
          className={`hidden md:flex absolute -left-3 top-[calc(50%+8px)] -translate-y-1/2 z-20 w-9 h-9 rounded-full items-center justify-center transition-all ${
            currentIndex === 0
              ? "opacity-20 cursor-not-allowed"
              : isDarkMode
                ? "bg-gray-700/80 hover:bg-gray-600 text-gray-200"
                : "bg-white/80 hover:bg-white text-gray-600 shadow"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Right arrow - overlaying phone image, vertically centered */}
        <button
          onClick={onNext}
          disabled={currentIndex === screens.length - 1}
          className={`hidden md:flex absolute -right-3 top-[calc(50%+8px)] -translate-y-1/2 z-20 w-9 h-9 rounded-full items-center justify-center transition-all ${
            currentIndex === screens.length - 1
              ? "opacity-20 cursor-not-allowed"
              : isDarkMode
                ? "bg-gray-700/80 hover:bg-gray-600 text-gray-200"
                : "bg-white/80 hover:bg-white text-gray-600 shadow"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>

        <div
          className="relative w-full"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ touchAction: "pan-y" }}
        >
        {/* Phone frame image */}
        <img
          src="/assets/welc-phone.png"
          alt="Phone preview"
          className="w-full pointer-events-none select-none relative"
          style={{ zIndex: 2 }}
          draggable={false}
        />
        {/* Screen content area - positioned inside the phone frame */}
        <div
          className="absolute overflow-hidden"
          style={{
            top: "4.5%",
            left: "6%",
            right: "6%",
            bottom: "4.5%",
            borderRadius: "24px",
            backgroundColor: data.mainColor1,
          }}
        >
          {/* Carousel slides */}
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
              transitionDuration: isSwiping ? "0ms" : "300ms",
            }}
          >
            {screens.map((screen) => (
              <div
                key={screen.id}
                className="w-full h-full flex-shrink-0 flex items-center justify-center"
                onClick={() => onSelect(screen.id)}
              >
                <WelcomePreview id={screen.id} data={data} />
              </div>
            ))}
          </div>

          {/* Pagination dots - inside phone screen at bottom */}
          <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5 z-10">
            {screens.map((screen, i) => (
              <button
                key={screen.id}
                onClick={() => onSelect(screen.id)}
                className="transition-all rounded-full"
                style={{
                  width: i === currentIndex ? 16 : 5,
                  height: 5,
                  backgroundColor: i === currentIndex ? accentColor : (isDarkMode ? "#4b5563" : "#d1d5db"),
                }}
              />
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

interface CollapsibleColorControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isDarkMode?: boolean;
  accentColor?: string;
  predefinedColors?: string[];
  isOpen?: boolean;
  onToggle?: () => void;
}

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

function CollapsibleColorControl({ label, value, onChange, isDarkMode = false, accentColor = "#6998EE", predefinedColors, isOpen = false, onToggle }: CollapsibleColorControlProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`rounded-lg border transition-all duration-300`}
      style={{
        backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
        borderColor: isOpen ? accentColor : (hovered ? hexToRgba(accentColor, 0.8) : hexToRgba(accentColor, 0.3)),
        boxShadow: isOpen ? `0 0 0 1px ${hexToRgba(accentColor, 0.4)}` : undefined,
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5"
      >
        <span className={`text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-300" : "text-gray-600"}`} style={{ fontFamily: "Inter, sans-serif" }}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full border shadow-sm"
            style={{ backgroundColor: value, borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}
          />
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke={isDarkMode ? "#9ca3af" : "#6b7280"}
            strokeWidth="2.5"
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>
      {isOpen && (
        <div className="px-3 pb-3">
          <ColorControl
            label=""
            value={value}
            onChange={onChange}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
            predefinedColors={predefinedColors}
          />
        </div>
      )}
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
    const hisInitial = data.hisName?.charAt(0).toUpperCase() || "";
    const herInitial = data.herName?.charAt(0).toUpperCase() || "";
    const stampText =
      data.nameType === "couple"
        ? hisInitial && herInitial
          ? `${hisInitial}&${herInitial}`
          : hisInitial || herInitial
        : data.coupleName?.charAt(0).toUpperCase() || hisInitial;

    const envelopeColor = data.welcomeEnvelopeColor || mc1;
    const envTexture = data.welcomeEnvelopeTexture || "envA";
    const bgType = data.welcomeBackgroundType;
    const gradient = data.welcomeBackgroundGradient;
    const imageUrl = data.welcomeBackgroundImage?.urls?.filter((u) => u.trim() !== "")[0];
    const videoUrl = data.welcomeBackgroundVideo?.url;

    const getTexturePath = (value: string): string => {
      const textureMap: Record<string, string> = {
        "texturebg1": "/assets/texturebg1.jpg",
        "texturebg2": "/assets/texturebg2.jpg",
        "texturebg3": "/assets/texturebg3.jpg",
        "texturebg4": "/assets/texturebg4.jpg",
        "texturebg5": "/assets/texturebg5.jpg",
      };
      return textureMap[value] || value;
    };

    const finalImageUrl = imageUrl ? getTexturePath(imageUrl) : undefined;

    const tint = (src: string, z: number) => (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: z,
          backgroundColor: envelopeColor,
          mixBlendMode: "color",
          WebkitMaskImage: `url(${src})`,
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskImage: `url(${src})`,
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
        }}
      />
    );

    const gradientBackground = gradient
      ? `linear-gradient(135deg, ${hexToRgba(gradient.firstColor || mc1, (gradient.firstOpacity ?? 65) / 100)}, ${hexToRgba(gradient.secondColor || nc2, (gradient.secondOpacity ?? 65) / 100)})`
      : undefined;

    return (
      <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(/assets/${data.welcomeBackgroundImage?.urls?.[0] || "texturebg1"}.jpg)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: envelopeColor, mixBlendMode: "color" }}
          />
        </div>

        {/* Envelope */}
        <div
          className="relative"
          style={{ width: 130, height: 93, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.18))" }}
        >
          <img
            src="/assets/env-1.png"
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            style={{ zIndex: 1 }}
          />
          {tint("/assets/env-1.png", 1)}

          <img
            src={`/assets/${envTexture}/env-2.png`}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            style={{ zIndex: 3 }}
          />
          {tint(`/assets/${envTexture}/env-2.png`, 3)}

          <div
            className="absolute inset-0 pointer-events-none select-none"
            style={{ zIndex: 4, transformOrigin: "top center" }}
          >
            <img
              src="/assets/env-4.png"
              alt=""
              draggable={false}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            />
            {tint("/assets/env-4.png", 4)}
          </div>

          <div
            className="absolute inset-0 pointer-events-none select-none"
            style={{
              zIndex: 5,
              transformOrigin: "top center",
              filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))",
            }}
          >
            <img
              src={`/assets/${envTexture}/env-3.png`}
              alt=""
              draggable={false}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            />
            {tint(`/assets/${envTexture}/env-3.png`, 5)}
          </div>

          {/* Wax seal */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 6, transformOrigin: "top center" }}>
            <div className="absolute top-[65%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center">
              <img
                src="/assets/weddir-env-stamp.png"
                alt=""
                draggable={false}
                className="absolute inset-0 w-full h-full object-contain select-none"
              />
              <div
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                  backgroundColor: envelopeColor,
                  mixBlendMode: "color",
                  WebkitMaskImage: "url(/assets/weddir-env-stamp.png)",
                  WebkitMaskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskImage: "url(/assets/weddir-env-stamp.png)",
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                }}
              />
              <span
                className="absolute inset-0 flex items-center justify-center text-[6px] font-bold select-none"
                style={{
                  color: `color-mix(in srgb, ${envelopeColor} 80%, transparent)`,
                  mixBlendMode: "luminosity",
                  textShadow: "-0.3px -0.3px 0 rgba(255, 255, 255, 0.5), 0.3px 0.3px 1.5px rgba(0, 0, 0, 0.55)",
                  fontFamily: "Cinzel, serif",
                }}
              >
                {stampText.split("&").map((part, index, arr) => (
                  <Fragment key={index}>
                    {part}
                    {index < arr.length - 1 && (
                      <span style={{ fontSize: "0.6em" }}>&</span>
                    )}
                  </Fragment>
                ))}
              </span>
            </div>
          </div>
        </div>

        {/* Message below envelope */}
        {data.welcomeTopMessage && (
          <div
            className="relative z-10 text-center pointer-events-none select-none mt-3 px-2"
            style={{
              color: data.welcomeTopMessageColor || envelopeColor || mc1 || "#5c4a3a",
              fontFamily: data.welcomeTopMessageFont || "Playfair Display, serif",
              fontSize: "9px",
              textShadow: "-0.3px -0.3px 0 rgba(255, 255, 255, 0.4), 0.3px 0.3px 0 rgba(0, 0, 0, 0.5)",
              letterSpacing: "0.05em",
              lineHeight: 1.1,
            }}
          >
            {data.welcomeTopMessage}
          </div>
        )}
      </div>
    );
  }

  if (id === "full-envelope") {
    const hisInitial = data.hisName?.charAt(0).toUpperCase() || "";
    const herInitial = data.herName?.charAt(0).toUpperCase() || "";
    const stampText =
      data.nameType === "couple"
        ? hisInitial && herInitial
          ? `${hisInitial}&${herInitial}`
          : hisInitial || herInitial
        : data.coupleName?.charAt(0).toUpperCase() || hisInitial;

    const envelopeColor = data.welcomeEnvelopeColor || mc1;
    const envTexture = data.welcomeEnvelopeTexture || "envA";
    const stdIndex = Math.max(1, Math.min(6, data.welcomeFullEnvelopeStdImage ?? 1));

    // Map texturebg values to asset paths
    const getTexturePath = (value: string): string => {
      const textureMap: Record<string, string> = {
        "texturebg1": "/assets/texturebg1.jpg",
        "texturebg2": "/assets/texturebg2.jpg",
        "texturebg3": "/assets/texturebg3.jpg",
        "texturebg4": "/assets/texturebg4.jpg",
        "texturebg5": "/assets/texturebg5.jpg",
      };
      return textureMap[value] || value;
    };

    const bgType = data.welcomeBackgroundType;
    const imageUrl = data.welcomeBackgroundImage?.urls?.filter((u) => u.trim() !== "")[0];
    const finalImageUrl = imageUrl ? getTexturePath(imageUrl) : undefined;

    const tint = (src: string, z: number) => (
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: z,
          backgroundColor: envelopeColor,
          mixBlendMode: "color",
          WebkitMaskImage: `url(${src})`,
          WebkitMaskSize: "contain",
          WebkitMaskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskImage: `url(${src})`,
          maskSize: "contain",
          maskRepeat: "no-repeat",
          maskPosition: "center",
        }}
      />
    );

    return (
      <div className="relative w-full h-full overflow-hidden flex flex-col items-center justify-center">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url(/assets/${data.welcomeBackgroundImage?.urls?.[0] || "texturebg1"}.jpg)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: envelopeColor, mixBlendMode: "color" }}
          />
        </div>
        {/* Envelope */}
        <div
          className="relative h-full aspect-[7/5]"
          style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.18))" }}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 2 }}>
            <div className="relative select-none w-[40%] h-[40%] sm:w-[50%] sm:h-[50%] md:w-[60%] md:h-[60%] lg:w-[70%] lg:h-[70%]">
              <img
                src={`/assets/std/std-${stdIndex}.png`}
                alt=""
                draggable={false}
                className="absolute inset-0 w-full h-full object-contain"
              />
              {envelopeColor && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: envelopeColor,
                    mixBlendMode: "hue",
                    WebkitMaskImage: `url(/assets/std/std-${stdIndex}.png)`,
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskImage: `url(/assets/std/std-${stdIndex}.png)`,
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                  }}
                />
              )}
            </div>
          </div>

          <img
            src={`/assets/${envTexture}/envf-2.png`}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            style={{ zIndex: 3 }}
          />
          {tint(`/assets/${envTexture}/envf-2.png`, 3)}

          <div
            className="absolute inset-0 pointer-events-none select-none"
            style={{ zIndex: 5, transformOrigin: "top center", filter: "drop-shadow(0 6px 10px rgba(0, 0, 0, 0.45))" }}
          >
            <img
              src={`/assets/${envTexture}/envf-3.png`}
              alt=""
              draggable={false}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
            />
            {tint(`/assets/${envTexture}/envf-3.png`, 5)}

            {/* Wax seal */}
            <div className="absolute inset-0 pointer-events-none" style={{ transformOrigin: "top center" }}>
              <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[17%] aspect-square flex items-center justify-center">
                <img
                  src="/assets/weddir-env-stamp.png"
                  alt=""
                  draggable={false}
                  className="absolute inset-0 w-full h-full object-contain select-none"
                />
                <div
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{
                    backgroundColor: envelopeColor,
                    mixBlendMode: "color",
                    WebkitMaskImage: "url(/assets/weddir-env-stamp.png)",
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskImage: "url(/assets/weddir-env-stamp.png)",
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center",
                  }}
                />
                <span
                  className="absolute inset-0 flex items-center justify-center font-bold select-none"
                  style={{
                    fontSize: "clamp(8px, 4.5vmin, 16px)",
                    color: `color-mix(in srgb, ${envelopeColor} 80%, transparent)`,
                    mixBlendMode: "luminosity",
                    textShadow: "-0.6px -0.6px 0 rgba(255, 255, 255, 0.5), 1px 1px 3px rgba(0, 0, 0, 0.55)",
                    fontFamily: "Cinzel, serif",
                  }}
                >
                  {stampText.split("&").map((part, index, arr) => (
                    <Fragment key={index}>
                      {part}
                      {index < arr.length - 1 && (
                        <span style={{ fontSize: "0.6em" }}>&</span>
                      )}
                    </Fragment>
                  ))}
                </span>
              </div>
              {data.welcomeTopMessage && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 text-center pointer-events-none select-none"
                  style={{
                    top: "calc(55% + 16%)",
                    width: "80%",
                    color: data.welcomeTopMessageColor || envelopeColor || mc1 || "#5c4a3a",
                    fontFamily: data.welcomeTopMessageFont || "Playfair Display, serif",
                    fontSize: "clamp(8px, 3.5vmin, 15px)",
                    textShadow: "-0.3px -0.3px 0 rgba(255, 255, 255, 0.4), 0.3px 0.3px 0 rgba(0, 0, 0, 0.5)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {data.welcomeTopMessage}
                </div>
              )}
            </div>
          </div>
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

  return null;
}

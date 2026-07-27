"use client";

import { useState } from "react";
import type { InvitationData } from "@/lib/types/invitation";
import ColorControl from "@/components/shared/ColorControl";
import HybridSelectControl from "@/components/shared/HybridSelectControl";
import { usePredefinedOptions } from "@/lib/hooks/usePredefinedOptions";

const STD_IMAGES = [
  { name: "Std 1", value: 1 },
  { name: "Std 2", value: 2 },
  { name: "Std 3", value: 3 },
  { name: "Std 4", value: 4 },
  { name: "Std 5", value: 5 },
  { name: "Std 6", value: 6 },
];

interface ClassicEnvelopeSettingsProps {
  data: InvitationData;
  onChange: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  isDarkMode?: boolean;
  accentColor?: string;
  showStdImage?: boolean;
}

export default function ClassicEnvelopeSettings({ data, onChange, isDarkMode = false, accentColor = "#6998EE", showStdImage = false }: ClassicEnvelopeSettingsProps) {
  const { options: predefinedSectionColors } = usePredefinedOptions('section_colors');
  const { options: predefinedHeadingFonts } = usePredefinedOptions('heading_fonts');

  const [topMessageIndex, setTopMessageIndex] = useState(0);
  const [showStdPicker, setShowStdPicker] = useState(false);
  const [useDifferentColor, setUseDifferentColor] = useState(!!data.welcomeTopMessageColor);

  const TOP_MESSAGES = [
    "You are cordially invited",
    "Together with our families",
    "We invite you to celebrate",
    "Join us for our wedding",
    "Please join us",
    "Celebrate with us",
    "We are getting married",
    "You are invited",
    "With love, we invite you",
  ];

  const sectionColors = predefinedSectionColors.map((c) => c.value);

  const envelopeColor = data.welcomeEnvelopeColor || data.mainColor1 || "#ffffff";

  return (
    <div className="space-y-6">
      {showStdImage ? (
          /* Full envelope: portrait container with background + envelope color tint */
          <div className="flex justify-center">
            <div
              className="relative rounded-lg overflow-hidden border border-gray-200"
              style={{ width: "160px", aspectRatio: "9 / 16" }}
            >
              {/* Background texture */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(/assets/${data.welcomeBackgroundImage?.urls?.[0] || "texturebg1"}.jpg)`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              {/* Envelope color tint */}
              <div
                className="absolute inset-0"
                style={{ backgroundColor: envelopeColor, mixBlendMode: "color" }}
              />
              {/* Std image */}
              <button
                type="button"
                onClick={() => setShowStdPicker(true)}
                className="absolute inset-0 flex items-center justify-center p-4"
              >
                <div className="relative w-full h-full" style={{ maxWidth: "60%", maxHeight: "60%" }}>
                  <img
                    src={`/assets/std/std-${data.welcomeFullEnvelopeStdImage ?? 1}.png`}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  {envelopeColor && (
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundColor: envelopeColor,
                        mixBlendMode: "hue",
                        WebkitMaskImage: `url(/assets/std/std-${data.welcomeFullEnvelopeStdImage ?? 1}.png)`,
                        WebkitMaskSize: "contain",
                        WebkitMaskRepeat: "no-repeat",
                        WebkitMaskPosition: "center",
                        maskImage: `url(/assets/std/std-${data.welcomeFullEnvelopeStdImage ?? 1}.png)`,
                        maskSize: "contain",
                        maskRepeat: "no-repeat",
                        maskPosition: "center",
                      }}
                    />
                  )}
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Classic envelope: square container */
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowStdPicker(true)}
              className="relative rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
              style={{ width: "160px", aspectRatio: "1 / 1" }}
            >
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="relative w-full h-full" style={{ maxWidth: "70%", maxHeight: "70%" }}>
                  <img
                    src={`/assets/std/std-${data.welcomeFullEnvelopeStdImage ?? 1}.png`}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  {envelopeColor && (
                    <div
                      className="absolute inset-0"
                      style={{
                        backgroundColor: envelopeColor,
                        mixBlendMode: "hue",
                        WebkitMaskImage: `url(/assets/std/std-${data.welcomeFullEnvelopeStdImage ?? 1}.png)`,
                        WebkitMaskSize: "contain",
                        WebkitMaskRepeat: "no-repeat",
                        WebkitMaskPosition: "center",
                        maskImage: `url(/assets/std/std-${data.welcomeFullEnvelopeStdImage ?? 1}.png)`,
                        maskSize: "contain",
                        maskRepeat: "no-repeat",
                        maskPosition: "center",
                      }}
                    />
                  )}
                </div>
              </div>
            </button>
          </div>
        )}

      {/* BACKGROUND */}
      <div className="space-y-4">
        <h4
          className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          BACKGROUND
        </h4>

        <HybridSelectControl
          label="Texture"
          value={data.welcomeBackgroundImage?.urls?.[0] || "texturebg1"}
          onChange={(value) => onChange("welcomeBackgroundImage", { urls: [value] })}
          options={[
            { name: "Texture 1", value: "texturebg1" },
            { name: "Texture 2", value: "texturebg2" },
            { name: "Texture 3", value: "texturebg3" },
            { name: "Texture 4", value: "texturebg4" },
            { name: "Texture 5", value: "texturebg5" },
          ]}
          isDarkMode={isDarkMode}
          accentColor={accentColor}
        />
      </div>

      {/* TOP MESSAGE */}
      <div className="space-y-4">
        <h4
          className={`text-sm font-medium text-left ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          TOP MESSAGE
        </h4>

        {/* Top Message */}
        <div className="space-y-2">
          <label
            className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Message
          </label>
          <div className="relative">
            <input
              type="text"
              value={data.welcomeTopMessage || ""}
              onChange={(e) => onChange("welcomeTopMessage", e.target.value || undefined)}
              className={`w-full px-3 py-3 pr-10 text-lg border rounded-lg text-center ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
              style={{ fontFamily: data.welcomeTopMessageFont || "Inter, sans-serif", fontSize: "18px" }}
              placeholder="You are cordially invited"
            />
            <button
              type="button"
              onClick={() => {
                const nextIndex = (topMessageIndex + 1) % TOP_MESSAGES.length;
                setTopMessageIndex(nextIndex);
                onChange("welcomeTopMessage", TOP_MESSAGES[nextIndex]);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: accentColor }}
              title="Cycle predefined messages"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Font Type */}
        <HybridSelectControl
          label="Font Type"
          value={data.welcomeTopMessageFont || ""}
          onChange={(value) => onChange("welcomeTopMessageFont", value || undefined)}
          options={predefinedHeadingFonts}
          isDarkMode={isDarkMode}
          accentColor={accentColor}
        />

        {/* Use Different Color toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tracking-wide uppercase" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#d1d5db" : "#4b5563" }}>
            USE DIFFERENT COLOR
          </span>
          <button
            type="button"
            onClick={() => {
              const next = !useDifferentColor;
              setUseDifferentColor(next);
              if (!next) {
                onChange("welcomeTopMessageColor", undefined);
              }
            }}
            className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200"
            style={{ backgroundColor: useDifferentColor ? accentColor : (isDarkMode ? "#374151" : "#d1d5db") }}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${useDifferentColor ? "translate-x-4" : "translate-x-1"}`}
            />
          </button>
        </div>

        {/* Font Color - only visible when use different color is on */}
        {useDifferentColor && (
          <ColorControl
            label="Font Color"
            value={data.welcomeTopMessageColor || envelopeColor}
            onChange={(value) => onChange("welcomeTopMessageColor", value || undefined)}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
            predefinedColors={sectionColors}
          />
        )}
      </div>

      {/* Std Image Picker Dialog */}
      {showStdPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowStdPicker(false)}
        >
          <div
            className={`rounded-xl p-6 max-w-sm w-full mx-4 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-sm font-semibold mb-4 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              SELECT STD IMAGE
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {STD_IMAGES.map((img) => (
                <button
                  key={img.value}
                  type="button"
                  onClick={() => {
                    onChange("welcomeFullEnvelopeStdImage", img.value);
                    setShowStdPicker(false);
                  }}
                  className={`relative rounded-lg overflow-hidden border-2 p-2 flex items-center justify-center transition-colors ${
                    (data.welcomeFullEnvelopeStdImage ?? 1) === img.value
                      ? "border-current"
                      : isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                  style={{ aspectRatio: "1 / 1", borderColor: (data.welcomeFullEnvelopeStdImage ?? 1) === img.value ? accentColor : undefined }}
                >
                  <div className="relative max-w-full max-h-full">
                    <img
                      src={`/assets/std/std-${img.value}.png`}
                      alt={img.name}
                      className="max-w-full max-h-full object-contain"
                    />
                    {envelopeColor && (
                      <div
                        className="absolute inset-0"
                        style={{
                          backgroundColor: envelopeColor,
                          mixBlendMode: "hue",
                          WebkitMaskImage: `url(/assets/std/std-${img.value}.png)`,
                          WebkitMaskSize: "contain",
                          WebkitMaskRepeat: "no-repeat",
                          WebkitMaskPosition: "center",
                          maskImage: `url(/assets/std/std-${img.value}.png)`,
                          maskSize: "contain",
                          maskRepeat: "no-repeat",
                          maskPosition: "center",
                        }}
                      />
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowStdPicker(false)}
              className={`mt-4 w-full py-2 rounded-lg text-sm font-medium ${isDarkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-600"}`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

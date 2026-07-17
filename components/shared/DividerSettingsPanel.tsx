import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { DividerType, DividerStyle } from "@/lib/types/invitation";
import HybridDropdown from "./HybridDropdown";
import ColorControl from "./ColorControl";

interface DividerSettingsPanelProps {
  title: string;
  isClosing: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  desktopMode?: boolean;
  panelPosition?: "left" | "right";
  dividerType: DividerType;
  onDividerTypeChange: (value: DividerType) => void;
  tintColor: string;
  onTintColorChange: (value: string) => void;
  tintOpacity: number;
  onTintOpacityChange: (value: number) => void;
  dividerStyle: DividerStyle;
  onDividerStyleChange: (value: DividerStyle) => void;
  flip: boolean;
  onFlipChange: (value: boolean) => void;
  spacing: number;
  onSpacingChange: (value: number) => void;
  pullDown: number;
  onPullDownChange: (value: number) => void;
  verticalFlip: boolean;
  onVerticalFlipChange: (value: boolean) => void;
  imageSize: number;
  onImageSizeChange: (value: number) => void;
  predefinedColors?: string[];
  accentColor?: string;
  useDefault?: boolean;
  onUseDefaultChange?: (value: boolean) => void;
  onApplyToAll?: () => void;
  customImageUrl1?: string;
  onCustomImageUrl1Change?: (value: string) => void;
  customImageUrl2?: string;
  onCustomImageUrl2Change?: (value: string) => void;
  customImageUrl3?: string;
  onCustomImageUrl3Change?: (value: string) => void;
  predefinedDividerImages?: { name: string; value: string }[];
  predefinedDivider1Images?: { name: string; value: string }[];
  predefinedDivider2Images?: { name: string; value: string }[];
  predefinedDivider3Images?: { name: string; value: string }[];
  colorBlend?: boolean;
  onColorBlendChange?: (value: boolean) => void;
}

const DIVIDER_TYPE_OPTIONS = [
  { name: "Centered Single", value: "divider-1" },
  { name: "Split Horizontal", value: "divider-2" },
  { name: "Mirrored Corners", value: "divider-3" },
];

const DIVIDER_STYLE_OPTIONS = [
  { name: "Centered Single", value: "centered-single" },
  { name: "Split Horizontal", value: "split-horizontal" },
  { name: "Mirrored Corners", value: "mirrored-corners" },
];

const getDividerStyleOptions = (dividerType: DividerType) => {
  // Divider 1 only supports Centered Single
  if (dividerType === "divider-1") {
    return [
      { name: "Centered Single", value: "centered-single" },
    ];
  }
  // Floral Corner (divider-2) only supports Split Horizontal
  if (dividerType === "divider-2") {
    return [
      { name: "Split Horizontal", value: "split-horizontal" },
    ];
  }
  return DIVIDER_STYLE_OPTIONS;
};

export default function DividerSettingsPanel({
  title,
  isClosing,
  onClose,
  isDarkMode = false,
  desktopMode = false,
  panelPosition = "right",
  dividerType,
  onDividerTypeChange,
  tintColor,
  onTintColorChange,
  tintOpacity,
  onTintOpacityChange,
  dividerStyle,
  onDividerStyleChange,
  flip,
  onFlipChange,
  spacing,
  onSpacingChange,
  pullDown,
  onPullDownChange,
  verticalFlip,
  onVerticalFlipChange,
  imageSize,
  onImageSizeChange,
  predefinedColors,
  accentColor = "#B88A78",
  useDefault = false,
  onUseDefaultChange,
  onApplyToAll,
  customImageUrl1,
  onCustomImageUrl1Change,
  customImageUrl2,
  onCustomImageUrl2Change,
  customImageUrl3,
  onCustomImageUrl3Change,
  predefinedDividerImages,
  predefinedDivider1Images,
  predefinedDivider2Images,
  predefinedDivider3Images,
  colorBlend = false,
  onColorBlendChange,
}: DividerSettingsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollListenerActive = useRef(false);

  // Close panel on window scroll (outside the panel)
  useEffect(() => {
    const handleWindowScroll = (e: Event) => {
      // Don't close if scrolling inside the panel
      if (panelRef.current && panelRef.current.contains(e.target as Node)) {
        return;
      }
      // Don't close if scroll listener is not yet active (prevents immediate closing after opening)
      if (!scrollListenerActive.current) {
        return;
      }
      onClose();
    };

    // Delay activating scroll listener to prevent immediate closing after panel opens
    const timer = setTimeout(() => {
      scrollListenerActive.current = true;
    }, 500);

    window.addEventListener('scroll', handleWindowScroll, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleWindowScroll, true);
    };
  }, [onClose]);

  // Auto-switch divider style when switching to Floral Corner if current style is not supported
  const handleDividerTypeChange = (value: string | number) => {
    const newType = value as DividerType;
    onDividerTypeChange(newType);
    // If switching to Floral Corner and current style is centered-single, switch to split-horizontal
    if (newType === "divider-2" && dividerStyle === "centered-single") {
      onDividerStyleChange("split-horizontal");
    }
  };

  return createPortal(
    <>
      {/* Backdrop */}
      {!isClosing && (
        <div
          className="fixed inset-0 bg-transparent z-[999]"
          onMouseDown={onClose}
          onWheel={onClose}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      )}

      {/* Sheet */}
      <div
        ref={panelRef}
        data-divider-settings-panel="true"
        className={`fixed z-[1000] shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"} ${
          desktopMode
            ? `top-0 bottom-0 ${panelPosition === "left" ? "left-0 border-r" : "right-0 border-l"} ${isClosing ? (panelPosition === "left" ? "animate-slide-out-side" : "animate-slide-out-side-right") : (panelPosition === "left" ? "animate-slide-in-side" : "animate-slide-in-side-right")}`
            : `bottom-0 left-0 right-0 rounded-t-3xl ${isClosing ? "animate-slide-down" : "animate-slide-up"}`
        }`}
        style={desktopMode ? { width: "400px" } : { maxWidth: 480, margin: "0 auto", maxHeight: "70vh" }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Handle bar - only show in mobile mode */}
        {!desktopMode && (
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className={`w-10 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`} />
          </div>
        )}

        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-2 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
          <h3
            className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-[#5c4a3a]"}`}
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto px-5 py-4 space-y-6 ${useDefault ? "opacity-40 pointer-events-none" : ""}`}>
          <HybridDropdown
            label="Divider"
            value={dividerType}
            onChange={handleDividerTypeChange}
            options={DIVIDER_TYPE_OPTIONS}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
          />

          {/* Custom Image URL - for all divider types */}
          {(dividerType === "divider-1" || dividerType === "divider-2" || dividerType === "divider-3") && (
            <div className="space-y-2">
              <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Image URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={dividerType === "divider-1" ? (customImageUrl1 || "") : dividerType === "divider-2" ? (customImageUrl2 || "") : (customImageUrl3 || "")}
                  onChange={(e) => {
                    if (dividerType === "divider-1") {
                      onCustomImageUrl1Change?.(e.target.value);
                    } else if (dividerType === "divider-2") {
                      onCustomImageUrl2Change?.(e.target.value);
                    } else {
                      onCustomImageUrl3Change?.(e.target.value);
                    }
                  }}
                  placeholder="Enter image URL"
                  className={`w-full px-3 py-2 pr-10 text-sm border rounded-lg font-mono ${isDarkMode ? "bg-gray-800 border-gray-700 text-gray-200" : "border-gray-200"}`}
                />
                {((predefinedDividerImages && predefinedDividerImages.length > 0) || (predefinedDivider1Images && predefinedDivider1Images.length > 0) || (predefinedDivider2Images && predefinedDivider2Images.length > 0) || (predefinedDivider3Images && predefinedDivider3Images.length > 0)) && (
                  <button
                    type="button"
                    onClick={() => {
                      let currentUrl;
                      let imagesToCycle;
                      if (dividerType === "divider-1") {
                        currentUrl = customImageUrl1;
                        imagesToCycle = predefinedDivider1Images || predefinedDividerImages || [];
                      } else if (dividerType === "divider-2") {
                        currentUrl = customImageUrl2;
                        imagesToCycle = predefinedDivider2Images || predefinedDividerImages || [];
                      } else {
                        currentUrl = customImageUrl3;
                        imagesToCycle = predefinedDivider3Images || predefinedDividerImages || [];
                      }
                      if (imagesToCycle.length === 0) return;
                      const currentIndex = imagesToCycle.findIndex(img => img.value === currentUrl);
                      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % imagesToCycle.length;
                      if (dividerType === "divider-1") {
                        onCustomImageUrl1Change?.(imagesToCycle[nextIndex].value);
                      } else if (dividerType === "divider-2") {
                        onCustomImageUrl2Change?.(imagesToCycle[nextIndex].value);
                      } else {
                        onCustomImageUrl3Change?.(imagesToCycle[nextIndex].value);
                      }
                    }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
                    title="Cycle through predefined images"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                      <path d="M21 3v5h-5" />
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                      <path d="M8 16H3v5" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Image Size Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Image Size
              </label>
              <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                {imageSize}%
              </span>
            </div>
            <input
              type="range"
              min={50}
              max={150}
              step={1}
              value={imageSize}
              onChange={(e) => onImageSizeChange(Number(e.target.value))}
              className="w-full"
              style={{
                accentColor: accentColor,
                background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(imageSize - 50) / 100 * 100}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} ${(imageSize - 50) / 100 * 100}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} 100%)`,
                borderRadius: '4px',
                height: '8px'
              }}
            />
          </div>

          {/* Flip Toggle */}
          <div className="flex items-center justify-between">
            <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Flip
            </label>
            <button
              onClick={() => onFlipChange(!flip)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                flip ? '' : (isDarkMode ? "bg-gray-600" : "bg-gray-200")
              }`}
              style={{ backgroundColor: flip ? accentColor : undefined }}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  flip ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Color Blend Toggle */}
          <div className="flex items-center justify-between">
            <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Color Blend
            </label>
            <button
              onClick={() => onColorBlendChange?.(!colorBlend)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                colorBlend ? '' : (isDarkMode ? "bg-gray-600" : "bg-gray-200")
              }`}
              style={{ backgroundColor: colorBlend ? accentColor : undefined }}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  colorBlend ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <ColorControl
            label="Tint Color"
            value={tintColor}
            onChange={onTintColorChange}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
            predefinedColors={predefinedColors}
          />

          {/* Tint Opacity Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Tint Opacity
              </label>
              <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                {tintOpacity}%
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={tintOpacity}
              onChange={(e) => onTintOpacityChange(Number(e.target.value))}
              className="w-full"
              style={{
                accentColor: accentColor,
                background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(tintOpacity - 1) / 99 * 100}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} ${(tintOpacity - 1) / 99 * 100}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} 100%)`,
                borderRadius: '4px',
                height: '8px'
              }}
            />
          </div>

          {/* Style Dropdown - hide for divider-1, divider-2, and divider-3 since they have fixed styles */}
          {dividerType !== "divider-1" && dividerType !== "divider-2" && dividerType !== "divider-3" && (
            <HybridDropdown
              label="Style"
              value={dividerStyle}
              onChange={(value) => onDividerStyleChange(value as DividerStyle)}
              options={getDividerStyleOptions(dividerType)}
              isDarkMode={isDarkMode}
              accentColor={accentColor}
            />
          )}

          {/* Spacing Slider - only for mirrored-corners and not for divider-2 (Split Horizontal) */}
          {dividerStyle === "mirrored-corners" && dividerType !== "divider-2" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  Space
                </label>
                <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  {spacing}%
                </span>
              </div>
              <input
                type="range"
                min={-10}
                max={10}
                step={1}
                value={spacing}
                onChange={(e) => onSpacingChange(Number(e.target.value))}
                className="w-full"
                style={{
                  accentColor: accentColor,
                  background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${(spacing - (-10)) / 20 * 100}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} ${(spacing - (-10)) / 20 * 100}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} 100%)`,
                  borderRadius: '4px',
                  height: '8px'
                }}
              />
            </div>
          )}

          {/* Pull Down Slider - only for split-horizontal */}
          {(dividerStyle === "split-horizontal" || dividerType === "divider-2") && dividerType !== "divider-1" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  Pull Down
                </label>
                <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  {pullDown}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={50}
                step={1}
                value={pullDown}
                onChange={(e) => onPullDownChange(Number(e.target.value))}
                className="w-full"
                style={{
                  accentColor: accentColor,
                  background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${pullDown / 50 * 100}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} ${pullDown / 50 * 100}%, ${isDarkMode ? '#4B5563' : '#E5E7EB'} 100%)`,
                  borderRadius: '4px',
                  height: '8px'
                }}
              />
            </div>
          )}

          {/* Vertical Flip Toggle - only for split-horizontal */}
          {(dividerStyle === "split-horizontal" || dividerType === "divider-2") && dividerType !== "divider-1" && (
            <div className="flex items-center justify-between pt-2">
              <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Vertical Flip
              </label>
              <button
                type="button"
                onClick={() => onVerticalFlipChange(!verticalFlip)}
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ${
                  verticalFlip ? '' : isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
                }`}
                style={{ backgroundColor: verticalFlip ? accentColor : undefined }}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    verticalFlip ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        {/* Use Default Divider checkbox - outside scrollable area */}
        {onUseDefaultChange && (
          <div className={`shrink-0 px-5 py-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useDefault}
                onChange={(e) => onUseDefaultChange(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor }}
              />
              <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                Use Default Divider
              </span>
            </label>
          </div>
        )}

        {/* Apply to all Sections button - outside scrollable area */}
        {onApplyToAll && (
          <div className={`shrink-0 px-5 py-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
            <button
              onClick={onApplyToAll}
              className="w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors"
              style={{
                fontFamily: "Inter, sans-serif",
                backgroundColor: accentColor,
                color: "white"
              }}
            >
              Apply to all Sections
            </button>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}

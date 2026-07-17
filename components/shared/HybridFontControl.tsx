import { useState } from "react";

interface FontOption {
  name: string;
  value: string;
}

interface HybridFontControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "heading" | "body";
  showPreview?: boolean;
  isDarkMode?: boolean;
  accentColor?: string;
  disabled?: boolean;
  predefinedFonts?: string[] | FontOption[];
  useInterFont?: boolean;
}

const HEADING_FONTS = [
  "Playfair Display",
  "Cormorant Garamond",
  "Great Vibes",
  "Cinzel",
  "Libre Baskerville",
  "EB Garamond",
  "Railway",
];

const BODY_FONTS = [
  "Inter",
  "Cormorant Garamond",
  "Playfair Display",
  "Lato",
  "Montserrat",
  "Source Serif 4",
  "Raleway",
];

export default function HybridFontControl({
  label,
  value,
  onChange,
  type = "body",
  showPreview = true,
  isDarkMode = false,
  accentColor = "#B88A78",
  disabled = false,
  predefinedFonts,
  useInterFont = false
}: HybridFontControlProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Convert predefined fonts to FontOption format if needed
  const fontOptions: FontOption[] = predefinedFonts && predefinedFonts.length > 0 
    ? (typeof predefinedFonts[0] === 'string' 
        ? (predefinedFonts as string[]).map(font => ({ name: font, value: font }))
        : predefinedFonts as FontOption[])
    : (type === "heading" 
        ? HEADING_FONTS.map(font => ({ name: font, value: font }))
        : BODY_FONTS.map(font => ({ name: font, value: font })));

  const currentIndex = fontOptions.findIndex(font => font.value === value);

  const goToPrevious = () => {
    if (disabled || isTransitioning || fontOptions.length <= 1) return;
    setIsTransitioning(true);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : fontOptions.length - 1;
    onChange(fontOptions[prevIndex].value);
    setTimeout(() => setIsTransitioning(false), 150);
  };

  const goToNext = () => {
    if (disabled || isTransitioning || fontOptions.length <= 1) return;
    setIsTransitioning(true);
    const nextIndex = currentIndex < fontOptions.length - 1 ? currentIndex + 1 : 0;
    onChange(fontOptions[nextIndex].value);
    setTimeout(() => setIsTransitioning(false), 150);
  };

  const handleDropdownChange = (newValue: string) => {
    if (disabled) return;
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{label}</label>
      
      {/* Hybrid Control with Dropdown and Arrows */}
      <div className="flex items-center gap-2">
        {/* Previous Arrow */}
        <button
          type="button"
          onClick={goToPrevious}
          disabled={disabled || fontOptions.length <= 1 || isTransitioning}
          className={`p-2 rounded-lg transition-all duration-200 border ${
            disabled || fontOptions.length <= 1
              ? "opacity-50 cursor-not-allowed border-transparent"
              : isDarkMode 
                ? "hover:bg-gray-800 text-gray-400 hover:text-white border-gray-700" 
                : "hover:bg-gray-100 text-gray-600 border-gray-200"
          }`}
          style={{
            ...(disabled || fontOptions.length <= 1 ? {} : {
              '--hover-color': accentColor
            } as React.CSSProperties)
          }}
          onMouseEnter={(e) => {
            if (!disabled && fontOptions.length > 1 && !isTransitioning) {
              e.currentTarget.style.color = accentColor;
              e.currentTarget.style.borderColor = accentColor;
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && fontOptions.length > 1 && !isTransitioning) {
              e.currentTarget.style.color = '';
              e.currentTarget.style.borderColor = '';
            }
          }}
        >
          <svg className="w-4 h-4 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        <select
          key={value}
          value={value}
          onChange={(e) => handleDropdownChange(e.target.value)}
          disabled={disabled}
          className={`flex-1 px-3 py-2.5 border rounded-lg text-sm appearance-none cursor-pointer text-center transition-all duration-200 ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200 bg-white"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          style={{
            ...(isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }),
            fontFamily: useInterFont ? "Inter" : value,
            backgroundImage: 'none',
            paddingRight: '12px',
            ...(disabled ? {} : {
              '&:focus': {
                borderColor: accentColor,
                boxShadow: `0 0 0 1px ${accentColor}`
              }
            })
          }}
          onFocus={(e) => {
            if (!disabled) {
              e.currentTarget.style.borderColor = accentColor;
              e.currentTarget.style.boxShadow = `0 0 0 1px ${accentColor}`;
            }
          }}
          onBlur={(e) => {
            if (!disabled) {
              e.currentTarget.style.borderColor = '';
              e.currentTarget.style.boxShadow = '';
            }
          }}
        >
          {fontOptions.map((font) => (
            <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
              {font.name}
            </option>
          ))}
        </select>

        {/* Next Arrow */}
        <button
          type="button"
          onClick={goToNext}
          disabled={disabled || fontOptions.length <= 1 || isTransitioning}
          className={`p-2 rounded-lg transition-all duration-200 border ${
            disabled || fontOptions.length <= 1
              ? "opacity-50 cursor-not-allowed border-transparent"
              : isDarkMode 
                ? "hover:bg-gray-800 text-gray-400 hover:text-white border-gray-700" 
                : "hover:bg-gray-100 text-gray-600 border-gray-200"
          }`}
          onMouseEnter={(e) => {
            if (!disabled && fontOptions.length > 1 && !isTransitioning) {
              e.currentTarget.style.color = accentColor;
              e.currentTarget.style.borderColor = accentColor;
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && fontOptions.length > 1 && !isTransitioning) {
              e.currentTarget.style.color = '';
              e.currentTarget.style.borderColor = '';
            }
          }}
        >
          <svg className="w-4 h-4 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {showPreview && (
        <p
          className={`text-lg italic pl-1 transition-opacity duration-150 ${
            isTransitioning ? "opacity-50" : "opacity-100"
          }`}
          style={{ 
            fontFamily: value, 
            color: accentColor, 
            opacity: disabled ? 0.5 : (isTransitioning ? 0.5 : 1)
          }}
        >
          {type === "heading" ? "A Beautiful Day" : "The quick brown fox…"}
        </p>
      )}
    </div>
  );
}

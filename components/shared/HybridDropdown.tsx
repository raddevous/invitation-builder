import { useState } from "react";

interface DropdownOption {
  name: string;
  value: string | number;
}

interface HybridDropdownProps {
  label?: string;
  value: string | number;
  onChange: (value: string | number) => void;
  options: DropdownOption[];
  showPreview?: boolean;
  isDarkMode?: boolean;
  accentColor?: string;
  disabled?: boolean;
}

export default function HybridDropdown({ 
  label, 
  value, 
  onChange, 
  options, 
  showPreview = false, 
  isDarkMode = false, 
  accentColor = "#B88A78", 
  disabled = false 
}: HybridDropdownProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentIndex = options.findIndex(option => option.value === value);

  const goToPrevious = () => {
    if (disabled || isTransitioning || options.length <= 1) return;
    setIsTransitioning(true);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
    onChange(options[prevIndex].value);
    setTimeout(() => setIsTransitioning(false), 150);
  };

  const goToNext = () => {
    if (disabled || isTransitioning || options.length <= 1) return;
    setIsTransitioning(true);
    const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
    onChange(options[nextIndex].value);
    setTimeout(() => setIsTransitioning(false), 150);
  };

  const handleDropdownChange = (newValue: string) => {
    if (disabled) return;
    onChange(newValue);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{label}</label>
      )}
      
      {/* Hybrid Control with Dropdown and Arrows */}
      <div className="flex items-center gap-2">
        {/* Previous Arrow */}
        <button
          type="button"
          onClick={goToPrevious}
          disabled={disabled || options.length <= 1 || isTransitioning}
          className={`p-2 rounded-lg transition-all duration-200 border ${
            disabled || options.length <= 1
              ? "opacity-50 cursor-not-allowed border-transparent"
              : isDarkMode 
                ? "hover:bg-gray-800 text-gray-400 hover:text-white border-gray-700" 
                : "hover:bg-gray-100 text-gray-600 border-gray-200"
          }`}
          style={{
            ...(disabled || options.length <= 1 ? {} : {
              '--hover-color': accentColor
            } as React.CSSProperties)
          }}
          onMouseEnter={(e) => {
            if (!disabled && options.length > 1 && !isTransitioning) {
              e.currentTarget.style.color = accentColor;
              e.currentTarget.style.borderColor = accentColor;
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && options.length > 1 && !isTransitioning) {
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
            fontFamily: "Inter, sans-serif",
            backgroundImage: 'none',
            paddingRight: '12px',
            '--select-accent-color': accentColor
          } as any}
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
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.name}
            </option>
          ))}
        </select>

        {/* Next Arrow */}
        <button
          type="button"
          onClick={goToNext}
          disabled={disabled || options.length <= 1 || isTransitioning}
          className={`p-2 rounded-lg transition-all duration-200 border ${
            disabled || options.length <= 1
              ? "opacity-50 cursor-not-allowed border-transparent"
              : isDarkMode 
                ? "hover:bg-gray-800 text-gray-400 hover:text-white border-gray-700" 
                : "hover:bg-gray-100 text-gray-600 border-gray-200"
          }`}
          onMouseEnter={(e) => {
            if (!disabled && options.length > 1 && !isTransitioning) {
              e.currentTarget.style.color = accentColor;
              e.currentTarget.style.borderColor = accentColor;
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && options.length > 1 && !isTransitioning) {
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
          className={`text-sm pl-1 transition-opacity duration-150 ${
            isTransitioning ? "opacity-50" : "opacity-100"
          }`}
          style={{ 
            fontFamily: "Inter, sans-serif", 
            color: accentColor, 
            opacity: disabled ? 0.5 : (isTransitioning ? 0.5 : 1)
          }}
        >
          {options[currentIndex]?.name || ""}
        </p>
      )}
    </div>
  );
}

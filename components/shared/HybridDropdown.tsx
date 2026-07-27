import { useState, useRef, useEffect } from "react";

interface DropdownOption {
  name: string;
  value: string | number;
  divider?: boolean;
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
  accentColor = "#6998EE", 
  disabled = false 
}: HybridDropdownProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectableOptions = options.filter(option => !option.divider);
  const currentIndex = selectableOptions.findIndex(option => option.value === value);
  const currentName = selectableOptions[currentIndex]?.name || "";

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const goToPrevious = () => {
    if (disabled || isTransitioning || selectableOptions.length <= 1) return;
    setIsTransitioning(true);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : selectableOptions.length - 1;
    onChange(selectableOptions[prevIndex].value);
    setTimeout(() => setIsTransitioning(false), 150);
  };

  const goToNext = () => {
    if (disabled || isTransitioning || selectableOptions.length <= 1) return;
    setIsTransitioning(true);
    const nextIndex = currentIndex < selectableOptions.length - 1 ? currentIndex + 1 : 0;
    onChange(selectableOptions[nextIndex].value);
    setTimeout(() => setIsTransitioning(false), 150);
  };

  const handleSelect = (newValue: string | number) => {
    if (disabled) return;
    onChange(newValue);
    setIsOpen(false);
  };

  return (
    <div className="relative space-y-2" ref={containerRef}>
      {label && (
        <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{label}</label>
      )}
      
      {/* Hybrid Control with Dropdown and Arrows */}
      <div className="flex items-center gap-2">
        {/* Previous Arrow */}
        <button
          type="button"
          onClick={goToPrevious}
          disabled={disabled || selectableOptions.length <= 1 || isTransitioning}
          className={`p-2 rounded-lg transition-all duration-200 border ${
            disabled || selectableOptions.length <= 1
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
            if (!disabled && selectableOptions.length > 1 && !isTransitioning) {
              e.currentTarget.style.color = accentColor;
              e.currentTarget.style.borderColor = accentColor;
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && selectableOptions.length > 1 && !isTransitioning) {
              e.currentTarget.style.color = '';
              e.currentTarget.style.borderColor = '';
            }
          }}
        >
          <svg className="w-4 h-4 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Custom Dropdown Button */}
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`w-full px-3 py-2.5 border rounded-lg text-sm cursor-pointer text-center transition-all duration-200 ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200 bg-white"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            style={{
              ...(isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }),
              fontFamily: "Inter, sans-serif",
              ...(isOpen ? {
                borderColor: accentColor,
                boxShadow: `0 0 0 1px ${accentColor}`,
              } : {}),
            }}
          >
            {currentName}
          </button>

          {/* Custom Dropdown Menu */}
          {isOpen && (
            <div
              className={`absolute left-0 right-0 top-full mt-1 z-50 rounded-lg border shadow-lg max-h-60 overflow-y-auto ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
              style={{
                ...(isDarkMode ? { backgroundColor: "#283543" } : { backgroundColor: "#E8EAEF" }),
              }}
            >
              {options.map((option) => (
                option.divider ? (
                  <div key={option.value} className="px-1 py-0">
                    <hr className={`border-t ${isDarkMode ? "border-gray-600" : "border-gray-300"}`} />
                  </div>
                ) : (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors duration-100 ${isDarkMode ? "text-gray-200 hover:bg-gray-700/60" : "text-gray-700 hover:bg-gray-200/60"} ${option.value === value ? (isDarkMode ? "bg-gray-700/50" : "bg-gray-200/50") : ""}`}
                    style={{
                      fontFamily: "Inter, sans-serif",
                      ...(option.value === value ? { color: accentColor, fontWeight: 500 } : {}),
                    }}
                  >
                    {option.name}
                  </button>
                )
              ))}
            </div>
          )}
        </div>

        {/* Next Arrow */}
        <button
          type="button"
          onClick={goToNext}
          disabled={disabled || selectableOptions.length <= 1 || isTransitioning}
          className={`p-2 rounded-lg transition-all duration-200 border ${
            disabled || selectableOptions.length <= 1
              ? "opacity-50 cursor-not-allowed border-transparent"
              : isDarkMode 
                ? "hover:bg-gray-800 text-gray-400 hover:text-white border-gray-700" 
                : "hover:bg-gray-100 text-gray-600 border-gray-200"
          }`}
          onMouseEnter={(e) => {
            if (!disabled && selectableOptions.length > 1 && !isTransitioning) {
              e.currentTarget.style.color = accentColor;
              e.currentTarget.style.borderColor = accentColor;
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && selectableOptions.length > 1 && !isTransitioning) {
              e.currentTarget.style.color = '';
              e.currentTarget.style.borderColor = '';
            }
          }}
        >
          <svg className="w-4 h-4 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7-7" />
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
          {currentName}
        </p>
      )}
    </div>
  );
}

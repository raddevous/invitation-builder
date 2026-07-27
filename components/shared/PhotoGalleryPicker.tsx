"use client";

import { useRef, useEffect } from "react";

interface PhotoGalleryPickerProps {
  galleryImages: string[];
  selectedUrl: string;
  isDarkMode: boolean;
  accentColor: string;
  desktopMode: boolean;
  panelPosition: "left" | "right";
  isClosing: boolean;
  onSelect: (url: string) => void;
  onClose: () => void;
}

export default function PhotoGalleryPicker({
  galleryImages,
  selectedUrl,
  isDarkMode,
  accentColor,
  desktopMode,
  panelPosition,
  isClosing,
  onSelect,
  onClose,
}: PhotoGalleryPickerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedRef.current && scrollContainerRef.current) {
      selectedRef.current.scrollIntoView({ block: "start", behavior: "auto" });
    }
  }, []);

  const resolvedImages = galleryImages.map((url) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("/")) return url;
    return `/stock/gallery/${url}`;
  }).filter(Boolean);

  return (
    <>
      {!isClosing && (
        <div
          className="fixed inset-0 bg-transparent z-40"
          onMouseDown={onClose}
          onWheel={onClose}
        />
      )}
      <div
        className={`fixed z-50 shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"} ${
          desktopMode
            ? `top-0 bottom-0 ${panelPosition === "left" ? "left-0 border-r" : "right-0 border-l"} ${isClosing ? (panelPosition === "left" ? "animate-slide-out-side" : "animate-slide-out-side-right") : (panelPosition === "left" ? "animate-slide-in-side" : "animate-slide-in-side-right")}`
            : `bottom-0 left-0 right-0 rounded-t-3xl ${isClosing ? "animate-slide-down" : "animate-slide-up"}`
        }`}
        style={desktopMode ? { width: "400px" } : { maxWidth: 480, margin: "0 auto", maxHeight: "50vh" }}
      >
        {!desktopMode && (
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className={`w-10 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`} />
          </div>
        )}
        <div className={`flex items-center px-5 py-2 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
          <h3
            className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-[#5c4a3a]"}`}
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Choose Photo
          </h3>
        </div>
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 pt-4 pb-10">
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => onSelect("")}
              className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                !selectedUrl
                  ? "border-[#6998EE] bg-[#fff0e8]"
                  : `${isDarkMode ? "border-gray-600 bg-gray-700 hover:border-gray-500" : "border-gray-200 bg-gray-50 hover:border-gray-300"}`
              }`}
              style={!selectedUrl ? { borderColor: accentColor, backgroundColor: `${accentColor}15` } : undefined}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isDarkMode ? "#9ca3af" : "#aaa"} strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              <span className={`text-[10px] ${isDarkMode ? "text-gray-400" : "text-gray-400"}`}>Auto</span>
            </button>
            {resolvedImages.map((url, idx) => (
              <button
                key={idx}
                ref={selectedUrl === galleryImages[idx] ? selectedRef : undefined}
                onClick={() => onSelect(galleryImages[idx])}
                className={`aspect-square rounded-2xl border-2 overflow-hidden transition-all active:scale-95 ${
                  selectedUrl === galleryImages[idx]
                    ? "ring-2 ring-[#6998EE]/30"
                    : `${isDarkMode ? "border-transparent hover:border-gray-600" : "border-transparent hover:border-gray-200"}`
                }`}
              >
                <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
            {resolvedImages.length === 0 && (
              <div className={`col-span-3 text-center py-8 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-400"}`}>
                No gallery images. Add photos in Tools &gt; Media &gt; Photo Gallery.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

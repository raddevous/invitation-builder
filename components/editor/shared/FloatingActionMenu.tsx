import { useState, useRef, useEffect } from "react";

interface FloatingActionMenuOption {
  label: string;
  icon: "plus" | "edit" | "done";
  onClick: () => void;
}

interface FloatingActionMenuProps {
  options: FloatingActionMenuOption[];
  accentColor: string;
  isDarkMode?: boolean;
}

export default function FloatingActionMenu({ options, accentColor, isDarkMode = false }: FloatingActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: TouchEvent | MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  const handleOptionClick = (option: FloatingActionMenuOption) => {
    option.onClick();
    setOpen(false);
  };

  const renderIcon = (icon: string) => {
    if (icon === "plus") {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      );
    }
    if (icon === "edit") {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      );
    }
    // done
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12l5 5 9-9" />
      </svg>
    );
  };

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {/* Options pane */}
      {open && (
        <div
          className="flex flex-col gap-1 rounded-2xl shadow-xl overflow-hidden min-w-[160px] transition-all"
          style={{
            backgroundColor: isDarkMode ? "#1C2531" : "#ffffff",
            border: `1px solid ${isDarkMode ? "#374151" : "#E5E7EB"}`,
            animation: "fam-slide-in 0.15s ease-out",
          }}
        >
          {options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionClick(option)}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-black/5"
              style={{
                color: isDarkMode ? "#E5E7EB" : "#374151",
                fontFamily: "Inter, sans-serif",
              }}
            >
              <span style={{ color: accentColor }}>{renderIcon(option.icon)}</span>
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* FAB bubble */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Menu"
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        style={{ backgroundColor: accentColor }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="transition-transform duration-200"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <style>{`
        @keyframes fam-slide-in {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

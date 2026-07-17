"use client";

import { useRef, useCallback } from "react";
import { useEditMode } from "./EditModeContext";
import type { AssetCategory } from "@/lib/types/invitation";

interface EditableZoneProps {
  field: string;
  category: AssetCategory | "gallery";
  label: string;
  index?: number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function EditableZone({
  field,
  category,
  label,
  index,
  children,
  className,
  style,
}: EditableZoneProps) {
  const { editMode, openPicker } = useEditMode();
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const startPress = useCallback(() => {
    didLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      openPicker({ field, category, label, index });
    }, 600);
  }, [field, category, label, index, openPicker]);

  const cancelPress = useCallback(() => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }, []);

  const handleClick = useCallback(() => {
    if (!didLongPress.current) {
      openPicker({ field, category, label, index });
    }
    didLongPress.current = false;
  }, [field, category, label, index, openPicker]);

  if (!editMode) {
    return children ? (
      <div className={className} style={style}>{children}</div>
    ) : null;
  }

  return (
    <div
      className={`relative group cursor-pointer select-none ${className ?? ""}`}
      style={style}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onTouchCancel={cancelPress}
      onTouchMove={cancelPress}
      onClick={handleClick}
    >
      {children}
      {/* Dashed border on hover */}
      <div className="absolute inset-0 border-2 border-dashed border-transparent group-hover:border-[#b88a78]/70 transition-colors rounded-xl pointer-events-none z-10" />
      {/* Edit button */}
      <div className="absolute top-2 right-2 bg-white/95 rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 z-20 pointer-events-none">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#b88a78" strokeWidth="2.5">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </div>
      {/* Label tooltip */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap">
        Edit {label}
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useCallback } from "react";
import type { ImageTransform } from "@/lib/types/invitation";
import type { EditField } from "@/components/invitation/EditModeContext";

const DEFAULT_TRANSFORM: ImageTransform = {
  scale: 1,
  rotation: 0,
  alignment: "center",
  objectPosition: "center",
};

interface ImagePickerSheetProps {
  editField: EditField;
  galleryImages: string[];
  currentSrc?: string;
  currentTransform?: ImageTransform;
  onSelect: (url: string) => void;
  onTransformChange: (transform: ImageTransform) => void;
  onClose: () => void;
}

export default function ImagePickerSheet({
  editField,
  galleryImages,
  currentSrc,
  currentTransform,
  onSelect,
  onTransformChange,
  onClose,
}: ImagePickerSheetProps) {
  const [tab, setTab] = useState<"images" | "adjust">("images");
  const [transform, setTransform] = useState<ImageTransform>(
    currentTransform ?? DEFAULT_TRANSFORM
  );
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleTransform = (updates: Partial<ImageTransform>) => {
    const next = { ...transform, ...updates };
    setTransform(next);
    onTransformChange(next);
  };

  return (
    <>
      {/* Backdrop */}
      {!isClosing && <div className="fixed inset-0 bg-transparent z-40" onMouseDown={handleClose} onWheel={handleClose} />}

      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col ${isClosing ? "animate-slide-down" : "animate-slide-up"}`}
        style={{ maxWidth: 480, margin: "0 auto", maxHeight: "50vh" }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center px-5 py-2 border-b border-gray-100 shrink-0">
          <h3
            className="font-semibold text-[#5c4a3a]"
            style={{ fontFamily: "Inter, sans-serif" }}
          >
            Edit {editField.label}
          </h3>
        </div>

        {/* Tabs */}
        <div className="flex px-5 pt-3 gap-5 shrink-0">
          {(["images", "adjust"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-sm pb-2 border-b-2 capitalize transition-colors ${
                tab === t
                  ? "border-[#6998EE] text-[#6998EE] font-medium"
                  : "border-transparent text-gray-400"
              }`}
            >
              {t === "images" ? "Images" : "Adjust"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10">
          {tab === "images" ? (
            <div className="grid grid-cols-3 gap-3">
              {/* None option */}
              <button
                onClick={() => onSelect("")}
                className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                  !currentSrc
                    ? "border-[#6998EE] bg-[#fff0e8]"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                <span className="text-[10px] text-gray-400">None</span>
              </button>

              {/* Gallery images */}
              {galleryImages.filter(Boolean).map((url, i) => (
                <button
                  key={`gallery-${i}`}
                  onClick={() => onSelect(url)}
                  className={`aspect-square rounded-2xl border-2 overflow-hidden transition-all active:scale-95 ${
                    currentSrc === url
                      ? "border-[#6998EE] ring-2 ring-[#6998EE]/30"
                      : "border-transparent hover:border-gray-200"
                  }`}
                >
                  <img
                    src={url}
                    alt={`Gallery ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}

              {galleryImages.filter(Boolean).length === 0 && (
                <div className="col-span-3 text-center py-8 text-gray-400 text-sm">
                  No photos available.
                  <br />
                  Add photos in Tools &gt; Media &gt; Photo Gallery.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 pt-1">
              <DragKnob
                label="Scale"
                value={transform.scale}
                min={0.5}
                max={2}
                step={0.05}
                defaultValue={1}
                displayFn={(v) => `${Math.round(v * 100)}%`}
                onChange={(v) => handleTransform({ scale: v })}
              />
              <DragKnob
                label="Rotate"
                value={transform.rotation}
                min={-180}
                max={180}
                step={1}
                defaultValue={0}
                displayFn={(v) => `${Math.round(v)}°`}
                onChange={(v) => handleTransform({ rotation: v })}
              />

              {/* Alignment */}
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">Alignment</p>
                <div className="flex gap-2">
                  {(["left", "center", "right"] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => handleTransform({ alignment: align })}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                        transform.alignment === align
                          ? "bg-[#6998EE] text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {align === "left" ? "← Left" : align === "center" ? "Center" : "Right →"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Object position */}
              <div>
                <p className="text-xs text-gray-500 font-medium mb-2">Focal Point</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {["top left", "top", "top right", "left", "center", "right", "bottom left", "bottom", "bottom right"].map(
                    (pos) => (
                      <button
                        key={pos}
                        onClick={() => handleTransform({ objectPosition: pos })}
                        className={`py-2 rounded-lg text-[11px] transition-colors capitalize ${
                          transform.objectPosition === pos
                            ? "bg-[#6998EE] text-white"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {pos}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function DragKnob({
  label,
  value,
  min,
  max,
  step,
  defaultValue,
  displayFn,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  displayFn: (v: number) => string;
  onChange: (v: number) => void;
}) {
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  const normalizedAngle = ((value - min) / (max - min)) * 270 - 135;

  const clampVal = (v: number) =>
    Math.max(min, Math.min(max, Math.round(v / step) * step));

  const onStart = useCallback(
    (clientY: number) => {
      isDragging.current = true;
      startY.current = clientY;
      startValue.current = value;
    },
    [value]
  );

  const onMove = useCallback(
    (clientY: number) => {
      if (!isDragging.current) return;
      const dy = startY.current - clientY;
      const newVal = startValue.current + (dy / 80) * (max - min);
      onChange(clampVal(newVal));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [min, max, step, onChange]
  );

  const onEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div className="flex items-center gap-4">
      {/* Knob */}
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <div
          className="w-14 h-14 rounded-full bg-gray-50 border-2 border-gray-200 relative cursor-ns-resize select-none shadow-inner active:border-[#6998EE] transition-colors"
          onMouseDown={(e) => onStart(e.clientY)}
          onMouseMove={(e) => onMove(e.clientY)}
          onMouseUp={onEnd}
          onMouseLeave={onEnd}
          onTouchStart={(e) => onStart(e.touches[0].clientY)}
          onTouchMove={(e) => { e.preventDefault(); onMove(e.touches[0].clientY); }}
          onTouchEnd={onEnd}
        >
          {/* Track arc */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 56 56">
            <circle
              cx="28" cy="28" r="22"
              fill="none"
              stroke="#6998EE"
              strokeWidth="3"
              strokeDasharray="138 200"
              strokeDashoffset="-31"
              strokeLinecap="round"
            />
          </svg>
          {/* Indicator dot */}
          <div
            className="absolute w-2.5 h-2.5 bg-[#6998EE] rounded-full shadow"
            style={{
              top: "50%",
              left: "50%",
              transformOrigin: "0 0",
              transform: `translate(-50%, -50%) rotate(${normalizedAngle}deg) translateY(-18px)`,
            }}
          />
          {/* Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-300" />
        </div>
        <span className="text-[10px] text-gray-400 font-medium" style={{ fontFamily: "Inter, sans-serif" }}>{label}</span>
      </div>

      {/* Slider + value */}
      <div className="flex-1">
        <div className="text-base font-semibold text-[#5c4a3a] mb-2" style={{ fontFamily: "Inter, sans-serif" }}>{displayFn(value)}</div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-full cursor-pointer accent-[#6998EE]"
        />
        <button
          onClick={() => onChange(defaultValue)}
          className="text-[10px] text-gray-400 mt-1.5 hover:text-[#6998EE] transition-colors"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Reset to default
        </button>
      </div>
    </div>
  );
}

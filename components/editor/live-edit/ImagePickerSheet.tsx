"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { StockAsset, AssetCategory, ImageTransform } from "@/lib/types/invitation";
import { fetchAssets } from "@/lib/utils";
import type { EditField } from "@/components/invitation/EditModeContext";

const DEFAULT_TRANSFORM: ImageTransform = {
  scale: 1,
  rotation: 0,
  alignment: "center",
  objectPosition: "center",
};

interface ImagePickerSheetProps {
  editField: EditField;
  invitationId: string;
  currentSrc?: string;
  currentTransform?: ImageTransform;
  onSelect: (url: string) => void;
  onTransformChange: (transform: ImageTransform) => void;
  onClose: () => void;
}

export default function ImagePickerSheet({
  editField,
  invitationId,
  currentSrc,
  currentTransform,
  onSelect,
  onTransformChange,
  onClose,
}: ImagePickerSheetProps) {
  const [assets, setAssets] = useState<StockAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<"images" | "adjust">("images");
  const [transform, setTransform] = useState<ImageTransform>(
    currentTransform ?? DEFAULT_TRANSFORM
  );
  const [isClosing, setIsClosing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  useEffect(() => {
    if (editField.category !== "gallery") {
      fetchAssets(editField.category as AssetCategory).then(setAssets);
    }
  }, [editField.category]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const fieldKey =
        editField.index !== undefined
          ? `${editField.field}_${editField.index}`
          : editField.field;
      fd.append("field", fieldKey);
      fd.append("invitationId", invitationId);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      onSelect(url);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
                  ? "border-[#b88a78] text-[#b88a78] font-medium"
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
              {/* Upload slot — always first */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-2xl border-2 border-dashed border-[#b88a78]/40 flex flex-col items-center justify-center gap-1.5 bg-[#fff8f3] hover:bg-[#f5e8e0] active:scale-95 transition-all"
              >
                {uploading ? (
                  <div className="w-5 h-5 border-2 border-[#b88a78] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b88a78" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span className="text-[10px] text-[#b88a78] font-semibold tracking-wide">Upload</span>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />

              {/* None option */}
              <button
                onClick={() => onSelect("")}
                className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                  !currentSrc
                    ? "border-[#b88a78] bg-[#fff0e8]"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300"
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                <span className="text-[10px] text-gray-400">None</span>
              </button>

              {/* Stock assets */}
              {assets.map((asset) => (
                <button
                  key={asset.id}
                  onClick={() => onSelect(asset.url)}
                  className={`aspect-square rounded-2xl border-2 overflow-hidden transition-all active:scale-95 ${
                    currentSrc === asset.url
                      ? "border-[#b88a78] ring-2 ring-[#b88a78]/30"
                      : "border-transparent hover:border-gray-200"
                  }`}
                >
                  <img
                    src={asset.thumbnail || asset.url}
                    alt={asset.label}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}

              {assets.length === 0 && editField.category !== "gallery" && (
                <div className="col-span-3 text-center py-8 text-gray-400 text-sm">
                  No stock images yet.
                  <br />
                  Upload your own above.
                </div>
              )}
              {editField.category === "gallery" && assets.length === 0 && (
                <div className="col-span-3 text-center py-8 text-gray-400 text-sm">
                  Upload a photo for this gallery slot.
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
                          ? "bg-[#b88a78] text-white"
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
                            ? "bg-[#b88a78] text-white"
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
          className="w-14 h-14 rounded-full bg-gray-50 border-2 border-gray-200 relative cursor-ns-resize select-none shadow-inner active:border-[#b88a78] transition-colors"
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
              stroke="#e8cfc3"
              strokeWidth="3"
              strokeDasharray="138 200"
              strokeDashoffset="-31"
              strokeLinecap="round"
            />
          </svg>
          {/* Indicator dot */}
          <div
            className="absolute w-2.5 h-2.5 bg-[#b88a78] rounded-full shadow"
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
          className="w-full h-1.5 rounded-full cursor-pointer accent-[#b88a78]"
        />
        <button
          onClick={() => onChange(defaultValue)}
          className="text-[10px] text-gray-400 mt-1.5 hover:text-[#b88a78] transition-colors"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          Reset to default
        </button>
      </div>
    </div>
  );
}

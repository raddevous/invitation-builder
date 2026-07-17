"use client";

import { useState, useRef, useCallback } from "react";
import type { InvitationData, WelcomeScreenType, WelcomeElementSettings } from "@/lib/types/invitation";
import type { AssetCategory } from "@/lib/types/invitation";
import { getScreenDef, getElement, WELCOME_SCREENS } from "@/lib/welcome-screens";
import { fetchAssets } from "@/lib/utils";
import type { StockAsset } from "@/lib/types/invitation";

interface WelcomeEditorProps {
  screenType: WelcomeScreenType;
  data: InvitationData;
  onChange: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  onBack: () => void;
}

export default function WelcomeEditor({ screenType, data, onChange, onBack }: WelcomeEditorProps) {
  const def = getScreenDef(screenType);
  const screenLabel = WELCOME_SCREENS.find((s) => s.id === screenType)?.label ?? screenType;

  const updateElement = (elementId: string, updates: Partial<WelcomeElementSettings>) => {
    const key = `${screenType}.${elementId}`;
    const current = data.welcomeElements?.[key] ?? {};
    onChange("welcomeElements", {
      ...(data.welcomeElements ?? {}),
      [key]: { ...current, ...updates },
    });
  };

  const resetElement = (elementId: string) => {
    const key = `${screenType}.${elementId}`;
    const next = { ...(data.welcomeElements ?? {}) };
    delete next[key];
    onChange("welcomeElements", next);
  };

  const resetAll = () => {
    const keys = def.elements.map((e) => `${screenType}.${e.id}`);
    const next = { ...(data.welcomeElements ?? {}) };
    keys.forEach((k) => delete next[k]);
    onChange("welcomeElements", next);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white shrink-0">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div>
          <h2 className="text-sm font-semibold text-[#5c4a3a]" style={{ fontFamily: "Playfair Display, serif" }}>
            {screenLabel}
          </h2>
          <p className="text-[11px] text-gray-400">Edit elements</p>
        </div>
      </div>

      {/* Elements list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {def.elements.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No editable elements for this screen.</p>
        )}

        {def.elements.map((elDef) => {
          const settings = getElement(screenType, elDef.id, data.welcomeElements, elDef);
          return (
            <ElementControl
              key={elDef.id}
              label={elDef.label}
              type={elDef.type}
              category={elDef.category}
              settings={settings}
              constraints={elDef.constraints}
              invitationId={data.coupleName}
              onChange={(updates) => updateElement(elDef.id, updates)}
              onReset={() => resetElement(elDef.id)}
            />
          );
        })}

        {def.elements.length > 0 && (
          <button
            onClick={resetAll}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Reset All to Default
          </button>
        )}
      </div>
    </div>
  );
}

interface ElementControlProps {
  label: string;
  type: "image" | "text";
  category?: AssetCategory;
  settings: Required<Omit<WelcomeElementSettings, "src">> & { src: string };
  constraints: { minScale: number; maxScale: number; minRotation: number; maxRotation: number };
  invitationId: string;
  onChange: (updates: Partial<WelcomeElementSettings>) => void;
  onReset: () => void;
}

function ElementControl({ label, type, category, settings, constraints, onChange, onReset }: ElementControlProps) {
  const [assets, setAssets] = useState<StockAsset[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);

  const openPicker = async () => {
    if (category && !showPicker) {
      setLoadingAssets(true);
      const a = await fetchAssets(category);
      setAssets(a);
      setLoadingAssets(false);
    }
    setShowPicker((v) => !v);
  };

  return (
    <div className="bg-gray-50 rounded-2xl p-4 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#5c4a3a]">{label}</span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <span className="text-xs text-gray-500">Visible</span>
            <div
              onClick={() => onChange({ visible: !settings.visible })}
              className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                settings.visible ? "bg-[#b88a78]" : "bg-gray-200"
              }`}
            >
              <div className="absolute inset-0 flex items-center px-0.5">
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                  settings.visible ? "translate-x-4" : "translate-x-0"
                }`} />
              </div>
            </div>
          </label>
          <button onClick={onReset} className="text-[10px] text-gray-400 hover:text-[#b88a78] transition-colors">
            Reset
          </button>
        </div>
      </div>

      {settings.visible && (
        <>
          {/* Image picker */}
          {type === "image" && category && (
            <div>
              <button
                onClick={openPicker}
                className="flex items-center gap-2 text-xs text-[#b88a78] border border-[#e8cfc3] rounded-xl px-3 py-2 hover:bg-[#fff8f3] transition-colors"
              >
                {settings.src ? (
                  <img src={settings.src} alt="" className="w-6 h-6 object-contain rounded" />
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                )}
                {settings.src ? "Change Image" : "Choose Image"}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={showPicker ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
                </svg>
              </button>

              {showPicker && (
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {/* None option */}
                  <button
                    onClick={() => { onChange({ src: "" }); setShowPicker(false); }}
                    className={`aspect-square rounded-xl border-2 flex items-center justify-center transition-all ${
                      !settings.src ? "border-[#b88a78] bg-[#fff0e8]" : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>

                  {loadingAssets && (
                    <div className="col-span-3 flex items-center justify-center py-2">
                      <div className="w-4 h-4 border-2 border-[#b88a78] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {assets.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => { onChange({ src: a.url }); setShowPicker(false); }}
                      className={`aspect-square rounded-xl border-2 overflow-hidden transition-all ${
                        settings.src === a.url ? "border-[#b88a78]" : "border-transparent hover:border-gray-200"
                      }`}
                    >
                      <img src={a.thumbnail || a.url} alt={a.label} className="w-full h-full object-cover" />
                    </button>
                  ))}

                  {!loadingAssets && assets.length === 0 && (
                    <p className="col-span-3 text-[10px] text-gray-400 py-2">No stock images available yet.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Text editor */}
          {type === "text" && (
            <div>
              <label className="text-[11px] text-gray-500 font-medium block mb-1">Text</label>
              <input
                type="text"
                value={settings.text ?? ""}
                onChange={(e) => onChange({ text: e.target.value })}
                className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2 focus:outline-none focus:border-[#b88a78] bg-white"
              />
            </div>
          )}

          {/* Scale slider */}
          <SliderControl
            label="Size"
            value={settings.scale}
            min={constraints.minScale}
            max={constraints.maxScale}
            step={0.05}
            defaultValue={1}
            displayFn={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => onChange({ scale: v })}
          />

          {/* Rotation slider */}
          {constraints.maxRotation !== 0 && (
            <SliderControl
              label="Rotation"
              value={settings.rotation}
              min={constraints.minRotation}
              max={constraints.maxRotation}
              step={1}
              defaultValue={0}
              displayFn={(v) => `${Math.round(v)}°`}
              onChange={(v) => onChange({ rotation: v })}
            />
          )}

          {/* Z-index */}
          <SliderControl
            label="Layer (z-index)"
            value={settings.zIndex}
            min={1}
            max={10}
            step={1}
            defaultValue={1}
            displayFn={(v) => `Layer ${Math.round(v)}`}
            onChange={(v) => onChange({ zIndex: v })}
          />

          {/* Alignment */}
          <div>
            <label className="text-[11px] text-gray-500 font-medium block mb-2">Alignment</label>
            <div className="flex gap-2">
              {(["left", "center", "right"] as const).map((align) => (
                <button
                  key={align}
                  onClick={() => onChange({ alignment: align })}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${
                    settings.alignment === align
                      ? "bg-[#b88a78] text-white"
                      : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {align === "left" ? "← L" : align === "center" ? "C" : "R →"}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SliderControl({
  label, value, min, max, step, defaultValue, displayFn, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number;
  defaultValue: number; displayFn: (v: number) => string; onChange: (v: number) => void;
}) {
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startVal = useRef(0);
  const clamp = (v: number) => Math.max(min, Math.min(max, Math.round(v / step) * step));

  const onStart = useCallback((y: number) => {
    isDragging.current = true; startY.current = y; startVal.current = value;
  }, [value]);
  const onMove = useCallback((y: number) => {
    if (!isDragging.current) return;
    onChange(clamp(startVal.current + ((startY.current - y) / 80) * (max - min)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, step, onChange]);
  const onEnd = useCallback(() => { isDragging.current = false; }, []);

  const normalizedAngle = ((value - min) / (max - min)) * 270 - 135;

  return (
    <div className="flex items-center gap-3">
      {/* Drag knob */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <div
          className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 relative cursor-ns-resize shadow-sm"
          onMouseDown={(e) => onStart(e.clientY)}
          onMouseMove={(e) => onMove(e.clientY)}
          onMouseUp={onEnd}
          onMouseLeave={onEnd}
          onTouchStart={(e) => onStart(e.touches[0].clientY)}
          onTouchMove={(e) => { e.preventDefault(); onMove(e.touches[0].clientY); }}
          onTouchEnd={onEnd}
        >
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="18" fill="none" stroke="#e8cfc3" strokeWidth="2.5"
              strokeDasharray="113 200" strokeDashoffset="-28" strokeLinecap="round" />
          </svg>
          <div
            className="absolute w-2 h-2 bg-[#b88a78] rounded-full"
            style={{
              top: "50%", left: "50%",
              transformOrigin: "0 0",
              transform: `translate(-50%,-50%) rotate(${normalizedAngle}deg) translateY(-15px)`,
            }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gray-300" />
        </div>
        <span className="text-[9px] text-gray-400">{label}</span>
      </div>

      {/* Range + value */}
      <div className="flex-1">
        <div className="text-xs font-semibold text-[#5c4a3a] mb-1">{displayFn(value)}</div>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-full cursor-pointer accent-[#b88a78]"
        />
        <button onClick={() => onChange(defaultValue)} className="text-[10px] text-gray-400 mt-1 hover:text-[#b88a78] transition-colors">
          Reset
        </button>
      </div>
    </div>
  );
}

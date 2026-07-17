"use client";

import { useEffect, useState } from "react";
import type { StockAsset, AssetCategory } from "@/lib/types/invitation";
import { fetchAssets } from "@/lib/utils";

interface AssetPickerProps {
  label: string;
  category: AssetCategory;
  value: string;
  onChange: (id: string) => void;
  allowNone?: boolean;
  accentColor?: string;
}

export default function AssetPicker({
  label,
  category,
  value,
  onChange,
  allowNone = false,
  accentColor = "#B88A78",
}: AssetPickerProps) {
  const [assets, setAssets] = useState<StockAsset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssets(category).then((a) => {
      setAssets(a);
      setLoading(false);
    });
  }, [category]);

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-xs tracking-wide uppercase text-gray-500">{label}</label>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs tracking-wide uppercase text-gray-500">{label}</label>
      {assets.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No assets available yet</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {allowNone && (
            <button
              type="button"
              onClick={() => onChange("")}
              className={`aspect-square rounded-xl border-2 flex items-center justify-center text-xs text-gray-400 transition-all ${
                value === "" ? "border-rose-400 bg-rose-50" : "border-gray-200"
              }`}
            >
              None
            </button>
          )}
          {assets.map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => onChange(asset.id)}
              className={`aspect-square rounded-xl border-2 overflow-hidden transition-all active:scale-95 relative ${
                value === asset.id
                  ? "border-[#b88a78] shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={{ borderColor: value === asset.id ? accentColor : undefined }}
              title={asset.label}
            >
              {asset.thumbnail ? (
                <img
                  src={asset.thumbnail}
                  alt={asset.label}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-xs text-gray-400 text-center px-1">{asset.label}</span>
                </div>
              )}
              {value === asset.id && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: accentColor }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="white">
                    <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="3" fill="none" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

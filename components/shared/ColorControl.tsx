interface ColorControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isDarkMode?: boolean;
  accentColor?: string;
  disabled?: boolean;
  predefinedColors?: string[];
}

const PRESETS = [
  "#1A2B55", // Deep Navy
  "#5884AB", // Soft Blue
  "#E8B4B8", // Blush Pink
  "#9CAF88", // Sage Green
  "#8E9AAF", // Dusty Blue
  "#D8BFD8", // Lavender (Lilac)
  "#1E3A5F", // Navy Blue
  "#722F37", // Deep Burgundy (Merlot)
  "#046307", // Emerald Green
  "#6A0DAD", // Plum (Deep Violet)
  "#E2725B", // Terracotta
  "#8B8589", // Taupe (Warm Gray)
  "#F7E7CE", // Champagne
  "#D4AF37", // Warm Gold
];

export default function ColorControl({ label, value, onChange, isDarkMode = false, accentColor = "#B88A78", disabled = false, predefinedColors }: ColorControlProps) {
  const presets = predefinedColors && predefinedColors.length > 0 ? predefinedColors : PRESETS;
  return (
    <div className="space-y-2">
      <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={`w-10 h-10 rounded-lg border cursor-pointer p-0.5 ${isDarkMode ? "border-gray-700" : "border-gray-200"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            let color = e.target.value.trim();
            // Add # if not present and it's a valid hex code
            if (color && !color.startsWith('#') && /^[0-9A-Fa-f]{6}$/.test(color)) {
              color = '#' + color;
            }
            onChange(color);
          }}
          disabled={disabled}
          className={`flex-1 px-3 py-2 text-sm border rounded-lg font-mono ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          style={isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }}
          placeholder="#000000"
          maxLength={7}
        />
      </div>
      <div className="flex flex-wrap gap-1.5 pt-1 justify-start">
        {presets.map((preset, index) => (
          <button
            key={`${preset}-${index}`}
            type="button"
            onClick={() => onChange(preset)}
            disabled={disabled}
            className={`w-7 h-7 rounded-full border-2 transition-all active:scale-90 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            style={{
              backgroundColor: preset,
              borderColor: value === preset ? accentColor : "transparent",
              boxShadow: value === preset ? `0 0 0 1px ${accentColor}` : "0 1px 3px rgba(0,0,0,0.15)",
            }}
            title={preset}
          />
        ))}
      </div>
    </div>
  );
}

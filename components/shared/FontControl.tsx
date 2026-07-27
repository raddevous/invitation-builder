interface FontControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const HEADING_FONTS = [
  "Playfair Display",
  "Cormorant Garamond",
  "Great Vibes",
  "Cinzel",
  "Libre Baskerville",
  "EB Garamond",
  "Railway",
];

const BODY_FONTS = [
  "Inter",
  "Cormorant Garamond",
  "Playfair Display",
  "Lato",
  "Montserrat",
  "Source Serif 4",
  "Raleway",
];

interface FontOption {
  name: string;
  value: string;
}

interface FontControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "heading" | "body";
  showPreview?: boolean;
  isDarkMode?: boolean;
  accentColor?: string;
  disabled?: boolean;
  predefinedFonts?: string[] | FontOption[];
}

export default function FontControl({ label, value, onChange, type = "body", showPreview = true, isDarkMode = false, accentColor = "#6998EE", disabled = false, predefinedFonts }: FontControlProps) {
  // Convert predefined fonts to FontOption format if needed
  const fontOptions: FontOption[] = predefinedFonts && predefinedFonts.length > 0 
    ? (typeof predefinedFonts[0] === 'string' 
        ? (predefinedFonts as string[]).map(font => ({ name: font, value: font }))
        : predefinedFonts as FontOption[])
    : (type === "heading" 
        ? HEADING_FONTS.map(font => ({ name: font, value: font }))
        : BODY_FONTS.map(font => ({ name: font, value: font })));

  // Filter out custom font options if they shouldn't be shown
  const filteredFontOptions = fontOptions.filter(font => {
    if (font.value === "custom-heading-font" || font.value === "custom-body-font") {
      // Only show custom font option if it's the current value
      return value === font.value;
    }
    return true;
  });

  // Get the actual font family to use for preview
  const getFontFamily = (fontValue: string) => {
    if (fontValue === "custom-heading-font") {
      return "'CustomHeadingFont', 'Inter', sans-serif";
    }
    if (fontValue === "custom-body-font") {
      return "'CustomBodyFont', 'Inter', sans-serif";
    }
    return fontValue;
  };

  return (
    <div className="space-y-2">
      <label className={`block text-xs tracking-wide uppercase ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full px-3 py-2.5 pr-9 border rounded-lg text-sm appearance-none cursor-pointer ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200 bg-white"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          style={{
            ...(isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }),
            fontFamily: getFontFamily(value)
          }}
        >
          {filteredFontOptions.map((font) => (
            <option key={font.value} value={font.value} style={{ fontFamily: getFontFamily(font.value) }}>
              {font.name}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isDarkMode ? "#9ca3af" : "#6b7280"}
          strokeWidth="2.5"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      {showPreview && (
        <p
          className="text-lg italic pl-1"
          style={{ fontFamily: getFontFamily(value), color: accentColor, opacity: disabled ? 0.5 : 1 }}
        >
          {type === "heading" ? "A Beautiful Day" : "The quick brown fox…"}
        </p>
      )}
    </div>
  );
}

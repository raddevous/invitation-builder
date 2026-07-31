interface ProgressBarProps {
  percentage: number;
  label: string;
  icon: string;
  accentColor: string;
  isDarkMode?: boolean;
  onClick?: () => void;
}

export default function ProgressBar({ percentage, label, icon, accentColor, isDarkMode = false, onClick }: ProgressBarProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <button
      onClick={onClick}
      className="w-full flex flex-col gap-1 group"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className="flex items-center gap-2 bg-transparent">
        <div className="flex flex-col items-center gap-0.5 shrink-0 w-12">
          <div className="w-5 h-5" style={{
            backgroundColor: accentColor,
            WebkitMaskImage: `url(${icon})`,
            WebkitMaskSize: "contain",
            WebkitMaskPosition: "center",
            WebkitMaskRepeat: "no-repeat",
            maskImage: `url(${icon})`,
            maskSize: "contain",
            maskPosition: "center",
            maskRepeat: "no-repeat"
          }} />
          <p className={`text-[10px] font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`} style={{ fontFamily: "Inter, sans-serif" }}>
            {label}
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <div className={`rounded-full overflow-hidden p-[1px] ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} style={{ height: 10 }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-in-out"
              style={{ width: `${clampedPercentage}%`, backgroundColor: accentColor }}
            />
          </div>
        </div>
        <span className={`text-xs font-medium shrink-0 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`} style={{ fontFamily: "Inter, sans-serif" }}>
          {clampedPercentage}%
        </span>
      </div>
    </button>
  );
}

interface ProgressCircleProps {
  percentage: number;
  label?: string;
  sublabel?: string;
  accentColor: string;
  isDarkMode?: boolean;
  onClick?: () => void;
  size?: "default" | "compact";
}

export default function ProgressCircle({ percentage, label, sublabel, accentColor, isDarkMode = false, onClick, size = "default" }: ProgressCircleProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const isCompact = size === "compact";
  const dimension = isCompact ? 48 : 58;
  const radius = isCompact ? 19 : 24;
  const trackStrokeWidth = 6;
  const fillStrokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - clampedPercentage / 100);

  const content = (
    <>
      <div className={`relative shrink-0`} style={{ width: dimension, height: dimension }}>
        <svg className="transform -rotate-90" style={{ width: dimension, height: dimension }}>
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            className={isDarkMode ? "stroke-gray-700" : "stroke-gray-200"}
            strokeWidth={trackStrokeWidth}
          />
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke={accentColor}
            strokeWidth={fillStrokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center font-medium ${isCompact ? "text-[10px]" : "text-xs"} ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {clampedPercentage}%
        </span>
      </div>
      {!isCompact && (
        <div className="text-center">
          {label && (
            <p className={`text-xs font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
              {label}
            </p>
          )}
          {sublabel && (
            <p className={`text-[10px] ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
              {sublabel}
            </p>
          )}
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`flex ${isCompact ? "" : "flex-col items-center gap-1.5"} group`}
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`flex ${isCompact ? "pointer-events-none" : "flex-col items-center gap-1.5"} group`} style={{ fontFamily: "Inter, sans-serif" }}>
      {content}
    </div>
  );
}

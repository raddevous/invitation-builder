interface GaugeSegment {
  label: string;
  percentage: number;
  weight: number;
  color?: string;
  onClick?: () => void;
  filled?: number;
  total?: number;
}

interface HalfCircleGaugeProps {
  segments: GaugeSegment[];
  overallPercentage: number;
  accentColor: string;
  isDarkMode?: boolean;
  centerLabel?: string;
  onDesignWebsite?: () => void;
  showNumbers?: boolean;
  onToggleNumbers?: () => void;
}

// Well-tested polar-to-cartesian + arc path helpers.
// angle: 0 = top, 90 = right, 180 = bottom, -90/270 = left (clockwise positive)
function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + r * Math.cos(angleInRadians),
    y: cy + r * Math.sin(angleInRadians),
  };
}

// Creates a filled donut slice (wedge with inner radius cutout)
function describeDonutSlice(cx: number, cy: number, innerR: number, outerR: number, startAngle: number, endAngle: number) {
  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return [
    "M", outerStart.x, outerStart.y,
    "A", outerR, outerR, 0, largeArcFlag, 1, outerEnd.x, outerEnd.y,
    "L", innerEnd.x, innerEnd.y,
    "A", innerR, innerR, 0, largeArcFlag, 0, innerStart.x, innerStart.y,
    "Z",
  ].join(" ");
}

const PROGRESS_COMMENTS: Record<number, string> = {
  0: "Let's get started",
  5: "First steps",
  10: "Taking shape",
  15: "Building momentum",
  20: "On your way",
  25: "Quarter done",
  30: "Coming together",
  35: "Good progress",
  40: "Almost halfway",
  45: "Nearly there",
  50: "Halfway there",
  55: "Past halfway",
  60: "Over the hump",
  65: "Looking lovely",
  70: "Beautiful progress",
  75: "Wrapping up",
  80: "Almost done",
  85: "So close",
  90: "Final touches",
  95: "Nearly complete",
  100: "Ready to celebrate!",
};

function getProgressComment(percentage: number): string {
  const tier = Math.floor(percentage / 5) * 5;
  return PROGRESS_COMMENTS[tier] || PROGRESS_COMMENTS[0];
}

export default function HalfCircleGauge({
  segments,
  overallPercentage,
  accentColor,
  isDarkMode = false,
  centerLabel = "Overall",
  onDesignWebsite,
  showNumbers = false,
  onToggleNumbers,
}: HalfCircleGaugeProps) {
  const clampedOverall = Math.min(100, Math.max(0, overallPercentage));

  const totalFilled = segments.reduce((sum, s) => sum + (s.filled ?? 0), 0);
  const totalMax = segments.reduce((sum, s) => sum + (s.total ?? 0), 0);

  const width = 250;
  const height = 140;
  const cx = width / 2;
  const cy = height - 10;
  const outerRadius = 120;
  const innerRadius = 72;

  const allComplete = segments.length > 0 && segments.every(s => s.percentage >= 100);
  const gapDegrees = 0;
  const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0) || 1;
  const availableDegrees = 180 - gapDegrees * Math.max(0, segments.length - 1);

  let cursor = -90;
  const computedSegments = segments.map((seg) => {
    const segDegrees = (seg.weight / totalWeight) * availableDegrees;
    const startAngle = cursor;
    const endAngle = cursor + segDegrees;
    const fillPct = Math.min(100, Math.max(0, seg.percentage));
    const fillEndAngle = startAngle + (segDegrees * fillPct) / 100;
    cursor = endAngle + gapDegrees;
    return { ...seg, startAngle, endAngle, fillEndAngle };
  });

  return (
    <div className="flex flex-col items-center w-full" style={{ fontFamily: "Inter, sans-serif" }}>
      <button
        onClick={() => onToggleNumbers?.()}
        className={`mb-2 px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wide transition-colors ${isDarkMode ? "bg-[#1e2a3a] text-gray-400 hover:text-gray-200" : "bg-gray-100 text-gray-500 hover:text-gray-700"}`}
        style={{ fontFamily: "Inter, sans-serif" }}
      >
        {showNumbers ? "WEBSITE PROGRESS (#)" : "WEBSITE PROGRESS (%)"}
      </button>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-[85%]" preserveAspectRatio="xMidYMid meet">
        {computedSegments.map((seg, i) => (
          <path
            key={`track-${i}`}
            d={describeDonutSlice(cx, cy, innerRadius, outerRadius, seg.startAngle, seg.endAngle)}
            fill={isDarkMode ? "#1e2a3a" : "#f3f4f6"}
            stroke={isDarkMode ? "#1e2a3a" : "#f3f4f6"}
            strokeWidth={4}
          />
        ))}
        {computedSegments.map((seg, i) => (
          seg.fillEndAngle > seg.startAngle && (
            <path
              key={`fill-${i}`}
              d={describeDonutSlice(cx, cy, innerRadius, outerRadius, seg.startAngle, seg.fillEndAngle)}
              fill={seg.color || accentColor}
              stroke={seg.color || accentColor}
              strokeWidth={4}
              strokeLinejoin="round"
              style={{ transition: "d 0.5s ease-in-out" }}
            />
          )
        ))}
      </svg>
      <div className="flex flex-col items-center -mt-14">
        <p className={`text-xl font-semibold ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
          {showNumbers ? `${totalFilled}/${totalMax}` : `${clampedOverall}%`}
        </p>
        <p className={`text-[9px] font-medium uppercase tracking-wide mt-1.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          {getProgressComment(clampedOverall)}
        </p>
      </div>
      <div className="flex flex-col gap-1.5 mt-5 w-[85%]">
        {segments.map((seg, i) => (
          <div
            key={i}
            onClick={seg.onClick}
            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-opacity hover:opacity-80 ${isDarkMode ? "bg-[#1e2a3a]" : "bg-gray-50"}`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color || accentColor }} />
              <span className={`text-[11px] ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                {seg.label}
              </span>
            </div>
            <span className={`text-[11px] font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
              {showNumbers ? `${seg.filled ?? 0}/${seg.total ?? 0}` : `${seg.percentage}%`}
            </span>
          </div>
        ))}
      </div>
      {onDesignWebsite && (
        <button
          onClick={onDesignWebsite}
          className="w-[85%] mt-3 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
          style={{
            backgroundColor: accentColor,
            color: "#fff",
            fontFamily: "Inter, sans-serif",
          }}
        >
          Design Your Website
        </button>
      )}
      {clampedOverall >= 95 && (
        <p className={`text-[10px] text-center mt-3 w-[85%] leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Love your design? Share your invite link now!
        </p>
      )}
    </div>
  );
}

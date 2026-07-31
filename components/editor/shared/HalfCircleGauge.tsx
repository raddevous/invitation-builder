interface GaugeSegment {
  label: string;
  percentage: number;
  weight: number;
  color?: string;
  onClick?: () => void;
}

interface HalfCircleGaugeProps {
  segments: GaugeSegment[];
  overallPercentage: number;
  accentColor: string;
  isDarkMode?: boolean;
  centerLabel?: string;
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

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return ["M", start.x, start.y, "A", r, r, 0, largeArcFlag, 0, end.x, end.y].join(" ");
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
}: HalfCircleGaugeProps) {
  const clampedOverall = Math.min(100, Math.max(0, overallPercentage));

  const width = 280;
  const height = 155;
  const cx = width / 2;
  const cy = height - 12;
  const radius = 123;
  const trackStrokeWidth = 16;
  const fillStrokeWidth = 12;

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
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
        {computedSegments.map((seg, i) => (
          <path
            key={`track-${i}`}
            d={describeArc(cx, cy, radius, seg.startAngle, seg.endAngle)}
            fill="none"
            className={isDarkMode ? "stroke-gray-700" : "stroke-gray-200"}
            strokeWidth={trackStrokeWidth}
            strokeLinecap="round"
          />
        ))}
        {computedSegments.map((seg, i) => (
          seg.fillEndAngle > seg.startAngle && (
            <path
              key={`fill-${i}`}
              d={describeArc(cx, cy, radius, seg.startAngle, seg.fillEndAngle)}
              fill="none"
              stroke={seg.color || accentColor}
              strokeWidth={fillStrokeWidth}
              strokeLinecap="round"
              style={{ transition: "d 0.5s ease-in-out" }}
            />
          )
        ))}
      </svg>
      <div className="flex flex-col items-center -mt-16">
        <p className={`text-xl font-semibold ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
          {clampedOverall}%
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
            className={`flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer transition-opacity hover:opacity-80 ${isDarkMode ? "bg-[#1e2a3a]" : "bg-gray-50"}`}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color || accentColor }} />
              <span className={`text-[11px] ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                {seg.label}
              </span>
            </div>
            <span className={`text-[11px] font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
              {seg.percentage}%
            </span>
          </div>
        ))}
      </div>
      {clampedOverall >= 95 && (
        <p className={`text-[10px] text-center mt-3 w-[85%] leading-relaxed ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
          Love your design? Share your invite link now!
        </p>
      )}
    </div>
  );
}

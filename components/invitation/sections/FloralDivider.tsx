interface FloralDividerProps {
  color?: string;
  className?: string;
}

export default function FloralDivider({ color = "#b88a78", className = "" }: FloralDividerProps) {
  return (
    <div className={`flex items-center justify-center gap-3 py-4 ${className}`}>
      <div className="flex-1 h-px" style={{ backgroundColor: color, opacity: 0.25 }} />
      <svg width="60" height="20" viewBox="0 0 60 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 10 C26 6 18 4 14 8 C10 12 14 18 18 16 C22 14 24 10 30 10" fill={color} opacity="0.6" />
        <path d="M30 10 C34 6 42 4 46 8 C50 12 46 18 42 16 C38 14 36 10 30 10" fill={color} opacity="0.6" />
        <circle cx="30" cy="10" r="2.5" fill={color} opacity="0.8" />
        <circle cx="30" cy="10" r="1.2" fill={color} />
        <circle cx="14" cy="8" r="1.5" fill={color} opacity="0.5" />
        <circle cx="46" cy="8" r="1.5" fill={color} opacity="0.5" />
      </svg>
      <div className="flex-1 h-px" style={{ backgroundColor: color, opacity: 0.25 }} />
    </div>
  );
}

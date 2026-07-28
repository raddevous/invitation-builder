interface FloatingAddButtonProps {
  onClick: () => void;
  accentColor: string;
  label?: string;
}

export default function FloatingAddButton({ onClick, accentColor, label = "Add" }: FloatingAddButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
      style={{ backgroundColor: accentColor }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  );
}

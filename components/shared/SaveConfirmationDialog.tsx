import { useEffect, useState, useRef } from "react";

interface SaveConfirmationDialogProps {
  isOpen: boolean;
  pendingChangesCount: number;
  isDarkMode?: boolean;
  accentColor?: string;
  onSave: () => void;
  onDiscard: () => void;
  onClose: () => void;
}

const HOLD_DURATION = 1500; // 1.5 seconds to confirm discard

export default function SaveConfirmationDialog({
  isOpen,
  pendingChangesCount,
  isDarkMode = false,
  accentColor = "#6998EE",
  onSave,
  onDiscard,
  onClose,
}: SaveConfirmationDialogProps) {
  const [discardProgress, setDiscardProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [showDiscardToast, setShowDiscardToast] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(0);
  const discardTriggered = useRef(false);
  const discardToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelHold = () => {
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
    setIsHolding(false);
    setDiscardProgress(0);
  };

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Reset hold state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      cancelHold();
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimer.current) clearInterval(holdTimer.current);
      if (discardToastTimer.current) clearTimeout(discardToastTimer.current);
    };
  }, []);

  if (!isOpen && !showDiscardToast) return null;

  if (!isOpen) {
    return (
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
        style={{ animation: "media-drag-toast-in 0.2s ease-out" }}
      >
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/80 backdrop-blur-sm shadow-lg">
          <span className="text-white text-sm font-medium" style={{ fontFamily: "Inter, sans-serif" }}>
            Reverted unsaved change{pendingChangesCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    onSave();
    onClose();
  };

  const startHold = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    discardTriggered.current = false;
    setIsHolding(true);
    startTime.current = Date.now();
    setDiscardProgress(0);

    holdTimer.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const progress = Math.min(elapsed / HOLD_DURATION, 1);
      setDiscardProgress(progress);

      if (progress >= 1) {
        discardTriggered.current = true;
        if (holdTimer.current) {
          clearInterval(holdTimer.current);
          holdTimer.current = null;
        }
        setShowDiscardToast(true);
        if (discardToastTimer.current) clearTimeout(discardToastTimer.current);
        discardToastTimer.current = setTimeout(() => setShowDiscardToast(false), 2500);
        onDiscard();
        onClose();
      }
    }, 16);
  };

  const endHold = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    if (discardTriggered.current) return;
    cancelHold();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div
        className={`rounded-2xl shadow-2xl w-80 overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold text-center" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#e5e5e5" : "#5c4a3a" }}>
            Save Changes
          </h2>
        </div>
        <div className="px-4 pb-4">
          <p className="text-sm text-center" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#e5e5e5" : "#5c4a3a" }}>
            You have {pendingChangesCount} pending change{pendingChangesCount === 1 ? "" : "s"}. Save now?
          </p>
        </div>
        <div className="p-4">
          <div className="flex gap-2">
            <button
              onPointerDown={startHold}
              onPointerUp={endHold}
              onPointerLeave={endHold}
              onPointerCancel={endHold}
              onContextMenu={(e) => e.preventDefault()}
              className={`relative flex-1 py-2 rounded-lg text-sm font-medium overflow-hidden select-none ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"}`}
              style={{ fontFamily: "Inter, sans-serif", touchAction: "none" }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-lg"
                style={{
                  backgroundColor: "#ef4444",
                  width: `${discardProgress * 100}%`,
                  transition: isHolding ? "none" : "width 0.2s ease-out",
                }}
              />
              <span className="relative z-10">Discard</span>
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ fontFamily: "Inter, sans-serif", backgroundColor: accentColor }}
            >
              Save Change{pendingChangesCount === 1 ? "" : "s"}
            </button>
          </div>
          <p className="text-xs text-center mt-2" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#6b7280" : "#9ca3af" }}>
            Hold discard to confirm
          </p>
        </div>
      </div>
    </div>
  );
}

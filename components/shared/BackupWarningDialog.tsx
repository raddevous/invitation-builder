import { useEffect } from "react";

interface BackupWarningDialogProps {
  isOpen: boolean;
  lastBackupDate: string;
  isDarkMode?: boolean;
  accentColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function BackupWarningDialog({
  isOpen,
  lastBackupDate,
  isDarkMode = false,
  accentColor = "#B88A78",
  onConfirm,
  onCancel,
}: BackupWarningDialogProps) {
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

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const formattedDate = new Date(lastBackupDate).toLocaleDateString();
  const formattedTime = new Date(lastBackupDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div
        className={`rounded-2xl shadow-2xl w-80 overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
          <h2 className="text-lg font-semibold text-center" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#e5e5e5" : "#5c4a3a" }}>
            Overwrite Backup?
          </h2>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-center" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#e5e5e5" : "#5c4a3a" }}>
            Last backup: {formattedDate} at {formattedTime}
          </p>
          <p className="text-xs text-center" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#9ca3af" : "#6b7280" }}>
            Make sure you're on the right device before overwriting.
          </p>
        </div>
        <div className={`p-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ fontFamily: "Inter, sans-serif", backgroundColor: accentColor }}
            >
              Overwrite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

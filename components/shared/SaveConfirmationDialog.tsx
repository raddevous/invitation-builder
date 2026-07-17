import { useEffect } from "react";

interface SaveConfirmationDialogProps {
  isOpen: boolean;
  pendingChangesCount: number;
  isDarkMode?: boolean;
  accentColor?: string;
  hideSaveConfirmationDialog?: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onClose: () => void;
  onHideSaveConfirmationDialogChange: (value: boolean) => void;
}

export default function SaveConfirmationDialog({
  isOpen,
  pendingChangesCount,
  isDarkMode = false,
  accentColor = "#B88A78",
  hideSaveConfirmationDialog = false,
  onSave,
  onDiscard,
  onClose,
  onHideSaveConfirmationDialogChange,
}: SaveConfirmationDialogProps) {
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

  const handleSave = () => {
    onSave();
    onClose();
  };

  const handleDiscard = () => {
    onDiscard();
    onClose();
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
        <div className={`p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
          <h2 className="text-lg font-semibold text-center" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#e5e5e5" : "#5c4a3a" }}>
            Save Changes
          </h2>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-center" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#e5e5e5" : "#5c4a3a" }}>
            You have {pendingChangesCount} pending change{pendingChangesCount === 1 ? "" : "s"}. Save now?
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hideSaveConfirmationDialog}
              onChange={(e) => onHideSaveConfirmationDialogChange(e.target.checked)}
              className="w-4 h-4 rounded"
              style={{ accentColor }}
            />
            <span className="text-sm" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#e5e5e5" : "#5c4a3a" }}>
              Always choose Save
            </span>
          </label>
        </div>
        <div className={`p-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
          <div className="flex gap-2">
            <button
              onClick={handleDiscard}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ fontFamily: "Inter, sans-serif", backgroundColor: accentColor }}
            >
              Save Change{pendingChangesCount === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

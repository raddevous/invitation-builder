import type { InvitationData } from "@/lib/types/invitation";
import { useState, useEffect } from "react";
import BackupWarningDialog from "@/components/shared/BackupWarningDialog";
import ImportWarningDialog from "@/components/shared/ImportWarningDialog";

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface SettingsEditorProps {
  data: InvitationData;
  onChange: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  isDarkMode?: boolean;
  accentColor?: string;
  onClose: () => void;
  onSettingsChange?: (settings: { isDarkMode: boolean; accentColor: string; hideSaveConfirmationDialog?: boolean; hideInstructions?: boolean; showScreenDimensions?: boolean }) => void;
  hideSaveConfirmationDialog?: boolean;
  hideInstructions?: boolean;
  showScreenDimensions?: boolean;
}

const ACCENT_COLORS = [
  "#4F46E5", // Slate Blue
  "#2563EB", // Steel Blue
  "#6366F1", // Muted Indigo
  "#0D9488", // Deep Cyan
  "#16A34A", // Sage Green
  "#CA8A04", // Olive Gold
  "#EA580C", // Copper Orange
  "#DB2777", // Rose Crimson
  "#D946EF", // Orchid Purple
];

export default function SettingsEditor({ data, onChange, isDarkMode = true, accentColor = "#2563EB", onClose, onSettingsChange, hideSaveConfirmationDialog = false, hideInstructions = false, showScreenDimensions = false }: SettingsEditorProps) {
  const [backupExists, setBackupExists] = useState(false);
  const [backupDate, setBackupDate] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [colorPickerExpanded, setColorPickerExpanded] = useState(false);
  const [backupImportExpanded, setBackupImportExpanded] = useState(false);
  const [showBackupWarning, setShowBackupWarning] = useState(false);
  const [showImportWarning, setShowImportWarning] = useState(false);

  // Check for existing backup on mount
  useEffect(() => {
    checkBackup();
  }, []);

  const checkBackup = async () => {
    try {
      const userId = localStorage.getItem('invitation') ? JSON.parse(localStorage.getItem('invitation')!).id : null;
      if (!userId) return;

      const res = await fetch(`/api/backup?user_id=${userId}`);
      const data = await res.json();
      if (data.exists) {
        setBackupExists(true);
        setBackupDate(data.updated_at || data.created_at);
      }
    } catch (error) {
      console.error("Error checking backup:", error);
    }
  };

  const handleBackup = async () => {
    // Show warning if backup already exists
    if (backupExists && backupDate) {
      setShowBackupWarning(true);
      return;
    }

    // Proceed with backup if no existing backup
    performBackup();
  };

  const performBackup = async () => {
    setIsBackingUp(true);
    try {
      const userId = localStorage.getItem('invitation') ? JSON.parse(localStorage.getItem('invitation')!).id : null;
      if (!userId) return;

      // Collect local data
      const appSettings = localStorage.getItem('appSettings') ? JSON.parse(localStorage.getItem('appSettings')!) : null;
      const weddingChecklist = localStorage.getItem('weddingChecklist') ? JSON.parse(localStorage.getItem('weddingChecklist')!) : null;
      const weddingBudget = localStorage.getItem('weddingBudget') ? JSON.parse(localStorage.getItem('weddingBudget')!) : null;

      const backupData = {
        appSettings,
        weddingChecklist,
        weddingBudget,
      };

      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, backup_data: backupData }),
      });

      if (res.ok) {
        setBackupExists(true);
        setBackupDate(new Date().toISOString());
        alert('Backup created successfully!');
      } else {
        alert('Failed to create backup');
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      alert('Failed to create backup');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleImport = async () => {
    setShowImportWarning(true);
  };

  const performImport = async () => {
    setIsImporting(true);
    try {
      const userId = localStorage.getItem('invitation') ? JSON.parse(localStorage.getItem('invitation')!).id : null;
      if (!userId) return;

      const res = await fetch(`/api/backup?user_id=${userId}&download=true`);
      const data = await res.json();

      if (data.exists && data.data) {
        // Restore local data
        if (data.data.appSettings) {
          localStorage.setItem('appSettings', JSON.stringify(data.data.appSettings));
          if (onSettingsChange) {
            onSettingsChange(data.data.appSettings);
          }
        }

        if (data.data.weddingChecklist) {
          localStorage.setItem('weddingChecklist', JSON.stringify(data.data.weddingChecklist));
        }

        if (data.data.weddingBudget) {
          localStorage.setItem('weddingBudget', JSON.stringify(data.data.weddingBudget));
        }

        alert('Backup imported successfully! Refresh to see changes.');
      } else {
        alert('Failed to import backup');
      }
    } catch (error) {
      console.error("Error importing backup:", error);
      alert('Failed to import backup');
    } finally {
      setIsImporting(false);
    }
  };

  const handleDarkModeToggle = () => {
    if (onSettingsChange) {
      onSettingsChange({ isDarkMode: !isDarkMode, accentColor, hideSaveConfirmationDialog, hideInstructions, showScreenDimensions });
    }
  };

  const handleAccentColorChange = (color: string) => {
    if (onSettingsChange) {
      onSettingsChange({ isDarkMode, accentColor: color, hideSaveConfirmationDialog, hideInstructions, showScreenDimensions });
    }
  };

  const handleHideSaveConfirmationDialogToggle = () => {
    if (onSettingsChange) {
      onSettingsChange({ isDarkMode, accentColor, hideSaveConfirmationDialog: !hideSaveConfirmationDialog, hideInstructions, showScreenDimensions });
    }
  };

  const handleHideInstructionsToggle = () => {
    if (onSettingsChange) {
      onSettingsChange({ isDarkMode, accentColor, hideSaveConfirmationDialog, hideInstructions: !hideInstructions, showScreenDimensions });
    }
  };

  const handleScreenDimensionsToggle = () => {
    if (onSettingsChange) {
      onSettingsChange({ isDarkMode, accentColor, hideSaveConfirmationDialog, hideInstructions, showScreenDimensions: !showScreenDimensions });
    }
  };

  return (
    <div className={`w-full h-full rounded-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
      {/* Header - fixed, not scrollable */}
      <div className={`flex items-center gap-3 p-4 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h2 className="text-lg font-semibold" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>
            Settings
          </h2>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
            Customize your preferences
          </p>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6" style={{ fontFamily: "Inter, sans-serif" }}>
        {/* Dark Mode Toggle */}
        <div
          className={`border rounded-xl overflow-hidden transition-all duration-300 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          style={{
            backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
          }}
        >
          <div className="flex items-center gap-3 p-4">
            <div className="flex-1">
              <h3 className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                Dark Mode
              </h3>
              <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Switch between light and dark theme
              </p>
            </div>
            <button
              onClick={handleDarkModeToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDarkMode ? "bg-gray-600" : "bg-gray-300"
              }`}
              style={isDarkMode ? { backgroundColor: accentColor } : undefined}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Accent Color - Collapsible */}
        <div
          className={`border rounded-xl overflow-hidden transition-all duration-300 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          style={{
            backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
            ...(colorPickerExpanded ? {
              boxShadow: `0 0 0 1px ${hexToRgba(accentColor, 0.6)}, 0 4px 12px ${hexToRgba(accentColor, 0.25)}`
            } : {})
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            onClick={() => setColorPickerExpanded(!colorPickerExpanded)}
          >
            <div className="shrink-0 text-gray-400">
              {colorPickerExpanded ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                Accent Color
              </h3>
              <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Choose your favorite accent color
              </p>
            </div>
          </div>

          {/* Content */}
          {colorPickerExpanded && (
            <div className={`p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100"} border-t`}>
              {/* Color picker */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Color Picker
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => {
                      handleAccentColorChange(e.target.value);
                    }}
                    className="w-12 h-12 rounded-lg cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => {
                      handleAccentColorChange(e.target.value);
                    }}
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "bg-gray-600 border-gray-500 text-gray-200" : "border-gray-200"}`}
                    placeholder="#B88A78"
                  />
                </div>
              </div>

              {/* Quick pick color circles */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Quick Pick
                </label>
                <div className="flex gap-2 flex-wrap">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleAccentColorChange(color)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${accentColor === color ? "border-gray-900 scale-110" : "border-transparent hover:scale-105"}`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Screen Dimensions Toggle */}
        <div
          className={`border rounded-xl overflow-hidden transition-all duration-300 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          style={{
            backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
          }}
        >
          <div className="flex items-center gap-3 p-4">
            <div className="flex-1">
              <h3 className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                Screen Dimensions
              </h3>
              <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Show screen width and height overlay globally
              </p>
            </div>
            <button
              onClick={handleScreenDimensionsToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showScreenDimensions ? "bg-gray-600" : "bg-gray-300"
              }`}
              style={showScreenDimensions ? { backgroundColor: accentColor } : undefined}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showScreenDimensions ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Hide Save Confirmation Dialog Toggle */}
        <div
          className={`border rounded-xl overflow-hidden transition-all duration-300 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          style={{
            backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
          }}
        >
          <div className="flex items-center gap-3 p-4">
            <div className="flex-1">
              <h3 className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                Hide Save Confirmation Dialog
              </h3>
              <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Skip confirmation when saving changes
              </p>
            </div>
            <button
              onClick={handleHideSaveConfirmationDialogToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                hideSaveConfirmationDialog ? "bg-gray-600" : "bg-gray-300"
              }`}
              style={hideSaveConfirmationDialog ? { backgroundColor: accentColor } : undefined}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  hideSaveConfirmationDialog ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Hide Instructions Toggle */}
        <div
          className={`border rounded-xl overflow-hidden transition-all duration-300 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          style={{
            backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
          }}
        >
          <div className="flex items-center gap-3 p-4">
            <div className="flex-1">
              <h3 className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                Hide Instructions
              </h3>
              <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Hide builder instruction text in edit mode
              </p>
            </div>
            <button
              onClick={handleHideInstructionsToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                hideInstructions ? "bg-gray-600" : "bg-gray-300"
              }`}
              style={hideInstructions ? { backgroundColor: accentColor } : undefined}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  hideInstructions ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Backup / Import - Collapsible */}
        <div
          className={`border rounded-xl overflow-hidden transition-all duration-300 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}
          style={{
            backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
            ...(backupImportExpanded ? {
              boxShadow: `0 0 0 1px ${hexToRgba(accentColor, 0.6)}, 0 4px 12px ${hexToRgba(accentColor, 0.25)}`
            } : {})
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
            onClick={() => setBackupImportExpanded(!backupImportExpanded)}
          >
            <div className="shrink-0 text-gray-400">
              {backupImportExpanded ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                Backup & Import
              </h3>
              <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Save your local settings to the cloud or restore from backup
              </p>
            </div>
          </div>

          {/* Content */}
          {backupImportExpanded && (
            <div className={`p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100"} border-t`}>
              {backupExists && backupDate && (
                <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}>
                  <p className={`text-xs ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Last backup: {new Date(backupDate).toLocaleDateString()} at {new Date(backupDate).toLocaleTimeString()}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleBackup}
                  disabled={isBackingUp}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isBackingUp ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  style={{ backgroundColor: accentColor, color: "white" }}
                >
                  {isBackingUp ? "Backing up..." : "Backup Data"}
                </button>

                {backupExists && (
                  <button
                    onClick={handleImport}
                    disabled={isImporting}
                    className={`flex-1 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                      isImporting ? "opacity-50 cursor-not-allowed" : ""
                    } ${isDarkMode ? "border-gray-500 text-gray-200 hover:bg-gray-600" : "border-gray-200 text-gray-700 hover:bg-gray-100"}`}
                  >
                    {isImporting ? "Importing..." : "Import Data"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Backup warning dialog */}
      <BackupWarningDialog
        isOpen={showBackupWarning}
        lastBackupDate={backupDate || ""}
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        onConfirm={() => {
          setShowBackupWarning(false);
          performBackup();
        }}
        onCancel={() => setShowBackupWarning(false)}
      />

      {/* Import warning dialog */}
      <ImportWarningDialog
        isOpen={showImportWarning}
        lastBackupDate={backupDate || ""}
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        onConfirm={() => {
          setShowImportWarning(false);
          performImport();
        }}
        onCancel={() => setShowImportWarning(false)}
      />
    </div>
  );
}

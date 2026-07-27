import type { InvitationData } from "@/lib/types/invitation";
import { useState, useEffect, useRef, useCallback } from "react";
import BackupWarningDialog from "@/components/shared/BackupWarningDialog";
import ImportWarningDialog from "@/components/shared/ImportWarningDialog";
import LoginDialog from "@/components/editor/LoginDialog";
import QRCode from "qrcode";
import { Capacitor } from "@capacitor/core";
import { buildInviteUrl } from "@/lib/utils";
import { unregisterPushNotifications } from "@/lib/utils/push";
import { removeStoredItem } from "@/lib/utils/storage";

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
  invitationId?: string;
  isDemoMode?: boolean;
  slug?: string;
}

const ACCENT_COLORS = [
  "#6998EE", // Default Blue
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

export default function SettingsEditor({ data, onChange, isDarkMode = true, accentColor = "#6998EE", onClose, onSettingsChange, hideSaveConfirmationDialog = false, hideInstructions = false, showScreenDimensions = false, invitationId, isDemoMode = false, slug }: SettingsEditorProps) {
  const [backupExists, setBackupExists] = useState(false);
  const [backupDate, setBackupDate] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [showBackupWarning, setShowBackupWarning] = useState(false);
  const [showImportWarning, setShowImportWarning] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Check for existing backup on mount
  useEffect(() => {
    checkBackup();
    fetchExpiration();
  }, []);

  const generateQrCode = useCallback(async () => {
    if (!slug) return;
    setQrLoading(true);
    try {
      const url = buildInviteUrl(slug);
      const dataUrl = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setQrLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (expandedSection === 'qr' && !qrDataUrl && !isDemoMode) {
      generateQrCode();
    }
  }, [expandedSection, qrDataUrl, isDemoMode, generateQrCode]);

  const handleSaveQrCode = async () => {
    if (!qrDataUrl) return;

    if (Capacitor.isNativePlatform()) {
      try {
        const { Media } = await import("@capacitor-community/media");
        const fileName = `qr-${slug || 'invitation'}`;
        const albums = await Media.getAlbums();
        const album = albums.albums.find(a => a.name === 'InstaVow') || albums.albums[0];

        await Media.savePhoto({
          path: qrDataUrl,
          albumIdentifier: album?.identifier,
          fileName,
        });

        // Show success toast
        const toast = document.createElement('div');
        toast.textContent = 'QR code saved to gallery';
        toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.8);color:white;padding:12px 24px;border-radius:24px;font-size:14px;font-family:Inter,sans-serif;z-index:99999;pointer-events:none;transition:opacity 0.3s;';
        document.body.appendChild(toast);
        setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => toast.remove(), 300);
        }, 2000);
      } catch (error) {
        console.error('Error saving QR code to gallery:', error);
      }
    } else {
      const link = document.createElement("a");
      link.href = qrDataUrl;
      link.download = `qr-${slug || "invitation"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const fetchExpiration = async () => {
    if (!invitationId) return;
    try {
      const res = await fetch(`/api/invitation/${invitationId}`);
      const data = await res.json();
      if (data.invitation?.expires_at) {
        setExpiresAt(data.invitation.expires_at);
      }
    } catch (error) {
      console.error("Error fetching expiration:", error);
    }
  };

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
          className={`border rounded-xl overflow-hidden transition-all duration-300`}
          onMouseEnter={() => setHoveredSection('darkmode')}
          onMouseLeave={() => setHoveredSection(null)}
          style={{
            backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
            borderColor: hoveredSection === 'darkmode' ? hexToRgba(accentColor, 0.8) : hexToRgba(accentColor, 0.3),
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
          className={`border rounded-xl overflow-hidden transition-all duration-300`}
          onMouseEnter={() => setHoveredSection('color')}
          onMouseLeave={() => setHoveredSection(null)}
          style={{
            backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
            borderColor: hoveredSection === 'color' ? hexToRgba(accentColor, 0.8) : hexToRgba(accentColor, 0.3),
            ...(expandedSection === 'color' ? {
              boxShadow: `0 0 0 1px ${hexToRgba(accentColor, 0.6)}, 0 4px 12px ${hexToRgba(accentColor, 0.25)}`
            } : {})
          }}
        >
          {/* Header */}
          <div
            className={`flex items-center gap-3 p-4 cursor-pointer rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-100"}`}
            onClick={() => setExpandedSection(expandedSection === 'color' ? null : 'color')}
          >
            <div className="shrink-0 text-gray-400 order-2">
              {expandedSection === 'color' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}
            </div>
            <div className="flex-1 order-1">
              <h3 className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                Accent Color
              </h3>
              <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Choose your favorite accent color
              </p>
            </div>
          </div>

          {/* Content */}
          {expandedSection === 'color' && (
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
                    placeholder="#6998EE"
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
          className={`border rounded-xl overflow-hidden transition-all duration-300`}
          onMouseEnter={() => setHoveredSection('screendim')}
          onMouseLeave={() => setHoveredSection(null)}
          style={{
            backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
            borderColor: hoveredSection === 'screendim' ? hexToRgba(accentColor, 0.8) : hexToRgba(accentColor, 0.3),
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
          className={`border rounded-xl overflow-hidden transition-all duration-300`}
          onMouseEnter={() => setHoveredSection('hidesavedialog')}
          onMouseLeave={() => setHoveredSection(null)}
          style={{
            backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
            borderColor: hoveredSection === 'hidesavedialog' ? hexToRgba(accentColor, 0.8) : hexToRgba(accentColor, 0.3),
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
          className={`border rounded-xl overflow-hidden transition-all duration-300`}
          onMouseEnter={() => setHoveredSection('hideinstructions')}
          onMouseLeave={() => setHoveredSection(null)}
          style={{
            backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
            borderColor: hoveredSection === 'hideinstructions' ? hexToRgba(accentColor, 0.8) : hexToRgba(accentColor, 0.3),
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
        {!isDemoMode && (
        <div
          className={`border rounded-xl overflow-hidden transition-all duration-300`}
          onMouseEnter={() => setHoveredSection('backup')}
          onMouseLeave={() => setHoveredSection(null)}
          style={{
            backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
            borderColor: hoveredSection === 'backup' ? hexToRgba(accentColor, 0.8) : hexToRgba(accentColor, 0.3),
            ...(expandedSection === 'backup' ? {
              boxShadow: `0 0 0 1px ${hexToRgba(accentColor, 0.6)}, 0 4px 12px ${hexToRgba(accentColor, 0.25)}`
            } : {})
          }}
        >
          {/* Header */}
          <div
            className={`flex items-center gap-3 p-4 cursor-pointer rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-100"}`}
            onClick={() => setExpandedSection(expandedSection === 'backup' ? null : 'backup')}
          >
            <div className="shrink-0 text-gray-400 order-2">
              {expandedSection === 'backup' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}
            </div>
            <div className="flex-1 order-1">
              <h3 className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                Backup & Import
              </h3>
              <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Save your local settings to the cloud or restore from backup
              </p>
            </div>
          </div>

          {/* Content */}
          {expandedSection === 'backup' && (
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
        )}

        {/* Builder Expiration - Collapsible */}
        {!isDemoMode && (
        <div
          className={`border rounded-xl overflow-hidden transition-all duration-300`}
          onMouseEnter={() => setHoveredSection('expiration')}
          onMouseLeave={() => setHoveredSection(null)}
          style={{
            backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
            borderColor: hoveredSection === 'expiration' ? hexToRgba(accentColor, 0.8) : hexToRgba(accentColor, 0.3),
            ...(expandedSection === 'expiration' ? {
              boxShadow: `0 0 0 1px ${hexToRgba(accentColor, 0.6)}, 0 4px 12px ${hexToRgba(accentColor, 0.25)}`
            } : {})
          }}
        >
          {/* Header */}
          <div
            className={`flex items-center gap-3 p-4 cursor-pointer rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-100"}`}
            onClick={() => setExpandedSection(expandedSection === 'expiration' ? null : 'expiration')}
          >
            <div className="shrink-0 text-gray-400 order-2">
              {expandedSection === 'expiration' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}
            </div>
            <div className="flex-1 order-1">
              <h3 className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                Builder Expiration
              </h3>
              <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                You can no longer edit when your builder expires 1 year during creation
              </p>
            </div>
          </div>

          {/* Content */}
          {expandedSection === 'expiration' && (
            <div className={`p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100"} border-t`}>
              {expiresAt ? (
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}>
                  <p className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                    Expires on: {new Date(expiresAt).toLocaleDateString()}
                  </p>
                </div>
              ) : (
                <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}>
                  <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Expiration date not set
                  </p>
                </div>
              )}
              <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Your builder will expire 1 year from the signup date or 30 days after the wedding day, whichever is earlier.
              </p>
            </div>
          )}
        </div>
        )}

        {/* QR Code - Collapsible */}
        {!isDemoMode && (
        <div
          className={`border rounded-xl overflow-hidden transition-all duration-300`}
          onMouseEnter={() => setHoveredSection('qr')}
          onMouseLeave={() => setHoveredSection(null)}
          style={{
            backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
            borderColor: hoveredSection === 'qr' ? hexToRgba(accentColor, 0.8) : hexToRgba(accentColor, 0.3),
            ...(expandedSection === 'qr' ? {
              boxShadow: `0 0 0 1px ${hexToRgba(accentColor, 0.6)}, 0 4px 12px ${hexToRgba(accentColor, 0.25)}`
            } : {})
          }}
        >
          {/* Header */}
          <div
            className={`flex items-center gap-3 p-4 cursor-pointer rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-100"}`}
            onClick={() => setExpandedSection(expandedSection === 'qr' ? null : 'qr')}
          >
            <div className="shrink-0 text-gray-400 order-2">
              {expandedSection === 'qr' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 15l-6-6-6 6" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              )}
            </div>
            <div className="flex-1 order-1">
              <h3 className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                Invitation QR Code
              </h3>
              <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Download a QR code for your invitation link
              </p>
            </div>
          </div>

          {/* Content */}
          {expandedSection === 'qr' && (
            <div className={`p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100"} border-t`}>
              {qrLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" style={{ borderTopColor: accentColor }} />
                </div>
              ) : qrDataUrl ? (
                <>
                  <div className="flex justify-center">
                    <img
                      src={qrDataUrl}
                      alt="Invitation QR Code"
                      className="w-48 h-48 rounded-xl"
                    />
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={handleSaveQrCode}
                      className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
                      style={{ backgroundColor: accentColor, color: "white" }}
                    >
                      Save QR Code
                    </button>
                  </div>
                </>
              ) : (
                <div className={`p-4 rounded-lg text-center ${isDarkMode ? "bg-gray-600" : "bg-gray-100"}`}>
                  <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Unable to generate QR code
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* Account Actions */}
        {!isDemoMode ? (
          <button
            onClick={async () => {
              await unregisterPushNotifications();
              await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
              await removeStoredItem('invitation');
              await removeStoredItem('appSettings');
              localStorage.removeItem('weddingChecklist');
              localStorage.removeItem('weddingBudget');
              window.location.href = '/tools';
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isDarkMode ? "hover:bg-red-900/30 text-red-400" : "hover:bg-red-50 text-red-600"}`}
            style={{ border: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}` }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        ) : (
          <button
            onClick={() => setShowLoginDialog(true)}
            onMouseEnter={() => setHoveredSection('signin')}
            onMouseLeave={() => setHoveredSection(null)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-900"}`}
            style={{ border: `1px solid ${hoveredSection === 'signin' ? hexToRgba(accentColor, 0.8) : hexToRgba(accentColor, 0.3)}` }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10,17 15,12 10,7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            <div className="flex flex-col text-left">
              <span className="text-sm font-medium">Sign In</span>
              <span className="text-xs" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#9ca3af" : accentColor }}>
                Log-in your account or create a new one
              </span>
            </div>
          </button>
        )}
      </div>

      <LoginDialog isOpen={showLoginDialog} onClose={() => setShowLoginDialog(false)} isDarkMode={isDarkMode} accentColor={accentColor} />

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

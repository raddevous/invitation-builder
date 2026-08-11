import type { InvitationData } from "@/lib/types/invitation";
import { useState, useEffect } from "react";
import LoginDialog from "@/components/editor/LoginDialog";
import { Capacitor } from "@capacitor/core";
import { unregisterPushNotifications, registerPushNotifications } from "@/lib/utils/push";
import { removeStoredItem, getStoredItem, setStoredItem } from "@/lib/utils/storage";
import { apiUrl } from "@/lib/utils/api";

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface AccountInfo {
  email: string;
  name: string;
  createdAt: string;
  expiresAt: string;
}

interface SettingsEditorProps {
  data: InvitationData;
  onChange: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  isDarkMode?: boolean;
  accentColor?: string;
  onClose: () => void;
  onSettingsChange?: (settings: { isDarkMode: boolean; accentColor: string; hideInstructions?: boolean; showScreenDimensions?: boolean; isPreviewDetached?: boolean }) => void;
  hideInstructions?: boolean;
  showScreenDimensions?: boolean;
  isPreviewDetached?: boolean;
  invitationId?: string;
  isDemoMode?: boolean;
  slug?: string;
  accountInfo?: AccountInfo | null;
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

export default function SettingsEditor({ data, onChange, isDarkMode = true, accentColor = "#6998EE", onClose, onSettingsChange, hideInstructions = false, showScreenDimensions = false, isPreviewDetached = false, invitationId, isDemoMode = false, slug, accountInfo }: SettingsEditorProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  // Notification preferences (device-local)
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifRsvpAttending, setNotifRsvpAttending] = useState(true);
  const [notifRsvpNotAttending, setNotifRsvpNotAttending] = useState(true);
  const [notifLoading, setNotifLoading] = useState(false);

  // Load notification preferences on mount
  useEffect(() => {
    (async () => {
      const stored = await getStoredItem('notifPrefs');
      if (stored) {
        try {
          const prefs = JSON.parse(stored);
          setNotifEnabled(prefs.enabled !== false);
          setNotifRsvpAttending(prefs.rsvpAttending !== false);
          setNotifRsvpNotAttending(prefs.rsvpNotAttending !== false);
        } catch {}
      }
    })();
  }, []);

  // Save notification preferences
  const saveNotifPrefs = async (enabled: boolean, rsvpAttending: boolean, rsvpNotAttending: boolean) => {
    setNotifEnabled(enabled);
    setNotifRsvpAttending(rsvpAttending);
    setNotifRsvpNotAttending(rsvpNotAttending);
    await setStoredItem('notifPrefs', JSON.stringify({
      enabled,
      rsvpAttending,
      rsvpNotAttending,
    }));
  };

  const handleNotifToggle = async () => {
    const newEnabled = !notifEnabled;
    setNotifLoading(true);
    try {
      if (newEnabled && invitationId) {
        await registerPushNotifications(invitationId);
      } else {
        await unregisterPushNotifications();
      }
      await saveNotifPrefs(newEnabled, notifRsvpAttending, notifRsvpNotAttending);
      // Auto-collapse section when turned off
      if (!newEnabled) {
        setExpandedSection(null);
      }
    } catch {
      // best-effort
    } finally {
      setNotifLoading(false);
    }
  };

  const handleDarkModeToggle = () => {
    if (onSettingsChange) {
      onSettingsChange({ isDarkMode: !isDarkMode, accentColor, hideInstructions, showScreenDimensions, isPreviewDetached });
    }
  };

  const handleAccentColorChange = (color: string) => {
    if (onSettingsChange) {
      onSettingsChange({ isDarkMode, accentColor: color, hideInstructions, showScreenDimensions, isPreviewDetached });
    }
  };

  const handleHideInstructionsToggle = () => {
    if (onSettingsChange) {
      onSettingsChange({ isDarkMode, accentColor, hideInstructions: !hideInstructions, showScreenDimensions, isPreviewDetached });
    }
  };

  const handleScreenDimensionsToggle = () => {
    if (onSettingsChange) {
      onSettingsChange({ isDarkMode, accentColor, hideInstructions, showScreenDimensions: !showScreenDimensions, isPreviewDetached });
    }
  };

  return (
    <div className={`w-full rounded-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
      <div className="p-4 space-y-6" style={{ fontFamily: "Inter, sans-serif" }}>
        {/* Account Info - Collapsible (only for signed-in users, not demo) */}
        {!isDemoMode && (
          <div
            className={`border rounded-xl overflow-hidden transition-all duration-300`}
            onMouseEnter={() => setHoveredSection('account')}
            onMouseLeave={() => setHoveredSection(null)}
            style={{
              backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
              borderColor: hoveredSection === 'account' ? hexToRgba(accentColor, 0.8) : hexToRgba(accentColor, 0.3),
              ...(expandedSection === 'account' ? {
                boxShadow: `0 0 0 1px ${hexToRgba(accentColor, 0.6)}, 0 4px 12px ${hexToRgba(accentColor, 0.25)}`
              } : {}),
            }}
          >
            {/* Header */}
            <div
              className={`flex items-center gap-3 p-4 cursor-pointer rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-100"}`}
              onClick={() => setExpandedSection(expandedSection === 'account' ? null : 'account')}
            >
              <div className="shrink-0 text-gray-400 order-2">
                {expandedSection === 'account' ? (
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
                  Account Info
                </h3>
                <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Your registered account details
                </p>
              </div>
            </div>

            {/* Content */}
            {expandedSection === 'account' && (
              <div className={`p-4 space-y-3 ${isDarkMode ? "border-gray-700" : "border-gray-100"} border-t`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Email</span>
                  <span className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>{accountInfo?.email || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Name</span>
                  <span className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>{accountInfo?.name || "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Created</span>
                  <span className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>{accountInfo?.createdAt ? new Date(accountInfo.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Editing Expires</span>
                  <span className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                    {accountInfo?.expiresAt ? (() => {
                      const days = Math.ceil((new Date(accountInfo.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                      return days > 0 ? `${days} days remaining` : "Expired";
                    })() : "—"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

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

        {/* Notifications */}
        {!isDemoMode && (
        <div
          className={`border rounded-xl overflow-hidden transition-all duration-300`}
          onMouseEnter={() => setHoveredSection('notifications')}
          onMouseLeave={() => setHoveredSection(null)}
          style={{
            backgroundColor: isDarkMode ? "#19212C" : "#ECEDF0",
            borderColor: hoveredSection === 'notifications' ? hexToRgba(accentColor, 0.8) : hexToRgba(accentColor, 0.3),
            ...(expandedSection === 'notifications' ? {
              boxShadow: `0 0 0 1px ${hexToRgba(accentColor, 0.6)}, 0 4px 12px ${hexToRgba(accentColor, 0.25)}`
            } : {})
          }}
        >
          {/* Header */}
          <div
            className={`flex items-center gap-3 p-4 cursor-pointer rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-100"}`}
            onClick={() => setExpandedSection(expandedSection === 'notifications' ? null : 'notifications')}
          >
            <div className="shrink-0 text-gray-400 order-2">
              {expandedSection === 'notifications' ? (
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
                Notifications
              </h3>
              <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Get alerted when guests respond
              </p>
            </div>
          </div>

          {/* Content */}
          {expandedSection === 'notifications' && (
            <div className={`p-4 space-y-4 ${isDarkMode ? "border-gray-700" : "border-gray-100"} border-t`}>
              {/* Master toggle */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <span className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
                    Push Notifications
                  </span>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {Capacitor.isNativePlatform() ? "Receive alerts on this device" : "Available on mobile app only"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={notifLoading || !Capacitor.isNativePlatform()}
                  onClick={handleNotifToggle}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: notifEnabled ? accentColor : (isDarkMode ? "#374151" : "#d1d5db") }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifEnabled ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>

              {/* Sub-options (only when enabled) */}
              {notifEnabled && Capacitor.isNativePlatform() && (
                <div className={`space-y-3 pt-3 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        RSVP Attending
                      </span>
                      <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        When a guest is attending
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveNotifPrefs(notifEnabled, !notifRsvpAttending, notifRsvpNotAttending)}
                      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                      style={{ backgroundColor: notifRsvpAttending ? accentColor : (isDarkMode ? "#374151" : "#d1d5db") }}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${notifRsvpAttending ? "translate-x-5" : "translate-x-1"}`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        RSVP Not Attending
                      </span>
                      <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        When a guest is not attending
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveNotifPrefs(notifEnabled, notifRsvpAttending, !notifRsvpNotAttending)}
                      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                      style={{ backgroundColor: notifRsvpNotAttending ? accentColor : (isDarkMode ? "#374151" : "#d1d5db") }}
                    >
                      <span
                        className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${notifRsvpNotAttending ? "translate-x-5" : "translate-x-1"}`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Web note */}
              {!Capacitor.isNativePlatform() && (
                <p className={`text-xs text-center pt-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                  Install the mobile app to receive push notifications
                </p>
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
              await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' }).catch(() => {});
              await removeStoredItem('invitation');
              await removeStoredItem('appSettings');
              await removeStoredItem('last_used_slug');
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

    </div>
  );
}

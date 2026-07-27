"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Invitation } from "@/lib/types/invitation";
import EditorLogin from "@/components/editor/EditorLogin";
import ToolsTab from "@/components/editor/tabs/ToolsTab";
import EditorPanel from "@/components/editor/EditorPanel";
import { debounce, updateFavicon } from "@/lib/utils";
import { registerPushNotifications } from "@/lib/utils/push";
import { getStoredItem, setStoredItem } from "@/lib/utils/storage";

interface AppSettings {
  isDarkMode: boolean;
  accentColor: string;
  hideSaveConfirmationDialog?: boolean;
  hideInstructions?: boolean;
  showScreenDimensions?: boolean;
}

export default function ToolsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [slugValid, setSlugValid] = useState<boolean | null>(null);
  const [showEditorPanel, setShowEditorPanel] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    isDarkMode: true,
    accentColor: "#6998EE",
    hideSaveConfirmationDialog: false,
    hideInstructions: false,
    showScreenDimensions: false,
  });
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [showSaveStatus, setShowSaveStatus] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 });
  const [showUnsavedToolsDialog, setShowUnsavedToolsDialog] = useState(false);

  // Snapshot of invitation data for tools-level unsaved changes detection
  const savedDataSnapshot = useRef<string>("");

  // Load invitation and set the saved snapshot synchronously to avoid race condition
  // where hasToolsUnsavedChanges is true before the useEffect runs
  const loadInvitation = (inv: Invitation) => {
    savedDataSnapshot.current = JSON.stringify(inv.data);
    setInvitation(inv);
  };

  // Check if there are unsaved changes at tools level
  const hasToolsUnsavedChanges = invitation
    ? JSON.stringify(invitation.data) !== savedDataSnapshot.current
    : false;

  // Prevent closing tab/browser when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasToolsUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasToolsUnsavedChanges]);

  // Register for push notifications when invitation is loaded
  useEffect(() => {
    if (invitation?.id) {
      registerPushNotifications(invitation.id);
    }
  }, [invitation?.id]);

  // Check if slug exists on mount
  useEffect(() => {
    async function checkSlug() {
      try {
        const res = await fetch(`/api/invitation/${slug}`);
        setSlugValid(res.ok);
      } catch {
        setSlugValid(false);
      }
    }
    checkSlug();
  }, [slug]);

  // Auto-load invitation from native storage or auth cookie to skip login
  useEffect(() => {
    if (!slugValid) return;

    async function autoLogin() {
      // Try native storage first (fast path)
      const stored = await getStoredItem('invitation');
      if (stored) {
        try {
          const parsed: Invitation = JSON.parse(stored);
          if (parsed.slug === slug) {
            loadInvitation(parsed);
            return;
          }
        } catch {
          // ignore invalid stored data
        }
      }

      // Fallback: verify auth cookie and fetch from server
      try {
        const res = await fetch("/api/auth/verify", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.authenticated && data.invitation && data.invitation.slug === slug) {
          const { isDarkMode, accentColor, ...invitationData } = data.invitation.data;
          const inv = { ...data.invitation, data: invitationData };
          await setStoredItem("invitation", JSON.stringify(inv));
          if (isDarkMode !== undefined || accentColor !== undefined) {
            await setStoredItem("appSettings", JSON.stringify({
              isDarkMode: isDarkMode ?? true,
              accentColor: accentColor ?? "#6998EE",
            }));
          }
          loadInvitation(inv);
        }
      } catch {
        // not authenticated
      }
    }
    autoLogin();
  }, [slugValid, slug]);

  // Fetch invitation by access code (called from EditorLogin)
  const fetchInvitationByAccessCode = async (accessCode: string): Promise<Invitation | null> => {
    try {
      const res = await fetch("/api/auth/access-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.invitation;
    } catch {
      return null;
    }
  };

  // Track screen dimensions for overlay
  useEffect(() => {
    const updateDimensions = () => {
      setScreenDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Disable right-click in tools page
  useEffect(() => {
    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', preventContextMenu);
    return () => document.removeEventListener('contextmenu', preventContextMenu);
  }, []);

  // Update CSS variable for accent color when settings change
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', settings.accentColor);
  }, [settings.accentColor]);

  // Use the user-defined display logo as the page favicon
  useEffect(() => {
    updateFavicon(invitation?.data?.heroIcon);
  }, [invitation?.data?.heroIcon]);

  useEffect(() => {
    // Load settings from localStorage
    const storedSettings = localStorage.getItem('appSettings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error('Failed to parse stored settings:', error);
      }
    }
  }, [slug]);

  // Refetch when returning from editor to ensure we have latest data
  useEffect(() => {
    if (!showEditorPanel && invitation) {
      // User will need to re-enter access code to refresh data
    }
  }, [showEditorPanel, invitation]);

  // Refetch before opening editor to ensure latest data
  const handleOpenEditor = async () => {
    if (hasToolsUnsavedChanges) {
      setShowUnsavedToolsDialog(true);
      return;
    }
    setShowEditorPanel(true);
  };

  // Immediate save function to Supabase
  const saveToSupabase = async (inv: Invitation) => {
    setSaveStatus("saving");
    setShowSaveStatus(true);
    try {
      // Exclude settings from the data being saved to Supabase
      const { isDarkMode, accentColor, ...dataToSave } = inv.data;
      const res = await fetch(`/api/invitation/${inv.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: inv.id, data: dataToSave }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveStatus("saved");
      // Update snapshot after successful save
      savedDataSnapshot.current = JSON.stringify(inv.data);
      // Update localStorage with the saved data
      localStorage.setItem('invitation', JSON.stringify(inv));
    } catch {
      setSaveStatus("error");
    }
  };

  // Handle save status visibility with fade out
  useEffect(() => {
    if (saveStatus === "saving") {
      setShowSaveStatus(true);
    } else if (saveStatus === "saved") {
      // Keep overlay visible, start fade-out timer
      const timer = setTimeout(() => {
        setShowSaveStatus(false);
      }, 1500);
      return () => clearTimeout(timer);
    } else if (saveStatus === "error") {
      // Keep overlay visible, start fade-out timer
      const timer = setTimeout(() => {
        setShowSaveStatus(false);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setShowSaveStatus(false);
    }
  }, [saveStatus]);

  // Show loading while checking slug
  if (slugValid === null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#fff8f3" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "#e8cfc3", borderTopColor: "#6998EE" }}
          />
          <p
            className="text-sm italic"
            style={{ color: "#6998EE", fontFamily: "Cormorant Garamond, serif" }}
          >
            Checking invitation…
          </p>
        </div>
      </div>
    );
  }

  // Show error if slug is invalid
  if (slugValid === false) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ backgroundColor: "#fff8f3" }}
      >
        <p
          className="text-3xl mb-3"
          style={{ fontFamily: "Playfair Display, serif", color: "#6998EE" }}
        >
          Invitation Not Found
        </p>
        <p
          className="text-sm mb-6"
          style={{ color: "#8a6252", fontFamily: "Cormorant Garamond, serif" }}
        >
          This invitation link may be invalid or has been removed.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 rounded-lg text-white font-medium transition-all"
          style={{ backgroundColor: "#6998EE", fontFamily: "Cormorant Garamond, serif" }}
        >
          Go Home
        </button>
      </div>
    );
  }

  if (!invitation) {
    return <EditorLogin onLogin={loadInvitation} onTryDemo={() => router.push('/demo')} />;
  }

  if (showEditorPanel) {
    return (
      <EditorPanel
        invitation={invitation}
        onBack={() => setShowEditorPanel(false)}
        showScreenDimensions={settings.showScreenDimensions}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ backgroundColor: settings.isDarkMode ? "#1f2937" : "#fff8f3" }}>
      {/* Screen dimensions overlay - global */}
      {settings.showScreenDimensions && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] no-print bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full pointer-events-none">
          <span className="text-xs text-white font-mono">
            {screenDimensions.width >= 1024 ? "Desktop" : screenDimensions.width >= 768 ? "Tablet" : "Mobile"}: {screenDimensions.width} × {screenDimensions.height}
          </span>
        </div>
      )}
      {/* Save status overlay */}
      <div className={`fixed inset-0 z-[70] no-print flex flex-col items-center justify-center ${showSaveStatus ? 'opacity-100' : 'opacity-0 pointer-events-none'} transition-opacity duration-500`}>
        {/* Dark backdrop */}
        <div className="absolute inset-0 bg-gray-900" style={{ opacity: 0.95 }} />
        {/* Status content */}
        <div className="relative z-10 flex flex-col items-center gap-4 text-white drop-shadow-lg">
          <span className="text-xl font-semibold" style={{ fontFamily: "Inter, sans-serif" }}>
            {saveStatus === "saving" && "Saving..."}
            {saveStatus === "saved" && "Saved"}
            {saveStatus === "error" && "Save failed"}
          </span>
          {saveStatus === "saving" && (
            <div className="w-14 h-14 rounded-full border-4 border-white/30 border-t-white animate-spin" />
          )}
          {saveStatus === "saved" && (
            <svg className="w-14 h-14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5 9-9" />
            </svg>
          )}
          {saveStatus === "error" && (
            <svg className="w-14 h-14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          )}
        </div>
      </div>
      <div className="w-full min-h-screen lg:max-w-[400px] lg:h-[calc(100vh-2rem)] lg:mx-4 lg:rounded-2xl lg:overflow-hidden lg:shadow-2xl" style={{ backgroundColor: settings.isDarkMode ? "#1f2937" : "#fff8f3" }}>
        <ToolsTab
          data={invitation.data}
          slug={invitation.slug}
          invitationId={invitation.id}
          onChange={(field, value) => {
            setInvitation(prev => prev ? { ...prev, data: { ...prev.data, [field]: value } } : prev);
          }}
          onSave={async (updatedData) => {
            const updatedInvitation = { ...invitation, data: updatedData };
            setInvitation(updatedInvitation);
            await saveToSupabase(updatedInvitation);
          }}
          isDarkMode={settings.isDarkMode}
          accentColor={settings.accentColor}
          onOpenEditor={handleOpenEditor}
          onSettingsChange={(newSettings) => {
            setSettings(newSettings);
            localStorage.setItem('appSettings', JSON.stringify(newSettings));
          }}
          hideSaveConfirmationDialog={settings.hideSaveConfirmationDialog}
          hideInstructions={settings.hideInstructions}
          showScreenDimensions={settings.showScreenDimensions}
        />
      </div>

      {/* Unsaved tools changes dialog - shown when trying to leave tools section */}
      {showUnsavedToolsDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[90] p-4">
          <div className={`${settings.isDarkMode ? "bg-gray-800" : "bg-white"} rounded-xl p-6 max-w-sm w-full`}>
            <h3 className={`text-lg font-semibold mb-2 ${settings.isDarkMode ? "text-gray-200" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Unsaved Changes
            </h3>
            <p className={`text-sm mb-6 ${settings.isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              You have unsaved changes in the tools section. Do you want to save them before leaving?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnsavedToolsDialog(false)}
                className={`flex-1 px-4 py-2 border rounded-lg text-sm transition-colors ${
                  settings.isDarkMode
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Stay
              </button>
              <button
                onClick={async () => {
                  setShowUnsavedToolsDialog(false);
                  if (invitation) {
                    await saveToSupabase(invitation);
                  }
                  setShowEditorPanel(true);
                }}
                className="flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: settings.accentColor, fontFamily: "Inter, sans-serif" }}
              >
                Save & Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

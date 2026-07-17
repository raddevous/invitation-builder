"use client";

import { useState, useEffect, use } from "react";
import type { Invitation } from "@/lib/types/invitation";
import EditorLogin from "@/components/editor/EditorLogin";
import ToolsTab from "@/components/editor/tabs/ToolsTab";
import EditorPanel from "@/components/editor/EditorPanel";
import { debounce } from "@/lib/utils";

interface AppSettings {
  isDarkMode: boolean;
  accentColor: string;
  hideSaveConfirmationDialog?: boolean;
  hideInstructions?: boolean;
  showScreenDimensions?: boolean;
}

export default function ToolsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [showEditorPanel, setShowEditorPanel] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    isDarkMode: true,
    accentColor: "#2563EB",
    hideSaveConfirmationDialog: false,
    hideInstructions: false,
    showScreenDimensions: false,
  });
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [showSaveStatus, setShowSaveStatus] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 });

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

  // Update CSS variable for accent color when settings change
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', settings.accentColor);
  }, [settings.accentColor]);

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

  if (!invitation) {
    return <EditorLogin onLogin={setInvitation} />;
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
            const updated = invitation ? { ...invitation, data: { ...invitation.data, [field]: value } } : null;
            setInvitation(updated);
            // Don't update localStorage here - only update after successful Supabase save
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
    </div>
  );
}

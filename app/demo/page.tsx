"use client";

import { useState, useEffect } from "react";
import type { Invitation } from "@/lib/types/invitation";
import ToolsTab from "@/components/editor/tabs/ToolsTab";
import EditorPanel from "@/components/editor/EditorPanel";
import { loadDemoInvitation, saveDemoInvitation } from "@/lib/demo/demo-data";

interface AppSettings {
  isDarkMode: boolean;
  accentColor: string;
  hideSaveConfirmationDialog?: boolean;
  hideInstructions?: boolean;
  showScreenDimensions?: boolean;
}

export default function DemoPage() {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [showEditorPanel, setShowEditorPanel] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    isDarkMode: false,
    accentColor: "#b88a78",
    hideSaveConfirmationDialog: false,
    hideInstructions: false,
    showScreenDimensions: false,
  });
  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setInvitation(loadDemoInvitation());

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
  }, []);

  useEffect(() => {
    const updateDimensions = () => {
      setScreenDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', settings.accentColor);
  }, [settings.accentColor]);

  const handleSave = (updatedData: any) => {
    if (!invitation) return;
    const updatedInvitation = { ...invitation, data: updatedData };
    setInvitation(updatedInvitation);
    saveDemoInvitation(updatedData);
  };

  const handleOpenEditor = () => {
    setShowEditorPanel(true);
  };

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#fff8f3" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#e8cfc3", borderTopColor: "#b88a78" }} />
        </div>
      </div>
    );
  }

  if (showEditorPanel) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-[60] bg-yellow-500 text-black text-center text-xs py-1 font-medium">
          DEMO MODE - Changes are saved locally only. Sign up to publish your invitation.
        </div>
        <div className="pt-6">
          <EditorPanel
            invitation={invitation}
            onBack={() => setShowEditorPanel(false)}
            showScreenDimensions={settings.showScreenDimensions}
            isDemoMode={true}
          />
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative" style={{ backgroundColor: settings.isDarkMode ? "#1f2937" : "#fff8f3" }}>
      {/* Demo banner */}
      <div className="fixed top-0 left-0 right-0 z-[60] bg-yellow-500 text-black text-center text-xs py-1 font-medium">
        DEMO MODE - Changes are saved locally only. Sign up to publish your invitation.
      </div>

      {/* Screen dimensions overlay - global */}
      {settings.showScreenDimensions && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[80] no-print bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full pointer-events-none">
          <span className="text-xs text-white font-mono">
            {screenDimensions.width >= 1024 ? "Desktop" : screenDimensions.width >= 768 ? "Tablet" : "Mobile"}: {screenDimensions.width} × {screenDimensions.height}
          </span>
        </div>
      )}

      <div className="pt-6 w-full min-h-screen lg:max-w-[400px] lg:h-[calc(100vh-2rem)] lg:mx-4 lg:rounded-2xl lg:overflow-hidden lg:shadow-2xl" style={{ backgroundColor: settings.isDarkMode ? "#1f2937" : "#fff8f3" }}>
        <ToolsTab
          data={invitation.data}
          slug={invitation.slug}
          invitationId={invitation.id}
          onChange={(field, value) => {
            const updated = invitation ? { ...invitation, data: { ...invitation.data, [field]: value } } : null;
            setInvitation(updated);
          }}
          onSave={async (updatedData) => {
            handleSave(updatedData);
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
          isDemoMode={true}
        />
      </div>
    </div>
  );
}

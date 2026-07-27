"use client";

import { useCallback, useEffect, useState } from "react";
import type { Invitation, InvitationData } from "@/lib/types/invitation";
import LiveEditView from "@/components/editor/live-edit/LiveEditView";

// Standalone route rendered inside the device-frame iframe (see DeviceFramePreview.tsx).
// It receives its invitation state entirely via postMessage from the parent editor window,
// so real browser CSS breakpoints (Tailwind md:/lg:) apply correctly based on the iframe's
// own viewport width, giving an accurate mobile/tablet preview.
export default function LiveFramePage() {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [accentColor, setAccentColor] = useState("#6998EE");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [desktopMode, setDesktopMode] = useState(false);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const msg = e.data;
      if (!msg || typeof msg !== "object" || msg.type !== "wb-sync") return;
      setInvitation(msg.invitation);
      setHasPendingChanges(!!msg.hasPendingChanges);
      if (msg.accentColor) setAccentColor(msg.accentColor);
      setIsDarkMode(!!msg.isDarkMode);
      setDesktopMode(!!msg.desktopMode);
    };
    window.addEventListener("message", handleMessage);
    // Announce readiness so the parent starts sending sync messages
    window.parent.postMessage({ type: "wb-frame-ready" }, window.location.origin);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const post = useCallback((data: Record<string, unknown>) => {
    window.parent.postMessage(data, window.location.origin);
  }, []);

  const handleChange = useCallback(
    (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => {
      post({ type: "wb-change", field, value });
    },
    [post]
  );

  const handlePendingChangesChange = useCallback(
    (changes: Partial<InvitationData>) => {
      post({ type: "wb-countdown-pending", changes });
    },
    [post]
  );

  const handleHasUnsavedChangesChange = useCallback(
    (hasChanges: boolean) => {
      post({ type: "wb-countdown-unsaved", hasChanges });
    },
    [post]
  );

  const handleHeroPendingChangesChange = useCallback(
    (changes: Partial<InvitationData>) => {
      post({ type: "wb-hero-pending", changes });
    },
    [post]
  );

  const handleHeroHasUnsavedChangesChange = useCallback(
    (hasChanges: boolean) => {
      post({ type: "wb-hero-unsaved", hasChanges });
    },
    [post]
  );

  if (!invitation) {
    return (
      <div
        className="flex items-center justify-center text-sm text-gray-400"
        style={{ fontFamily: "Inter, sans-serif", width: "100vw", height: "100vh" }}
      >
        Loading preview&hellip;
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <style>{`
        ::-webkit-scrollbar {
          width: 4px !important;
          background: transparent !important;
          -webkit-appearance: none !important;
        }
        ::-webkit-scrollbar-track {
          background: transparent !important;
          box-shadow: none !important;
        }
        ::-webkit-scrollbar-thumb {
          background: ${accentColor} !important;
          border-radius: 2px !important;
          box-shadow: none !important;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${accentColor} !important;
        }
        ::-webkit-scrollbar-corner {
          background: transparent !important;
        }
        * {
          scrollbar-width: thin !important;
          scrollbar-color: ${accentColor} transparent !important;
        }
      `}</style>
      <LiveEditView
        invitation={invitation}
        onChange={handleChange}
        hasPendingChanges={hasPendingChanges}
        isActive={true}
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        desktopMode={desktopMode}
        panelOpen={false}
        onHasUnsavedChangesChange={handleHasUnsavedChangesChange}
        onPendingChangesChange={handlePendingChangesChange}
        onHeroHasUnsavedChangesChange={handleHeroHasUnsavedChangesChange}
        onHeroPendingChangesChange={handleHeroPendingChangesChange}
        showScreenDimensions={false}
        isEmbeddedFrame={true}
      />
    </div>
  );
}

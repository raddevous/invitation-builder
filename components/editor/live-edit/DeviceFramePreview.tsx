"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Invitation, InvitationData } from "@/lib/types/invitation";

interface DeviceFramePreviewProps {
  device: "mobile" | "tablet";
  invitation: Invitation;
  onChange: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  pendingChanges?: Partial<InvitationData>;
  hasPendingChanges?: boolean;
  pendingEntourageChanges?: any;
  localVisibleSections?: Record<string, boolean>;
  accentColor?: string;
  isDarkMode?: boolean;
  onHasUnsavedChangesChange?: (hasChanges: boolean) => void;
  onPendingChangesChange?: (changes: Partial<InvitationData>) => void;
  onHeroHasUnsavedChangesChange?: (hasChanges: boolean) => void;
  onHeroPendingChangesChange?: (changes: Partial<InvitationData>) => void;
}

// Standard device viewport sizes used by most website builders for accurate preview
const DEVICE_CONFIG: Record<
  "mobile" | "tablet",
  { width: number; height: number; label: string; radius: number; bezel: number }
> = {
  mobile: { width: 390, height: 844, label: "Mobile", radius: 44, bezel: 10 },
  tablet: { width: 768, height: 1024, label: "Tablet / iPad", radius: 28, bezel: 12 },
};

export default function DeviceFramePreview({
  device,
  invitation,
  onChange,
  pendingChanges = {},
  hasPendingChanges = false,
  pendingEntourageChanges,
  localVisibleSections,
  accentColor = "#6998EE",
  isDarkMode = false,
  onHasUnsavedChangesChange,
  onPendingChangesChange,
  onHeroHasUnsavedChangesChange,
  onHeroPendingChangesChange,
}: DeviceFramePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const latestPayloadRef = useRef<Record<string, unknown> | null>(null);
  const config = DEVICE_CONFIG[device];

  // Merge base data with pending changes (mirrors LiveEditView's own mergedData logic)
  // so the device frame always reflects the latest unsaved edits from the rest of the editor.
  const mergedInvitation = useMemo(() => {
    const baseData: InvitationData = { ...invitation.data, ...pendingChanges };
    if (pendingEntourageChanges) {
      baseData.entourage = {
        ...invitation.data.entourage,
        ...pendingEntourageChanges,
        ...pendingChanges.entourage,
        visibleSections: {
          ...invitation.data.entourage?.visibleSections,
          ...pendingEntourageChanges.visibleSections,
          ...localVisibleSections,
        },
      } as InvitationData["entourage"];
    }
    return { ...invitation, data: baseData };
  }, [invitation, pendingChanges, pendingEntourageChanges, localVisibleSections]);

  // Keep the latest payload cached and push it into the iframe on every change.
  // The iframe may not have finished loading yet when this fires early on, in which case
  // the postMessage call is simply a no-op — the cached payload is replayed the moment
  // the iframe signals it's ready (see handleMessage below), so nothing is ever lost.
  useEffect(() => {
    const payload = {
      type: "wb-sync",
      invitation: mergedInvitation,
      hasPendingChanges,
      accentColor,
      isDarkMode,
      // Tablet (768px) crosses the production desktop breakpoint (>=768), so it should
      // use desktop-style layout data, while mobile (390px) stays in mobile mode.
      desktopMode: device === "tablet",
    };
    latestPayloadRef.current = payload;
    iframeRef.current?.contentWindow?.postMessage(payload, window.location.origin);
  }, [mergedInvitation, hasPendingChanges, accentColor, isDarkMode, device]);

  // Listen for edits and readiness signals coming up from the iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const msg = e.data;
      if (!msg || typeof msg !== "object") return;
      switch (msg.type) {
        case "wb-frame-ready":
          if (latestPayloadRef.current) {
            iframeRef.current?.contentWindow?.postMessage(latestPayloadRef.current, window.location.origin);
          }
          break;
        case "wb-change":
          onChange(msg.field, msg.value);
          break;
        case "wb-countdown-pending":
          onPendingChangesChange?.(msg.changes);
          break;
        case "wb-countdown-unsaved":
          onHasUnsavedChangesChange?.(msg.hasChanges);
          break;
        case "wb-hero-pending":
          onHeroPendingChangesChange?.(msg.changes);
          break;
        case "wb-hero-unsaved":
          onHeroHasUnsavedChangesChange?.(msg.hasChanges);
          break;
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onChange, onPendingChangesChange, onHasUnsavedChangesChange, onHeroPendingChangesChange, onHeroHasUnsavedChangesChange]);

  return (
    <div
      className="w-full h-full flex items-center justify-center overflow-auto py-10"
      style={{ backgroundColor: isDarkMode ? "#111827" : "#f3f4f6" }}
    >
      <div className="flex flex-col items-center gap-3">
        <span
          className="text-xs font-medium tracking-wide uppercase"
          style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#9ca3af" : "#6b7280" }}
        >
          {config.label} Preview &middot; {config.width}&times;{config.height}
        </span>
        <div
          className="relative shadow-2xl"
          style={{
            width: config.width + config.bezel * 2,
            height: config.height + config.bezel * 2,
            padding: config.bezel,
            borderRadius: config.radius,
            backgroundColor: "#111827",
            border: "2px solid #030712",
          }}
        >
          <div
            className="w-full h-full overflow-hidden bg-white"
            style={{ borderRadius: Math.max(config.radius - config.bezel, 8) }}
          >
            <iframe
              ref={iframeRef}
              src="/tools/live-frame"
              title={`${config.label} preview`}
              sandbox="allow-scripts allow-same-origin"
              style={{ width: config.width, height: config.height, border: "none", display: "block" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, use, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { Invitation } from "@/lib/types/invitation";
import ToolsTab from "@/components/editor/tabs/ToolsTab";
import EditorPanel from "@/components/editor/EditorPanel";
import { debounce, updateFavicon } from "@/lib/utils";
import { registerPushNotifications } from "@/lib/utils/push";
import { getStoredItem, setStoredItem } from "@/lib/utils/storage";
import { useBackHandler } from "@/lib/hooks/useBackHandler";
import { useSystemTheme } from "@/lib/hooks/useSystemTheme";
import { apiUrl } from "@/lib/utils/api";
import { getCachedInvitation, cacheInvitation, isOnline, queueOfflineSave, flushSaveQueue, setLastUsedSlug } from "@/lib/utils/offline-cache";
import { precacheInvitationMedia, sanitizeMediaForSave } from "@/lib/utils/media-cache";
import { useMediaCache } from "@/lib/hooks/useMediaCache";
import SaveConfirmationDialog from "@/components/shared/SaveConfirmationDialog";

interface AppSettings {
  isDarkMode: boolean;
  accentColor: string;
  hideInstructions?: boolean;
  showScreenDimensions?: boolean;
  isPreviewDetached?: boolean;
}

export default function ToolsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: routeParamSlug } = use(params);
  // When served offline, the native shell serves a generic pre-rendered page
  // (baked with a placeholder "offline" slug — see scripts/build-capacitor.js)
  // for any /tools/<slug> URL, since real slugs can't be statically exported.
  // window.location always reflects the actual requested URL though, so use
  // it to recover the real slug in that case.
  const slug = (() => {
    if (typeof window === "undefined") return routeParamSlug;
    const match = window.location.pathname.match(/^\/tools\/([^/]+)/);
    return match ? decodeURIComponent(match[1]) : routeParamSlug;
  })();
  const router = useRouter();
  const { mode: systemMode } = useSystemTheme();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [slugValid, setSlugValid] = useState<boolean | null>(null);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const [showEditorPanel, setShowEditorPanel] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    isDarkMode: false,
    accentColor: "#6998EE",
    hideInstructions: false,
    showScreenDimensions: false,
    isPreviewDetached: false,
  });
  const [hasStoredSettings, setHasStoredSettings] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [showSaveStatus, setShowSaveStatus] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 });
  const [showUnsavedToolsDialog, setShowUnsavedToolsDialog] = useState(false);
  const { resolvedData: toolsResolvedData } = useMediaCache(invitation?.data ?? null);

  // Redirect to /tools login page if auto-login was attempted but no invitation loaded
  useEffect(() => {
    if (autoLoginAttempted && !invitation) {
      router.replace("/tools");
    }
  }, [autoLoginAttempted, invitation, router]);

  // Back gesture closes unsaved tools dialog
  useBackHandler(showUnsavedToolsDialog, () => setShowUnsavedToolsDialog(false));

  // Snapshot of invitation data for tools-level unsaved changes detection
  const savedDataSnapshot = useRef<string>("");

  // Load invitation and set the saved snapshot synchronously to avoid race condition
  // where hasToolsUnsavedChanges is true before the useEffect runs
  const loadInvitation = (inv: Invitation) => {
    savedDataSnapshot.current = JSON.stringify(inv.data);
    setInvitation(inv);
    // Fire-and-forget: download any not-yet-cached media (images/fonts/music)
    // referenced by this invitation so they're available offline later. Only
    // meaningful while online — skip the wasted network attempts otherwise.
    if (typeof navigator !== "undefined" && navigator.onLine) {
      console.log("[loadInvitation] triggering precacheInvitationMedia for slug:", inv.slug);
      precacheInvitationMedia(inv.data).catch((e) => console.error("[loadInvitation] precache error:", e));
    } else {
      console.log("[loadInvitation] offline, skipping precache for slug:", inv.slug);
    }
  };

  // Check if there are unsaved changes at tools level
  const hasToolsUnsavedChanges = invitation
    ? JSON.stringify(invitation.data) !== savedDataSnapshot.current
    : false;

  // Derive account info for the Settings tab from the invitation record
  const accountInfo = useMemo(() => {
    if (!invitation) return null;
    return {
      email: invitation.email || "",
      name: invitation.clientName || "",
      createdAt: invitation.createdAt || "",
      expiresAt: invitation.expiresAt || "",
    };
  }, [invitation?.email, invitation?.clientName, invitation?.createdAt, invitation?.expiresAt]);

  // Check if editing access has expired
  const isExpired = useMemo(() => {
    if (!invitation?.expiresAt) return false;
    return new Date(invitation.expiresAt) < new Date();
  }, [invitation?.expiresAt]);

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

  // Flush queued saves when internet reconnects
  useEffect(() => {
    const handleOnline = () => {
      flushSaveQueue();
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);

  // Check if slug exists on mount
  useEffect(() => {
    // Guards against a stale run clobbering a newer one — when served
    // offline, the generic pre-rendered shell briefly hydrates with a
    // placeholder "offline" slug before this effect re-runs with the real
    // slug recovered from window.location (see `slug` above). Both runs are
    // async, so without this guard the stale "offline" run's result can
    // resolve after (and overwrite) the correct run's result.
    let cancelled = false;

    async function checkSlug() {
      try {
        const res = await fetch(apiUrl(`/api/invitation/${slug}`));
        if (!cancelled) setSlugValid(res.ok);
      } catch {
        // Offline — check if we have a cached invitation for this slug
        const cached = await getCachedInvitation(slug);
        if (cached) {
          if (!cancelled) setSlugValid(true);
          return;
        }
        // Fall back to the native "invitation" storage key, which is
        // populated whenever the user has ever logged into this invitation
        // (even if the separate offline cache was never written to).
        const stored = await getStoredItem("invitation");
        if (stored) {
          try {
            const parsed: Invitation = JSON.parse(stored);
            if (parsed.slug === slug) {
              if (!cancelled) setSlugValid(true);
              return;
            }
          } catch {
            // ignore invalid stored data
          }
        }
        if (!cancelled) setSlugValid(false);
      }
    }
    checkSlug();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Auto-load invitation from native storage or auth cookie to skip login
  useEffect(() => {
    if (slugValid === false) {
      setAutoLoginAttempted(true);
      return;
    }
    if (!slugValid) return;
    let cancelled = false;

    async function autoLogin() {
      // Try native storage first (fast path)
      const stored = await getStoredItem('invitation');
      if (stored) {
        try {
          const parsed: Invitation = JSON.parse(stored);
          if (parsed.slug === slug) {
            await setLastUsedSlug(slug);
            await cacheInvitation(slug, parsed);
            if (!cancelled) loadInvitation(parsed);
            if (!cancelled) setAutoLoginAttempted(true);
            return;
          }
        } catch {
          // ignore invalid stored data
        }
      }

      // Fallback: verify auth cookie and fetch from server
      try {
        const res = await fetch(apiUrl("/api/auth/verify"), { credentials: "include" });
        if (!res.ok) {
          // Try cache when auth verify fails (offline)
          const cached = await getCachedInvitation(slug);
          if (cached && !cancelled) {
            loadInvitation(cached);
          }
          if (!cancelled) setAutoLoginAttempted(true);
          return;
        }
        const data = await res.json();
        if (data.authenticated && data.invitation && data.invitation.slug === slug) {
          const { isDarkMode, accentColor, ...invitationData } = data.invitation.data;
          const inv = { ...data.invitation, data: invitationData };
          await setStoredItem("invitation", JSON.stringify(inv));
          await setLastUsedSlug(slug);
          await cacheInvitation(slug, inv);
          if (isDarkMode !== undefined || accentColor !== undefined) {
            localStorage.setItem("appSettings", JSON.stringify({
              isDarkMode: systemMode === "dark",
              accentColor: accentColor ?? "#6998EE",
            }));
          }
          if (!cancelled) loadInvitation(inv);
        }
      } catch {
        // Offline — try cached invitation
        const cached = await getCachedInvitation(slug);
        if (cached && !cancelled) {
          loadInvitation(cached);
        }
      }
      if (!cancelled) setAutoLoginAttempted(true);
    }
    autoLogin();
    return () => {
      cancelled = true;
    };
  }, [slugValid, slug]);

  // Fetch invitation by access code (called from EditorLogin)
  const fetchInvitationByAccessCode = async (accessCode: string): Promise<Invitation | null> => {
    try {
      const res = await fetch(apiUrl("/api/auth/access-code"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode }),
        credentials: "include",
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
    updateFavicon(toolsResolvedData?.heroIcon ?? invitation?.data?.heroIcon);
  }, [toolsResolvedData?.heroIcon, invitation?.data?.heroIcon]);

  useEffect(() => {
    // Load settings from localStorage, or use system theme if none exist
    const storedSettings = localStorage.getItem('appSettings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        setSettings(parsed);
        setHasStoredSettings(true);
      } catch (error) {
        console.error('Failed to parse stored settings:', error);
        setSettings(prev => ({ ...prev, isDarkMode: systemMode === "dark" }));
      }
    } else {
      setSettings(prev => ({ ...prev, isDarkMode: systemMode === "dark" }));
    }
  }, [slug, systemMode]);

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

  // Save and leave to editor
  const handleToolsSaveAndLeave = async () => {
    if (invitation) {
      await saveToSupabase(invitation);
    }
    setShowEditorPanel(true);
  };

  // Discard changes and leave to editor
  const handleToolsDiscardAndLeave = () => {
    if (invitation) {
      const snapshot = JSON.parse(savedDataSnapshot.current);
      setInvitation({ ...invitation, data: snapshot });
    }
    setShowEditorPanel(true);
  };

  // Immediate save function to Supabase
  const saveToSupabase = async (inv: Invitation) => {
    setSaveStatus("saving");
    setShowSaveStatus(true);

    // Offline — queue the save and update cache locally
    if (!isOnline()) {
      const { isDarkMode, accentColor, ...rawDataToSave } = inv.data;
      const dataToSave = await sanitizeMediaForSave(rawDataToSave);
      await queueOfflineSave(inv.slug, inv.id, dataToSave as Record<string, unknown>);
      await cacheInvitation(inv.slug, inv);
      setSaveStatus("saved");
      savedDataSnapshot.current = JSON.stringify(inv.data);
      await setStoredItem('invitation', JSON.stringify(inv));
      return;
    }

    try {
      // Exclude settings from the data being saved to Supabase, and reverse
      // any device-local cached media URIs back to their original remote
      // URL (or drop them if unmappable) so they never get persisted
      const { isDarkMode, accentColor, ...rawDataToSave } = inv.data;
      const dataToSave = await sanitizeMediaForSave(rawDataToSave);
      const res = await fetch(apiUrl(`/api/invitation/${inv.slug}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: inv.id, data: dataToSave }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveStatus("saved");
      // Update snapshot after successful save
      savedDataSnapshot.current = JSON.stringify(inv.data);
      // Update native storage with the saved data
      await setStoredItem('invitation', JSON.stringify(inv));
      // Also update offline cache
      await cacheInvitation(inv.slug, inv);
    } catch {
      // Network error — queue for later
      const { isDarkMode, accentColor, ...rawDataToSave } = inv.data;
      const dataToSave = await sanitizeMediaForSave(rawDataToSave);
      await queueOfflineSave(inv.slug, inv.id, dataToSave as Record<string, unknown>);
      await cacheInvitation(inv.slug, inv);
      setSaveStatus("saved");
      savedDataSnapshot.current = JSON.stringify(inv.data);
      await setStoredItem('invitation', JSON.stringify(inv));
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
            style={{ borderColor: "#6998EE", borderTopColor: "transparent" }}
          />
          <p
            className="text-sm italic"
            style={{ color: "#6998EE", fontFamily: "Inter, sans-serif" }}
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
    return null;
  }

  if (showEditorPanel) {
    return (
      <EditorPanel
        invitation={invitation}
        onBack={(updatedInvitation) => {
          if (updatedInvitation) {
            loadInvitation(updatedInvitation);
          }
          setShowEditorPanel(false);
        }}
        showScreenDimensions={settings.showScreenDimensions}
        isExpired={isExpired}
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
          data={toolsResolvedData || invitation.data}
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
            setStoredItem("themeOverride", newSettings.isDarkMode ? "dark" : "light");
          }}
          hideInstructions={settings.hideInstructions}
          showScreenDimensions={settings.showScreenDimensions}
          isPreviewDetached={settings.isPreviewDetached}
          accountInfo={accountInfo}
          isExpired={isExpired}
        />
      </div>

      {/* Unsaved tools changes dialog - shown when trying to leave tools section */}
      <SaveConfirmationDialog
        isOpen={showUnsavedToolsDialog}
        pendingChangesCount={1}
        isDarkMode={settings.isDarkMode}
        accentColor={settings.accentColor}
        onSave={handleToolsSaveAndLeave}
        onDiscard={handleToolsDiscardAndLeave}
        onClose={() => setShowUnsavedToolsDialog(false)}
      />
    </div>
  );
}

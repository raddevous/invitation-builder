"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Invitation, InvitationData } from "@/lib/types/invitation";
import { supabase } from "@/lib/supabase/client";
import { debounce, buildInviteUrl } from "@/lib/utils";
import EventDetailsTab from "./tabs/EventDetailsTab";
import SectionsTab from "./tabs/SectionsTab";
import LiveEditView from "./live-edit/LiveEditView";
import DesignTab from "./tabs/DesignTab";
import SaveConfirmationDialog from "@/components/shared/SaveConfirmationDialog";

type TabId = "details" | "sections" | "live" | "design";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "details", label: "Details", icon: "/assets/ico-inf.png" },
  { id: "design", label: "Design", icon: "/assets/ico-desn.png" },
  { id: "sections", label: "Sections", icon: "/assets/ico-sect.png" },
  { id: "live", label: "Live", icon: "/assets/ico-live.png" },
];

interface EditorPanelProps {
  invitation: Invitation;
  onBack?: () => void;
  showScreenDimensions?: boolean;
}

export default function EditorPanel({ invitation: initial, onBack, showScreenDimensions = false }: EditorPanelProps) {
  const [invitation, setInvitation] = useState<Invitation>(initial);
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [showSaveStatus, setShowSaveStatus] = useState(false);
  const [hasEverSaved, setHasEverSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [accentColor, setAccentColor] = useState("#2563EB");
  const [desktopMode, setDesktopMode] = useState(false);
  const [panelPosition, setPanelPosition] = useState<"left" | "right">(initial.data.editorPanelPosition ?? "left");
  const [panelExpanded, setPanelExpanded] = useState(initial.data.editorPanelExpanded ?? false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [isEditorClosing, setIsEditorClosing] = useState(false);
  const [isEditorOpening, setIsEditorOpening] = useState(false);
  const [editorManuallyClosed, setEditorManuallyClosed] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [pendingEntourageChanges, setPendingEntourageChanges] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingCountdownChanges, setPendingCountdownChanges] = useState<Partial<InvitationData>>({});
  const [pendingHeroChanges, setPendingHeroChanges] = useState<Partial<InvitationData>>({});
  const [pendingChanges, setPendingChanges] = useState<Partial<InvitationData>>({});
  const pendingChangesRef = useRef<Partial<InvitationData>>({});
  const [localVisibleSections, setLocalVisibleSections] = useState<Record<string, boolean>>({});
  const isSavingRef = useRef(false);
  const [showSaveConfirmationDialog, setShowSaveConfirmationDialog] = useState(false);
  const [hideSaveConfirmationDialog, setHideSaveConfirmationDialog] = useState(false);
  const [hideInstructions, setHideInstructions] = useState(false);
  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 });
  const [localShowScreenDimensions, setLocalShowScreenDimensions] = useState(showScreenDimensions);

  // Sync invitation state with prop when it changes (e.g., when refetched from tools page)
  useEffect(() => {
    setInvitation(initial);
    // Clear pending states when invitation is updated from external source
    setPendingEntourageChanges(null);
    setLocalVisibleSections({});
    setPendingChanges({});
    setPendingCountdownChanges({});
    setPendingHeroChanges({});
    setHasUnsavedChanges(false);
  }, [initial]);

  // Trigger opening animation on mount
  useEffect(() => {
    setHasMounted(true);
    setPanelOpen(true);
    setIsEditorOpening(true);
    const timer = setTimeout(() => {
      setIsEditorOpening(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Load settings from localStorage on mount
  useEffect(() => {
    const storedSettings = localStorage.getItem('appSettings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        setIsDarkMode(parsed.isDarkMode ?? true);
        setAccentColor(parsed.accentColor ?? "#2563EB");
        setHideSaveConfirmationDialog(parsed.hideSaveConfirmationDialog ?? false);
        setHideInstructions(parsed.hideInstructions ?? false);
        setLocalShowScreenDimensions(parsed.showScreenDimensions ?? false);
      } catch (error) {
        console.error('Failed to parse stored settings:', error);
      }
    }
  }, []);

  // Track screen dimensions for overlay
  useEffect(() => {
    const updateDimensions = () => {
      setScreenDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Auto-detect desktop/mobile mode based on screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const isDesktop = window.innerWidth >= 1024;
      setDesktopMode(isDesktop);
    };

    // Check on mount
    checkScreenSize();

    // Listen for resize events
    const handleResize = () => {
      checkScreenSize();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Trigger opening animation when panel reopens
  useEffect(() => {
    if (hasMounted && panelOpen && !isEditorClosing && !isEditorOpening && !editorManuallyClosed) {
      setIsEditorOpening(true);
      const timer = setTimeout(() => {
        setIsEditorOpening(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [panelOpen, isEditorClosing, isEditorOpening, editorManuallyClosed, hasMounted]);

  const handleEditorClose = () => {
    setEditorManuallyClosed(true);
    setIsEditorClosing(true);
    setTimeout(() => {
      setPanelOpen(false);
      setIsEditorClosing(false);
    }, 300);
  };

  const handleResetEditorManuallyClosed = () => {
    setEditorManuallyClosed(false);
  };

  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
  };

  // Subscribe to realtime updates from other sessions
  useEffect(() => {
    const channel = supabase
      .channel(`invitation:${invitation.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "invitations",
          filter: `id=eq.${invitation.id}`,
        },
        (payload) => {
          console.log('[EditorPanel] Realtime update received:', payload);
          // Ignore realtime updates if we're currently saving (to prevent overwriting our own changes)
          if (isSavingRef.current) {
            console.log('[EditorPanel] Ignoring realtime update during save');
            return;
          }
          // Only update if the new data is different from our current data
          if (payload.new && JSON.stringify(payload.new.data) !== JSON.stringify(invitation.data)) {
            console.log('[EditorPanel] Updating from realtime (data changed)');
            setInvitation((prev) => ({
              ...prev,
              data: payload.new.data as InvitationData,
            }));
          } else {
            console.log('[EditorPanel] Ignoring realtime update (data unchanged)');
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[EditorPanel] Unsubscribing from realtime updates');
      supabase.removeChannel(channel);
    };
  }, [invitation.id, invitation.data]);

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

  const hasPendingChanges =
    hasUnsavedChanges ||
    Object.keys(pendingChanges).length > 0 ||
    Object.keys(pendingCountdownChanges).length > 0 ||
    Object.keys(pendingHeroChanges).length > 0 ||
    Object.keys(pendingEntourageChanges || {}).length > 0;

  // Prevent closing tab/browser when there are pending changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPendingChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasPendingChanges]);

  // Update CSS variable for accent color
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', accentColor);
  }, [accentColor]);

  // Keep a ref in sync with pendingChanges so the debounced save can read the latest value
  useEffect(() => {
    pendingChangesRef.current = pendingChanges;
  }, [pendingChanges]);

  // Debounced save function
  const saveRef = useRef(
    debounce(async (id: string, slug: string, data: InvitationData, shouldCallCallback: boolean = false) => {
      setSaveStatus("saving");
      isSavingRef.current = true;
      try {
        // Merge any queued pending changes with the data being saved
        const dataToSave = { ...data, ...pendingChangesRef.current };
        // Exclude settings from the data being saved to Supabase
        const { isDarkMode, accentColor, ...finalDataToSave } = dataToSave;
        console.log('[EditorPanel] Saving:', { id, slug, dataKeys: Object.keys(finalDataToSave) });
        console.log('[EditorPanel] Sample data values:', {
          hisName: finalDataToSave.hisName,
          herName: finalDataToSave.herName,
          date: finalDataToSave.date,
          mainColor1: finalDataToSave.mainColor1
        });
        const res = await fetch(`/api/invitation/${slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invitationId: id, data: finalDataToSave }),
        });
        console.log('[EditorPanel] Save response:', res.status);
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error('[EditorPanel] Save failed:', errorData);
          throw new Error("Save failed");
        }
        setSaveStatus("saved");
        setHasUnsavedChanges(false);
        setHasEverSaved(true);
        // Clear pending changes now that they are committed
        setPendingChanges({});
      } catch (error) {
        console.error('[EditorPanel] Save error:', error);
        setSaveStatus("error");
      } finally {
        // Clear isSaving flag after a short delay to allow realtime updates from other sessions
        setTimeout(() => { isSavingRef.current = false; }, 2000);
      }
    }, 2000) as (id: string, slug: string, data: InvitationData) => void
  );

  const handleChange = useCallback(
    (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => {
      setHasUnsavedChanges(true);
      setInvitation((prev) => {
        const newData = { ...prev.data, [field]: value };
        saveRef.current(prev.id, prev.slug, newData);
        return { ...prev, data: newData };
      });
      // Don't set saving status here - let the debounced function handle it
    },
    []
  );

  // Helper function to deep compare values
  const isValueEqual = useCallback((a: any, b: any): boolean => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;
    if (typeof a === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    return false;
  }, []);

  // Queue a change to the global pending state instead of saving immediately
  const queueChange = useCallback(
    (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => {
      const originalValue = invitation.data[field];
      
      setPendingChanges((prev) => {
        // If the new value matches the original, remove it from pending
        if (isValueEqual(value, originalValue)) {
          const newPending = { ...prev };
          delete newPending[field];
          return newPending;
        }
        // Otherwise, add/update it in pending
        return { ...prev, [field]: value };
      });
    },
    [invitation.data, isValueEqual]
  );

  // Immediate save function (bypasses debounce)
  const handleImmediateSave = useCallback(async () => {
    setSaveStatus("saving");
    isSavingRef.current = true;
    try {
      // Apply pending countdown, hero, general pending, and entourage changes to the data we're saving
      const dataToSave = { ...invitation.data, ...pendingChanges, ...pendingCountdownChanges, ...pendingHeroChanges };

      // Merge entourage pending state and visible sections into the entourage object
      const pendingEntourage = pendingChanges.entourage || pendingEntourageChanges || dataToSave.entourage;
      const visibleSections = { ...pendingEntourage?.visibleSections, ...localVisibleSections };
      dataToSave.entourage = { ...pendingEntourage, visibleSections };

      // Exclude settings from the data being saved to Supabase
      const { isDarkMode, accentColor, ...finalDataToSave } = dataToSave;

      console.log('[EditorPanel] Immediate save:', { id: invitation.id, slug: invitation.slug, dataKeys: Object.keys(finalDataToSave) });

      // Update local state
      if (Object.keys(pendingChanges).length > 0 || Object.keys(pendingCountdownChanges).length > 0 || Object.keys(pendingHeroChanges).length > 0 || pendingEntourageChanges || Object.keys(localVisibleSections).length > 0) {
        setInvitation((prev) => ({
          ...prev,
          data: dataToSave,
        }));
        setPendingChanges({});
        setPendingCountdownChanges({});
        setPendingHeroChanges({});
        setPendingEntourageChanges(null);
        setLocalVisibleSections({});
      }

      const res = await fetch(`/api/invitation/${invitation.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: invitation.id, data: finalDataToSave }),
      });
      console.log('[EditorPanel] Immediate save response:', res.status);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('[EditorPanel] Immediate save failed:', errorData);
        throw new Error("Save failed");
      }
      setSaveStatus("saved");
      setHasUnsavedChanges(false);
      setHasEverSaved(true);
    } catch (error) {
      console.error('[EditorPanel] Immediate save error:', error);
      setSaveStatus("error");
    } finally {
      setTimeout(() => { isSavingRef.current = false; }, 2000);
    }
  }, [invitation.id, invitation.slug, invitation.data, pendingChanges, pendingCountdownChanges, pendingHeroChanges]);

  // Apply pending changes and save immediately
  const handleApplyPendingChanges = useCallback(async () => {
    if (hideSaveConfirmationDialog) {
      // If setting is on, save immediately without dialog
      await handleImmediateSave();
    } else {
      // Otherwise, show confirmation dialog
      setShowSaveConfirmationDialog(true);
    }
  }, [handleImmediateSave, hideSaveConfirmationDialog]);

  // Handle save from confirmation dialog
  const handleSaveFromDialog = useCallback(async () => {
    await handleImmediateSave();
  }, [handleImmediateSave]);

  // Handle discard from confirmation dialog
  const handleDiscardFromDialog = useCallback(() => {
    setPendingChanges({});
    setPendingCountdownChanges({});
    setPendingHeroChanges({});
    setPendingEntourageChanges(null);
    setLocalVisibleSections({});
    setHasUnsavedChanges(false);
  }, []);

  // Handle hide save confirmation dialog change
  const handleHideSaveConfirmationDialogChange = useCallback((value: boolean) => {
    setHideSaveConfirmationDialog(value);
    // Save to localStorage
    const storedSettings = localStorage.getItem('appSettings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        parsed.hideSaveConfirmationDialog = value;
        localStorage.setItem('appSettings', JSON.stringify(parsed));
      } catch (error) {
        console.error('Failed to update stored settings:', error);
      }
    }
  }, []);

  // Handler for countdown unsaved changes notification
  const handleCountdownUnsavedChangesChange = useCallback((hasChanges: boolean) => {
    setHasUnsavedChanges(hasChanges);
  }, []);

  // Handler for countdown pending changes notification
  const handleCountdownPendingChangesChange = useCallback((changes: Partial<InvitationData>) => {
    setPendingCountdownChanges((prev) => {
      const filtered: Partial<InvitationData> = {};
      for (const [key, value] of Object.entries(changes)) {
        const originalValue = invitation.data[key as keyof InvitationData];
        // Only keep the change if it differs from the original or original is undefined
        if (originalValue === undefined || !isValueEqual(value, originalValue)) {
          (filtered as any)[key] = value;
        }
      }
      return { ...prev, ...filtered };
    });
  }, [invitation.data, isValueEqual]);

  // Handler for hero pending changes notification
  const handleHeroUnsavedChangesChange = useCallback((hasChanges: boolean) => {
    setHasUnsavedChanges(hasChanges);
  }, []);

  // Handler for hero pending changes notification
  const handleHeroPendingChangesChange = useCallback((changes: Partial<InvitationData>) => {
    setPendingHeroChanges((prev) => {
      const filtered: Partial<InvitationData> = {};
      for (const [key, value] of Object.entries(changes)) {
        const originalValue = invitation.data[key as keyof InvitationData];
        // Only keep the change if it differs from the original or original is undefined
        if (originalValue === undefined || !isValueEqual(value, originalValue)) {
          (filtered as any)[key] = value;
        }
      }
      return { ...prev, ...filtered };
    });
  }, [invitation.data, isValueEqual]);

  // Handler for entourage pending changes notification
  const handlePendingEntourageChange = useCallback((changes: any) => {
    setPendingEntourageChanges((prev: any) => {
      const originalEntourage = invitation.data.entourage || {};
      const filtered: any = {};
      
      // Filter nested changes
      for (const [key, value] of Object.entries(changes)) {
        if (key === 'visibleSections') {
          // Filter visible sections that differ from original
          const originalVisible = originalEntourage.visibleSections || {};
          const filteredVisible: Record<string, boolean> = {};
          for (const [section, checked] of Object.entries(value as Record<string, boolean>)) {
            if ((originalVisible as any)[section] !== checked) {
              filteredVisible[section] = checked;
            }
          }
          if (Object.keys(filteredVisible).length > 0) {
            filtered.visibleSections = filteredVisible;
          }
        } else {
          // For other entourage fields, compare with original
          if (!isValueEqual(value, (originalEntourage as any)[key])) {
            filtered[key] = value;
          }
        }
      }
      
      return { ...prev, ...filtered };
    });
  }, [invitation.data, isValueEqual]);

  // Handler for local visible sections changes
  const handleLocalVisibleSectionsChange = useCallback((sections: Record<string, boolean>) => {
    const originalVisible = invitation.data.entourage?.visibleSections || {};
    const filtered: Record<string, boolean> = {};
    
    for (const [section, checked] of Object.entries(sections)) {
      if ((originalVisible as any)[section] !== checked) {
        filtered[section] = checked;
      }
    }
    
    setLocalVisibleSections(filtered);
  }, [invitation.data, isValueEqual]);

  // Handle back / exit with pending changes check
  const handleBack = () => {
    if (hasPendingChanges) {
      setShowUnsavedDialog(true);
    } else {
      onBack?.();
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    // Reset invitation data to original state
    setInvitation(initial);
    setHasUnsavedChanges(false);
    setPendingChanges({});
    setPendingCountdownChanges({});
    setPendingHeroChanges({});
    setPendingEntourageChanges(null);
    setLocalVisibleSections({});
    onBack?.();
  };

  const handleSaveAndExit = async () => {
    setShowUnsavedDialog(false);
    await handleImmediateSave();
    // Wait to show the save result before exiting
    await new Promise(resolve => setTimeout(resolve, 1500));
    onBack?.();
  };

  const copyInviteLink = () => {
    const url = buildInviteUrl(invitation.slug);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const inviteUrl = buildInviteUrl(invitation.slug);

  const pendingChangesCount = (() => {
    let count =
      Object.keys(pendingChanges).length +
      Object.keys(pendingCountdownChanges).length +
      Object.keys(pendingHeroChanges).length +
      Object.keys(pendingEntourageChanges || {}).length +
      Object.keys(localVisibleSections).length;
    if (count === 0 && hasUnsavedChanges) count = 1;
    return count;
  })();

  // Tab descriptions for mobile header
  const getTabDescription = (tab: TabId): string => {
    switch (tab) {
      case "details":
        return "Fill in the important wedding information to display on your website";
      case "design":
        return "Choose your welcome screen, default typography and color";
      case "sections":
        return "Choose what invitation feature to show on your website";
      case "live":
        return "Live preview of your invitation";
      default:
        return "";
    }
  };

  // Filter tabs for desktop mode (exclude live tab)
  const desktopTabs = TABS.filter((tab) => tab.id !== "live");

  const handleToggleScreenDimensions = () => {
    const newValue = !localShowScreenDimensions;
    setLocalShowScreenDimensions(newValue);
    // Save to localStorage
    const storedSettings = localStorage.getItem('appSettings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        parsed.showScreenDimensions = newValue;
        localStorage.setItem('appSettings', JSON.stringify(parsed));
      } catch (error) {
        console.error('Failed to update stored settings:', error);
      }
    } else {
      localStorage.setItem('appSettings', JSON.stringify({ isDarkMode, accentColor, showScreenDimensions: newValue }));
    }
  };

  const panelWidth = panelExpanded ? "400px" : "350px";

  return (
    <div className={`flex h-screen w-full bg-transparent relative ${desktopMode ? "" : "flex-col"}`} style={desktopMode ? {} : { maxWidth: "100%", margin: "0 auto" }}>
      {/* Screen dimensions overlay - global */}
      {localShowScreenDimensions && (
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

      {/* Mobile header - fixed, non-scrollable, at top */}
      {!desktopMode && activeTab !== "live" && (
        <div className={`p-4 border-b shrink-0 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={handleBack}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
                title="Back to Tools"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <h2 className="text-lg font-semibold" style={{ fontFamily: "Inter, sans-serif", color: accentColor }}>
                Wedding Website
              </h2>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                {getTabDescription(activeTab)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Left/Right sidebar for desktop mode */}
      {desktopMode && (panelOpen || isEditorClosing) && (
        <div className={`shrink-0 ${isDarkMode ? (isEditorClosing ? "bg-transparent" : "bg-gray-800") : (isEditorClosing ? "bg-transparent" : "bg-white")} ${isEditorClosing ? "" : (panelPosition === "left" ? "border-r" : "border-l")} ${isEditorClosing ? "" : "border-gray-100"} no-print flex flex-col overflow-hidden ${
          isEditorClosing 
            ? "animate-fade-out"
            : isEditorOpening
              ? "animate-fade-in"
              : ""
        }`} style={{ width: panelWidth, order: panelPosition === "left" ? 0 : 2 }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={handleBack}
                  className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
                  title="Back to Tools"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h2 className={`text-lg font-semibold ${isDarkMode ? "text-gray-200" : "text-[#5c4a3a]"}`} style={{ fontFamily: "Inter, sans-serif" }}>Editor</h2>
            </div>
            <div className="flex items-center gap-1">
              {/* Toggle position button */}
              <button
                onClick={() => {
                  const newPosition = panelPosition === "left" ? "right" : "left";
                  setPanelPosition(newPosition);
                  handleChange("editorPanelPosition", newPosition);
                }}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
                title={panelPosition === "left" ? "Move to right" : "Move to left"}
              >
                <div className="w-5 h-5" style={{
                  backgroundColor: isDarkMode ? "#9ca3af" : "#9ca3af",
                  WebkitMaskImage: `url(/assets/${panelPosition === "left" ? "ico-right" : "ico-left"}.png)`,
                  WebkitMaskSize: "contain",
                  WebkitMaskPosition: "center",
                  WebkitMaskRepeat: "no-repeat",
                  maskImage: `url(/assets/${panelPosition === "left" ? "ico-right" : "ico-left"}.png)`,
                  maskSize: "contain",
                  maskPosition: "center",
                  maskRepeat: "no-repeat"
                }} />
              </button>
              {/* Expand button */}
              <button
                onClick={() => {
                  const newExpanded = !panelExpanded;
                  setPanelExpanded(newExpanded);
                  handleChange("editorPanelExpanded", newExpanded);
                }}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
                title={panelExpanded ? "Collapse" : "Expand"}
              >
                <div className="w-5 h-5" style={{
                  backgroundColor: isDarkMode ? "#9ca3af" : "#9ca3af",
                  WebkitMaskImage: `url(/assets/${panelExpanded ? "ico-collapse-p" : "ico-expand-p"}.png)`,
                  WebkitMaskSize: "contain",
                  WebkitMaskPosition: "center",
                  WebkitMaskRepeat: "no-repeat",
                  maskImage: `url(/assets/${panelExpanded ? "ico-collapse-p" : "ico-expand-p"}.png)`,
                  maskSize: "contain",
                  maskPosition: "center",
                  maskRepeat: "no-repeat"
                }} />
              </button>
              {/* Close button */}
              <button
                onClick={handleEditorClose}
                className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
                title="Close panel"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Tab content in sidebar */}
          <div className={`flex-1 overflow-y-auto ${activeTab !== "live" ? "editor-font" : ""} ${isDarkMode && activeTab !== "live" ? "bg-gray-800" : "bg-transparent"} p-4`}>
            {activeTab === "design" && (
              <DesignTab data={invitation.data} onChange={queueChange} isDarkMode={isDarkMode} accentColor={accentColor} />
            )}
            {activeTab === "details" && (
              <EventDetailsTab data={invitation.data} onChange={queueChange} isDarkMode={isDarkMode} accentColor={accentColor} />
            )}
            {activeTab === "sections" && (
              <SectionsTab 
                data={{
                  ...invitation.data,
                  ...pendingChanges,
                  ...pendingCountdownChanges,
                  ...pendingHeroChanges,
                  entourage: {
                    ...invitation.data.entourage,
                    ...pendingEntourageChanges,
                    ...pendingChanges.entourage,
                    visibleSections: {
                      ...invitation.data.entourage?.visibleSections,
                      ...localVisibleSections
                    }
                  }
                }}
                onChange={queueChange}
                isDarkMode={isDarkMode}
                accentColor={accentColor}
                onPendingEntourageChange={handlePendingEntourageChange}
                onLocalVisibleSectionsChange={handleLocalVisibleSectionsChange}
                invitationId={invitation.id}
              />
            )}
          </div>
          
          {/* Navigation tabs at bottom */}
          <nav className="px-2 pb-2 pt-2 flex gap-1 border-t" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
            {desktopTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id 
                    ? "bg-[#b88a78]/10 text-[#b88a78]" 
                    : (isDarkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-50")
                }`}
                style={{ color: activeTab === tab.id ? accentColor : undefined }}
              >
                <div className="w-5 h-5" style={{
                  backgroundColor: activeTab === tab.id ? accentColor : (isDarkMode ? "#9ca3af" : "#9ca3af"),
                  WebkitMaskImage: `url(${tab.icon})`,
                  WebkitMaskSize: "contain",
                  WebkitMaskPosition: "center",
                  WebkitMaskRepeat: "no-repeat",
                  maskImage: `url(${tab.icon})`,
                  maskSize: "contain",
                  maskPosition: "center",
                  maskRepeat: "no-repeat"
                }} />
                <span className="text-[10px] font-sans">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Main content area */}
      <div className={`relative flex-1 ${activeTab === "live" ? "overflow-hidden" : "overflow-y-auto"} ${activeTab !== "live" ? "editor-font" : ""} ${isDarkMode && activeTab !== "live" ? "bg-gray-800" : "bg-transparent"}`} style={desktopMode ? { order: 1 } : {}}>
        <LiveEditView
          invitation={invitation}
          onChange={queueChange}
          pendingChanges={pendingChanges}
          hasPendingChanges={hasPendingChanges}
          isActive={activeTab === "live" || desktopMode}
          saveStatus={saveStatus}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          accentColor={accentColor}
          setAccentColor={setAccentColor}
          desktopMode={desktopMode}
          setDesktopMode={setDesktopMode}
          panelOpen={panelOpen}
          setPanelOpen={setPanelOpen}
          onSetActiveTab={(tab) => setActiveTab(tab as TabId)}
          panelPosition={panelPosition}
          editorManuallyClosed={editorManuallyClosed}
          onResetEditorManuallyClosed={handleResetEditorManuallyClosed}
          pendingEntourageChanges={pendingEntourageChanges}
          localVisibleSections={localVisibleSections}
          onHasUnsavedChangesChange={handleCountdownUnsavedChangesChange}
          onPendingChangesChange={handleCountdownPendingChangesChange}
          onHeroHasUnsavedChangesChange={handleHeroUnsavedChangesChange}
          onHeroPendingChangesChange={handleHeroPendingChangesChange}
          onBack={handleBack}
          showScreenDimensions={localShowScreenDimensions}
          onToggleScreenDimensions={handleToggleScreenDimensions}
        />

        {/* Universal Apply button - appears when there are pending changes */}
        {hasPendingChanges && (
          <button
            onClick={handleApplyPendingChanges}
            disabled={saveStatus === "saving"}
            aria-label={saveStatus === "saving" ? "Saving..." : `Apply ${pendingChangesCount} pending change${pendingChangesCount === 1 ? "" : "s"}`}
            title={saveStatus === "saving" ? "Saving..." : `Apply ${pendingChangesCount} pending change${pendingChangesCount === 1 ? "" : "s"}`}
            className={`${desktopMode ? "absolute" : "fixed"} top-4 right-4 z-[60] no-print p-4 rounded-full shadow-lg transition-opacity backdrop-blur-sm ${saveStatus === "saving" ? "opacity-70 cursor-wait" : ""}`}
            style={{ backgroundColor: accentColor }}
          >
            <div className="relative">
              <img
                src="/assets/ico-sav.png"
                alt="Save"
                className="w-7 h-7"
              />
              {pendingChangesCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold rounded-full bg-white/80 border"
                  style={{ color: accentColor, borderColor: accentColor, fontFamily: "Inter, sans-serif" }}
                >
                  {pendingChangesCount}
                </span>
              )}
            </div>
          </button>
        )}

        {!desktopMode && (
          /* Mobile tab content - scrollable */
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "design" && (
              <DesignTab data={invitation.data} onChange={queueChange} isDarkMode={isDarkMode} accentColor={accentColor} />
            )}
            {activeTab === "details" && (
              <EventDetailsTab data={invitation.data} onChange={queueChange} isDarkMode={isDarkMode} accentColor={accentColor} />
            )}
            {activeTab === "sections" && (
              <SectionsTab 
                data={{
                  ...invitation.data,
                  ...pendingChanges,
                  ...pendingCountdownChanges,
                  ...pendingHeroChanges,
                  entourage: {
                    ...invitation.data.entourage,
                    ...pendingEntourageChanges,
                    ...pendingChanges.entourage,
                    visibleSections: {
                      ...invitation.data.entourage?.visibleSections,
                      ...localVisibleSections
                    }
                  }
                }}
                onChange={queueChange}
                isDarkMode={isDarkMode}
                accentColor={accentColor}
                onPendingEntourageChange={handlePendingEntourageChange}
                onLocalVisibleSectionsChange={handleLocalVisibleSectionsChange}
                invitationId={invitation.id}
              />
            )}
          </div>
        )}
      </div>

      {/* Bottom navigation tabs - only show in mobile mode */}
      {!desktopMode && (
        <nav className={`${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"} border-t shrink-0 no-print`}>
          <div className="flex">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs transition-colors ${
                  activeTab === tab.id ? "text-[#b88a78]" : (isDarkMode ? "text-gray-400" : "text-gray-400")
                }`}
                style={{ color: activeTab === tab.id ? accentColor : undefined }}
              >
                <div className="w-5 h-5" style={{
                  backgroundColor: activeTab === tab.id ? accentColor : (isDarkMode ? "#9ca3af" : "#9ca3af"),
                  WebkitMaskImage: `url(${tab.icon})`,
                  WebkitMaskSize: "contain",
                  WebkitMaskPosition: "center",
                  WebkitMaskRepeat: "no-repeat",
                  maskImage: `url(${tab.icon})`,
                  maskSize: "contain",
                  maskPosition: "center",
                  maskRepeat: "no-repeat"
                }} />
                <span className="text-[10px] font-sans">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="w-1 h-1 rounded-full mt-0.5" style={{ backgroundColor: accentColor }} />
                )}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Unsaved changes dialog */}
      {showUnsavedDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${isDarkMode ? "bg-gray-800" : "bg-white"} rounded-xl p-6 max-w-sm w-full`}>
            <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              Unsaved Changes
            </h3>
            <p className={`text-sm mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
              You have <span className="font-bold" style={{ color: accentColor }}>{pendingChangesCount}</span> unsaved change{pendingChangesCount === 1 ? "" : "s"}. Exit without saving?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDiscardChanges}
                className={`flex-1 px-4 py-2 border rounded-lg text-sm transition-colors ${
                  isDarkMode 
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700" 
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Discard
              </button>
              <button
                onClick={handleSaveAndExit}
                className="flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors"
                style={{ backgroundColor: accentColor, fontFamily: "Inter, sans-serif" }}
              >
                Save Change{pendingChangesCount === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save confirmation dialog */}
      <SaveConfirmationDialog
        isOpen={showSaveConfirmationDialog}
        pendingChangesCount={pendingChangesCount}
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        hideSaveConfirmationDialog={hideSaveConfirmationDialog}
        onSave={handleSaveFromDialog}
        onDiscard={handleDiscardFromDialog}
        onClose={() => setShowSaveConfirmationDialog(false)}
        onHideSaveConfirmationDialogChange={handleHideSaveConfirmationDialogChange}
      />
    </div>
  );
}

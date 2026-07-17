"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { Invitation, InvitationData, ImageTransform } from "@/lib/types/invitation";
import { EditModeContext, EditField } from "@/components/invitation/EditModeContext";
import ImagePickerSheet from "./ImagePickerSheet";
import InvitationTemplate from "@/components/invitation/InvitationTemplate";
import DividerSettingsPanel from "@/components/shared/DividerSettingsPanel";
import { clearDemoInvitation } from "@/lib/demo/demo-data";
import { usePredefinedOptions } from "@/lib/hooks/usePredefinedOptions";

interface LiveEditViewProps {
  invitation: Invitation;
  onChange: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  isActive?: boolean;
  saveStatus?: "saved" | "saving" | "error";
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  accentColor?: string;
  setAccentColor?: (color: string) => void;
  desktopMode?: boolean;
  setDesktopMode?: (mode: boolean) => void;
  panelOpen?: boolean;
  setPanelOpen?: (open: boolean) => void;
  onSetActiveTab?: (tab: string) => void;
  panelPosition?: "left" | "right";
  editorManuallyClosed?: boolean;
  onResetEditorManuallyClosed?: () => void;
  pendingChanges?: Partial<InvitationData>;
  pendingEntourageChanges?: any;
  localVisibleSections?: Record<string, boolean>;
  hasPendingChanges?: boolean;
  onHasUnsavedChangesChange?: (hasChanges: boolean) => void;
  onPendingChangesChange?: (changes: Partial<InvitationData>) => void;
  onHeroHasUnsavedChangesChange?: (hasChanges: boolean) => void;
  onHeroPendingChangesChange?: (changes: Partial<InvitationData>) => void;
  onBack?: () => void;
  showScreenDimensions?: boolean;
  onToggleScreenDimensions?: () => void;
  isDemoMode?: boolean;
}

export default function LiveEditView({ invitation, onChange, isActive = true, saveStatus = "saved", isDarkMode = false, onToggleDarkMode, accentColor = "#B88A78", setAccentColor, desktopMode = false, setDesktopMode, panelOpen = true, setPanelOpen, onSetActiveTab, panelPosition = "left", editorManuallyClosed, onResetEditorManuallyClosed, pendingChanges = {}, pendingEntourageChanges, localVisibleSections, hasPendingChanges = false, onHasUnsavedChangesChange, onPendingChangesChange, onHeroHasUnsavedChangesChange, onHeroPendingChangesChange, onBack, showScreenDimensions = false, onToggleScreenDimensions, isDemoMode = false }: LiveEditViewProps) {
  const [activeField, setActiveField] = useState<EditField | null>(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showAccentColorPanel, setShowAccentColorPanel] = useState(false);
  const [showPrePrintPanel, setShowPrePrintPanel] = useState(false);
  const [printResizeScale, setPrintResizeScale] = useState(100);
  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 });
  const [sectionPanelOpen, setSectionPanelOpen] = useState(false);
  const [sectionPanelClosing, setSectionPanelClosing] = useState(false);
  const [prePrintPanelClosing, setPrePrintPanelClosing] = useState(false);
  const [accentColorPanelClosing, setAccentColorPanelClosing] = useState(false);
  const [showUniversalDividerPanel, setShowUniversalDividerPanel] = useState(false);
  const [isUniversalDividerPanelClosing, setIsUniversalDividerPanelClosing] = useState(false);
  const { options: predefinedSectionColors } = usePredefinedOptions('section_colors');
  const { options: predefinedDivider1Images } = usePredefinedOptions('dividers_centeredsingle');
  const { options: predefinedDivider2Images } = usePredefinedOptions('dividers_splithorizontal');
  const { options: predefinedDivider3Images } = usePredefinedOptions('dividers_mirroredcorners');

  // Get predefined images based on current divider type
  const getPredefinedImagesForDividerType = (dividerType: string) => {
    if (dividerType === "divider-1") return predefinedDivider1Images;
    if (dividerType === "divider-2") return predefinedDivider2Images;
    if (dividerType === "divider-3") return predefinedDivider3Images;
    return predefinedDivider1Images;
  };
  
  // Wrapper onChange that passes all changes through to the parent
  const handleChange = useCallback((field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => {
    onChange(field, value);
  }, [onChange]);

  const handleClosePrePrintPanel = () => {
    setPrePrintPanelClosing(true);
    setTimeout(() => {
      setShowPrePrintPanel(false);
      setPrePrintPanelClosing(false);
    }, 300);
  };

  const handleCloseAccentColorPanel = () => {
    setAccentColorPanelClosing(true);
    setTimeout(() => {
      setShowAccentColorPanel(false);
      setAccentColorPanelClosing(false);
    }, 300);
  };

  const handleCloseUniversalDividerPanel = () => {
    setIsUniversalDividerPanelClosing(true);
    setTimeout(() => {
      setShowUniversalDividerPanel(false);
      setIsUniversalDividerPanelClosing(false);
    }, 300);
  };

  const handleApplyUniversalDividerToAll = () => {
    handleChange("eventDetailsDividerUseDefault", true);
    handleChange("galleryDividerUseDefault", true);
    handleChange("mapDividerUseDefault", true);
    handleChange("rsvpDividerUseDefault", true);
    handleChange("timelineDividerUseDefault", true);
    handleChange("countdownDividerUseDefault", true);
    handleChange("dresscodeDividerUseDefault", true);
    handleChange("giftguideDividerUseDefault", true);
    handleChange("entourageDividerUseDefault", true);
    handleChange("footerDividerUseDefault", true);
  };

  const handleSectionPanelOpen = () => {
    setSectionPanelOpen(true);
    setSectionPanelClosing(false);
    // Reset editorManuallyClosed when section panel opens so editor can reopen
    if (onResetEditorManuallyClosed) {
      onResetEditorManuallyClosed();
    }
    if (setPanelOpen) {
      setPanelOpen(false);
    }
  };

  const handleSectionPanelClose = () => {
    setSectionPanelClosing(true);
    setTimeout(() => {
      setSectionPanelOpen(false);
      setSectionPanelClosing(false);
      // Only reopen editor if it wasn't manually closed
      if (setPanelOpen && !editorManuallyClosed) setPanelOpen(true);
    }, 300);
  };
  const { data } = invitation;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);

  // Merge pending changes with data for preview
  const mergedData = useMemo(() => {
    const baseData = { ...data, ...pendingChanges };
    // Merge entourage pending changes
    if (pendingEntourageChanges) {
      baseData.entourage = {
        ...data.entourage,
        ...pendingEntourageChanges,
        ...pendingChanges.entourage,
        visibleSections: {
          ...data.entourage?.visibleSections,
          ...pendingEntourageChanges.visibleSections,
          ...localVisibleSections
        }
      };
    }
    return baseData;
  }, [data, pendingChanges, pendingEntourageChanges, localVisibleSections]);

  // Track screen dimensions
  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenDimensions({ width, height });
      
      // Auto-disable desktop mode if screen is too narrow
      if (width < 1024 && desktopMode && setDesktopMode) {
        setDesktopMode(false);
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [desktopMode, setDesktopMode]);

  // Save scroll position when leaving the tab
  useEffect(() => {
    if (!isActive && scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
    }
  }, [isActive]);

  // Restore scroll position when entering the tab
  useEffect(() => {
    if (isActive && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollPositionRef.current;
    }
  }, [isActive]);

  const openPicker = useCallback((editField: EditField) => {
    setActiveField(editField);
  }, []);

  const handleSelect = useCallback(
    (url: string) => {
      if (!activeField) return;
      if (activeField.index !== undefined) {
        const arr = [...(data.galleryImages || [])];
        while (arr.length <= activeField.index) arr.push("");
        arr[activeField.index] = url;
        onChange("galleryImages", arr.filter(Boolean));
      } else {
        onChange(activeField.field as keyof InvitationData, url);
      }
      setActiveField(null);
    },
    [activeField, data?.galleryImages, onChange]
  );

  const handleTransformChange = useCallback(
    (transform: ImageTransform) => {
      if (!activeField) return;
      const key =
        activeField.index !== undefined
          ? `${activeField.field}.${activeField.index}`
          : activeField.field;
      const transforms = { ...(data?.imageTransforms || {}), [key]: transform };
      onChange("imageTransforms", transforms);
    },
    [activeField, data?.imageTransforms, onChange]
  );

  const getCurrentSrc = (): string => {
    if (!activeField) return "";
    if (activeField.index !== undefined) {
      return data.galleryImages?.[activeField.index] ?? "";
    }
    return (data[activeField.field as keyof InvitationData] as string) ?? "";
  };

  const getCurrentTransform = (): ImageTransform | undefined => {
    if (!activeField) return undefined;
    const key =
      activeField.index !== undefined
        ? `${activeField.field}.${activeField.index}`
        : activeField.field;
    return data.imageTransforms?.[key];
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/invite/${invitation.slug}`;
    const shareData = {
      title: document.title,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert("Link copied to clipboard!");
      } catch (err) {
        console.error("Error copying to clipboard:", err);
      }
    }
  };

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/invite/${invitation.slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      // Close settings panel
      setShowSettingsPanel(false);
      // Show toast message
      const toast = document.createElement('div');
      toast.className = `fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg z-50 text-sm ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`;
      toast.textContent = 'Link copied to clipboard!';
      toast.style.fontFamily = 'Inter, sans-serif';
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    } catch (err) {
      console.error("Error copying to clipboard:", err);
    }
  };

  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);

  const handleShareMouseDown = () => {
    setIsLongPress(false);
    const timer = setTimeout(() => {
      setIsLongPress(true);
      handleCopyLink();
    }, 500);
    setLongPressTimer(timer);
  };

  const handleShareMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleShareMouseLeave = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleShareTouchStart = (e: React.TouchEvent) => {
    setIsLongPress(false);
    const timer = setTimeout(() => {
      setIsLongPress(true);
      handleCopyLink();
    }, 500);
    setLongPressTimer(timer);
  };

  const handleShareTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  const handlePrint = () => {
    setShowSettingsPanel(false);
    setShowPrePrintPanel(true);
  };

  const handleBeginPrint = () => {
    setShowPrePrintPanel(false);
    window.print();
  };

  // Reset print resize scale when print window closes
  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintResizeScale(100);
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  return (
    <EditModeContext.Provider
      value={{ editMode: true, invitationId: invitation.id, openPicker }}
    >
      <div className={`flex flex-col h-full relative ${!isActive ? "hidden" : ""}`}>
        {/* Settings button in upper-right - hide when Apply Changes button is active */}
        {!hasPendingChanges && (
          <div className="absolute top-4 right-4 z-50 no-print">
            <button
              onClick={() => setShowSettingsPanel(true)}
              className="p-4 rounded-full backdrop-blur-sm shadow-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: accentColor }}
              aria-label="Settings"
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l-.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        )}

        {/* Scrollable invitation preview */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <InvitationTemplate
            invitation={{ ...invitation, data: mergedData }}
            previewMode={true}
            editMode={true}
            isDarkMode={isDarkMode}
            onChange={handleChange}
            printResizeScale={printResizeScale}
            accentColor={accentColor}
            desktopMode={desktopMode}
            panelPosition={panelPosition}
            onSectionPanelOpen={handleSectionPanelOpen}
            onSectionPanelClose={handleSectionPanelClose}
            pendingEntourageChanges={pendingEntourageChanges}
            localVisibleSections={localVisibleSections}
            onHasUnsavedChangesChange={onHasUnsavedChangesChange}
            onPendingChangesChange={onPendingChangesChange}
            onHeroHasUnsavedChangesChange={onHeroHasUnsavedChangesChange}
            onHeroPendingChangesChange={onHeroPendingChangesChange}
          />
        </div>
      </div>

      {/* Pre-print Settings panel */}
      {showPrePrintPanel && (
        <>
          {/* Backdrop */}
          {!prePrintPanelClosing && <div className="fixed inset-0 bg-transparent z-40" onMouseDown={handleClosePrePrintPanel} onWheel={handleClosePrePrintPanel} />}

          {/* Sheet */}
          <div
            className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl shadow-2xl flex flex-col ${prePrintPanelClosing ? "animate-slide-down" : "animate-slide-up"} no-print ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            style={{ maxWidth: 480, margin: "0 auto", maxHeight: "50vh" }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className={`w-10 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`} />
            </div>

            {/* Header */}
            <div className={`flex items-center px-5 py-2 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
              <h3
                className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-[#5c4a3a]"}`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Pre-print Settings
              </h3>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 space-y-6">
              {/* Temporary Resize Elements Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Temporary Resize Elements</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{printResizeScale}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="200"
                  value={printResizeScale}
                  onChange={(e) => setPrintResizeScale(parseInt(e.target.value))}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`}
                />
                <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                  This reduces the size of all elements except backgrounds. Changes are temporary and won't be saved.
                </p>
              </div>

              {/* Begin Print Button */}
              <button
                onClick={handleBeginPrint}
                className="w-full py-3 text-white rounded-lg font-medium transition-colors"
                style={{ fontFamily: "Inter, sans-serif", backgroundColor: accentColor }}
              >
                Begin Print
              </button>

              {/* Cancel Button */}
              <button
                onClick={() => {
                  setPrintResizeScale(100);
                  handleClosePrePrintPanel();
                }}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${isDarkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}

      {/* Settings panel */}
      {showSettingsPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 no-print" onClick={() => setShowSettingsPanel(false)}>
          <div className={`rounded-2xl shadow-2xl w-80 overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"}`} onClick={(e) => e.stopPropagation()}>
            <div className={`p-4 border-b ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
              <h2 className="text-lg font-semibold text-center" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#e5e5e5" : "#5c4a3a" }}>Settings</h2>
            </div>
            <div className="p-2">
              <button
                onClick={() => {
                  setShowSettingsPanel(false);
                  onBack?.();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span className="text-sm" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#e5e5e5" : "#5c4a3a" }}>Dashboard</span>
              </button>
              <button
                onClick={() => {
                  setShowSettingsPanel(false);
                  const element = document.getElementById('wedding-directory-cssid');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
              >
                <img src="/assets/ico-dir.png" alt="Directory" className="w-5 h-5 object-contain" style={{ filter: isDarkMode ? 'brightness(0) invert(1)' : 'none' }} />
                <span className="text-sm" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#e5e5e5" : "#5c4a3a" }}>Directory</span>
              </button>
              <div className={`my-2 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`} />
              <button
                onClick={() => onToggleScreenDimensions?.()}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <span className="text-sm" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#e5e5e5" : "#5c4a3a" }}>Screen Dimensions</span>
                <div className="ml-auto">
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${showScreenDimensions ? "bg-[#b88a78]" : "bg-gray-300"}`} style={{ backgroundColor: showScreenDimensions ? accentColor : undefined }}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${showScreenDimensions ? "translate-x-6" : "translate-x-0"}`} />
                  </div>
                </div>
              </button>
              {/* Desktop Mode toggle - only show on wide screens */}
              {screenDimensions.width >= 1024 && (
                <>
                  <div className={`my-2 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`} />
                  <button
                    onClick={() => {
                      setDesktopMode && setDesktopMode(!desktopMode);
                      if (!desktopMode && onSetActiveTab) {
                        onSetActiveTab("details");
                      }
                      setShowSettingsPanel(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    <span className="text-sm" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#e5e5e5" : "#5c4a3a" }}>{desktopMode ? "Mobile Mode" : "Desktop Mode"}</span>
                  </button>
                  
                  {/* Open editor button - only show when panel is closed and in desktop mode */}
                  {desktopMode && !panelOpen && (
                    <>
                      <div className={`my-2 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`} />
                      <button
                        onClick={() => {
                          setPanelOpen && setPanelOpen(true);
                          setShowSettingsPanel(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <line x1="9" y1="3" x2="9" y2="21" />
                        </svg>
                        <span className="text-sm" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#e5e5e5" : "#5c4a3a" }}>Open Editor</span>
                      </button>
                    </>
                  )}
                </>
              )}
              
              <div className={`my-2 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`} />
              <button
                onClick={() => {
                  setShowSettingsPanel(false);
                  setShowUniversalDividerPanel(true);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <circle cx="8" cy="12" r="2" />
                  <circle cx="16" cy="12" r="2" />
                </svg>
                <span className="text-sm" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#e5e5e5" : "#5c4a3a" }}>Universal Divider</span>
              </button>
              
              <div className={`my-2 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`} />
              <button
                onClick={handleShare}
                onMouseDown={handleShareMouseDown}
                onMouseUp={handleShareMouseUp}
                onMouseLeave={handleShareMouseLeave}
                onTouchStart={handleShareTouchStart}
                onTouchEnd={handleShareTouchEnd}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                <span className="text-sm" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#e5e5e5" : "#5c4a3a" }}>Share</span>
              </button>
              <button
                onClick={handlePrint}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                <span className="text-sm" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#e5e5e5" : "#5c4a3a" }}>Print</span>
              </button>

              {isDemoMode && (
                <>
                  <div className={`my-2 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`} />
                  <button
                    onClick={() => {
                      if (window.confirm("This will reset the demo to its default state and clear all changes you have made. This action cannot be undone. Are you sure?")) {
                        clearDemoInvitation();
                        window.location.reload();
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${isDarkMode ? "hover:bg-red-900/30 text-red-400" : "hover:bg-red-50 text-red-600"}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span className="text-sm" style={{ fontFamily: "Inter, sans-serif" }}>Reset Demo</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Accent Color panel */}
      {showAccentColorPanel && (
        <>
          {/* Backdrop */}
          {!accentColorPanelClosing && <div className="fixed inset-0 bg-transparent z-40" onMouseDown={handleCloseAccentColorPanel} />}

          {/* Sheet */}
          <div
            className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl shadow-2xl flex flex-col ${accentColorPanelClosing ? "animate-slide-down" : "animate-slide-up"} no-print ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
            style={{ maxWidth: 480, margin: "0 auto", maxHeight: "50vh" }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className={`w-10 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`} />
            </div>

            {/* Header */}
            <div className={`flex items-center px-5 py-2 border-b shrink-0 ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
              <h3
                className={`font-semibold ${isDarkMode ? "text-gray-200" : "text-[#5c4a3a]"}`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Accent Color
              </h3>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-10 space-y-6">
              {/* Color picker */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Color Picker</label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => {
                      setAccentColor?.(e.target.value);
                      onChange("accentColor", e.target.value);
                    }}
                    className="w-12 h-12 rounded-lg cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => {
                      setAccentColor?.(e.target.value);
                      onChange("accentColor", e.target.value);
                    }}
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-200" : "border-gray-200"}`}
                    placeholder="#B88A78"
                  />
                </div>
              </div>

              {/* Quick pick color circles */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Quick Pick</label>
                <div className="flex gap-2 flex-wrap">
                  {["#2563EB", "#1E3A8A", "#06B6D4", "#10B981", "#84CC16", "#D97706", "#DC2626", "#DB2777", "#FBBF24"].map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setAccentColor?.(color);
                        onChange("accentColor", color);
                      }}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${accentColor === color ? "border-gray-900 scale-110" : "border-transparent hover:scale-105"}`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select ${color}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Universal Divider panel */}
      {showUniversalDividerPanel && (
        <DividerSettingsPanel
          title="Universal Divider Settings"
          isClosing={isUniversalDividerPanelClosing}
          onClose={handleCloseUniversalDividerPanel}
          isDarkMode={isDarkMode}
          desktopMode={desktopMode}
          panelPosition={panelPosition}
          dividerType={mergedData.universalDivider && mergedData.universalDivider !== "none" ? mergedData.universalDivider : "divider-1"}
          onDividerTypeChange={(value) => handleChange("universalDivider", value)}
          tintColor={mergedData.universalDividerTintColor || mergedData.mainColor2}
          onTintColorChange={(value) => handleChange("universalDividerTintColor", value)}
          tintOpacity={mergedData.universalDividerTintOpacity ?? 100}
          onTintOpacityChange={(value) => handleChange("universalDividerTintOpacity", value)}
          dividerStyle={mergedData.universalDividerStyle || "centered-single"}
          onDividerStyleChange={(value) => handleChange("universalDividerStyle", value)}
          flip={mergedData.universalDividerFlip ?? false}
          onFlipChange={(value) => handleChange("universalDividerFlip", value)}
          spacing={mergedData.universalDividerSpacing ?? -80}
          onSpacingChange={(value) => handleChange("universalDividerSpacing", value)}
          pullDown={mergedData.universalDividerPullDown ?? 0}
          onPullDownChange={(value) => handleChange("universalDividerPullDown", value)}
          verticalFlip={mergedData.universalDividerVerticalFlip ?? false}
          onVerticalFlipChange={(value) => handleChange("universalDividerVerticalFlip", value)}
          imageSize={mergedData.universalDividerImageSize ?? 100}
          onImageSizeChange={(value) => handleChange("universalDividerImageSize", value)}
          predefinedColors={predefinedSectionColors.map(c => c.value)}
          accentColor={accentColor}
          onApplyToAll={handleApplyUniversalDividerToAll}
          customImageUrl1={mergedData.universalDividerCustomImageUrl1}
          onCustomImageUrl1Change={(value) => handleChange("universalDividerCustomImageUrl1", value)}
          customImageUrl2={mergedData.universalDividerCustomImageUrl2}
          onCustomImageUrl2Change={(value) => handleChange("universalDividerCustomImageUrl2", value)}
          customImageUrl3={mergedData.universalDividerCustomImageUrl3}
          onCustomImageUrl3Change={(value) => handleChange("universalDividerCustomImageUrl3", value)}
          colorBlend={mergedData.universalDividerColorBlend ?? false}
          onColorBlendChange={(value) => handleChange("universalDividerColorBlend", value)}
          predefinedDividerImages={predefinedDivider1Images}
          predefinedDivider1Images={predefinedDivider1Images}
          predefinedDivider2Images={predefinedDivider2Images}
          predefinedDivider3Images={predefinedDivider3Images}
        />
      )}

      {/* Image picker sheet (portal-like, outside scroll) */}
      {activeField && (
        <ImagePickerSheet
          editField={activeField}
          invitationId={invitation.id}
          currentSrc={getCurrentSrc()}
          currentTransform={getCurrentTransform()}
          onSelect={handleSelect}
          onTransformChange={handleTransformChange}
          onClose={() => setActiveField(null)}
        />
      )}
    </EditModeContext.Provider>
  );
}

"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import type { Invitation, InvitationData, ImageTransform } from "@/lib/types/invitation";
import { EditModeContext, EditField } from "@/components/invitation/EditModeContext";
import ImagePickerSheet from "./ImagePickerSheet";
import InvitationTemplate from "@/components/invitation/InvitationTemplate";
import DeviceFramePreview from "./DeviceFramePreview";
import DividerSettingsPanel from "@/components/shared/DividerSettingsPanel";
import LoginDialog from "@/components/editor/LoginDialog";
import PhotoGalleryPicker from "@/components/shared/PhotoGalleryPicker";
import ColorControl from "@/components/shared/ColorControl";
import { clearDemoInvitation } from "@/lib/demo/demo-data";
import { buildInviteUrl } from "@/lib/utils";
import { shareInviteLink } from "@/lib/utils/share";
import { createPortal } from "react-dom";
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
  isEmbeddedFrame?: boolean;
}

export default function LiveEditView({ invitation, onChange, isActive = true, saveStatus = "saved", isDarkMode = false, onToggleDarkMode, accentColor = "#6998EE", setAccentColor, desktopMode = false, setDesktopMode, panelOpen = true, setPanelOpen, onSetActiveTab, panelPosition = "left", editorManuallyClosed, onResetEditorManuallyClosed, pendingChanges = {}, pendingEntourageChanges, localVisibleSections, hasPendingChanges = false, onHasUnsavedChangesChange, onPendingChangesChange, onHeroHasUnsavedChangesChange, onHeroPendingChangesChange, onBack, showScreenDimensions = false, onToggleScreenDimensions, isDemoMode = false, isEmbeddedFrame = false }: LiveEditViewProps) {
  const [activeField, setActiveField] = useState<EditField | null>(null);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showAccentColorPanel, setShowAccentColorPanel] = useState(false);
  const [showPrePrintPanel, setShowPrePrintPanel] = useState(false);
  const [isPrintMenuOpen, setIsPrintMenuOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [printResizeScale, setPrintResizeScale] = useState(60);
  const [tempRemoveBackground, setTempRemoveBackground] = useState(false);
  const [tempBackgroundImage, setTempBackgroundImage] = useState<string | null>(null);
  const [tempBackgroundYPosition, setTempBackgroundYPosition] = useState(0);
  const [tempBackgroundXPosition, setTempBackgroundXPosition] = useState(0);
  const [tempBackgroundZoom, setTempBackgroundZoom] = useState(0);
  const [showTempBackgroundPicker, setShowTempBackgroundPicker] = useState(false);
  const [isTempBackgroundPickerClosing, setIsTempBackgroundPickerClosing] = useState(false);
  const [tempColorOverlayEnabled, setTempColorOverlayEnabled] = useState(false);
  const [tempOverlayType, setTempOverlayType] = useState<"solid" | "gradient">("solid");
  const [tempOverlayColor1, setTempOverlayColor1] = useState<string | null>(null);
  const [tempOverlayColor2, setTempOverlayColor2] = useState<string | null>(null);
  const [tempOverlayOpacity1, setTempOverlayOpacity1] = useState(0.7);
  const [tempOverlayOpacity2, setTempOverlayOpacity2] = useState(0.7);
  const [tempTextColor, setTempTextColor] = useState<string | null>(null);
  const [tempLogoTransparency, setTempLogoTransparency] = useState(100);
  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 });
  const [sectionPanelOpen, setSectionPanelOpen] = useState(false);
  const [sectionPanelClosing, setSectionPanelClosing] = useState(false);
  const [sectionPrePrintOpen, setSectionPrePrintOpen] = useState(false);
  const [prePrintPanelClosing, setPrePrintPanelClosing] = useState(false);
  const [accentColorPanelClosing, setAccentColorPanelClosing] = useState(false);
  const [showUniversalDividerPanel, setShowUniversalDividerPanel] = useState(false);
  const [isUniversalDividerPanelClosing, setIsUniversalDividerPanelClosing] = useState(false);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [screenResponsiveness, setScreenResponsiveness] = useState<"desktop" | "mobile" | "tablet">("desktop");
  const [isResponsivenessMenuOpen, setIsResponsivenessMenuOpen] = useState(false);
  const prePrintToastRef = useRef<HTMLDivElement | null>(null);
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

  const showPrePrintToast = useCallback(() => {
    if (prePrintToastRef.current) return;
    const toast = document.createElement('div');
    toast.className = `fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg z-[60] text-sm ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`;
    toast.textContent = 'Close Pre-print Settings first';
    toast.style.fontFamily = 'Inter, sans-serif';
    document.body.appendChild(toast);
    prePrintToastRef.current = toast;
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => {
        toast.remove();
        if (prePrintToastRef.current === toast) prePrintToastRef.current = null;
      }, 300);
    }, 2000);
  }, [isDarkMode]);

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
    handleChange("weddingDirectoryDividerUseDefault", true);
    handleChange("footerDividerUseDefault", true);
    handleCloseUniversalDividerPanel();
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

  const handleSectionPrePrintPanelChange = useCallback((open: boolean) => {
    setSectionPrePrintOpen(open);
  }, []);
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

  const handleCopyLink = async () => {
    const shareUrl = buildInviteUrl(invitation.slug);
    const result = await shareInviteLink(shareUrl, "Invitation");
    if (result === "shared") {
      setIsShareMenuOpen(false);
      setShowSettingsPanel(false);
      return;
    }
    if (result === "copied") {
      setIsShareMenuOpen(false);
      setShowSettingsPanel(false);
      const toast = document.createElement('div');
      toast.className = `fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg z-50 text-sm ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`;
      toast.textContent = 'Share link copied!';
      toast.style.fontFamily = 'Inter, sans-serif';
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    }
  };

  const handleOpenLink = () => {
    const shareUrl = buildInviteUrl(invitation.slug);
    setIsShareMenuOpen(false);
    setShowSettingsPanel(false);
    window.open(shareUrl, '_blank');
  };

  const handleOpenMainInvitationPrint = useCallback(() => {
    setShowSettingsPanel(false);
    setIsPrintMenuOpen(false);
    setShowPrePrintPanel(true);
    setTimeout(() => {
      document.getElementById('hero-icon')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }, []);

  const handleOpenEntourageListPrint = useCallback(() => {
    setShowSettingsPanel(false);
    setIsPrintMenuOpen(false);
    document.getElementById('entourage-top-text')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      document.getElementById('entourage-print-trigger')?.click();
    }, 300);
  }, []);

  const handleOpenRSVPPrint = useCallback(() => {
    setShowSettingsPanel(false);
    setIsPrintMenuOpen(false);
    document.getElementById('rsvp-top-text')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const resetPrePrintSettings = useCallback(() => {
    setPrintResizeScale(60);
    setTempRemoveBackground(false);
    setTempBackgroundImage(null);
    setTempBackgroundYPosition(0);
    setTempBackgroundXPosition(0);
    setTempBackgroundZoom(0);
    setShowTempBackgroundPicker(false);
    setIsTempBackgroundPickerClosing(false);
    setTempColorOverlayEnabled(false);
    setTempOverlayType("solid");
    setTempOverlayColor1(null);
    setTempOverlayColor2(null);
    setTempOverlayOpacity1(0.7);
    setTempOverlayOpacity2(0.7);
    setTempTextColor(null);
    setTempLogoTransparency(100);
  }, []);

  const handleBeginPrint = () => {
    document.body.classList.add('hero-print-only');
    window.print();
  };

  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove('hero-print-only');
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const handleOpenTempBackgroundPicker = () => {
    setIsTempBackgroundPickerClosing(false);
    setShowTempBackgroundPicker(true);
  };

  const handleCloseTempBackgroundPicker = () => {
    setIsTempBackgroundPickerClosing(true);
    setTimeout(() => {
      setShowTempBackgroundPicker(false);
      setIsTempBackgroundPickerClosing(false);
    }, 300);
  };


  return (
    <EditModeContext.Provider
      value={{ editMode: true, invitationId: invitation.id, openPicker }}
    >
      <div className={`flex flex-col h-full relative ${!isActive ? "hidden" : ""}`}>
        {/* Settings button in upper-right - hide when Apply Changes button is active or any pre-print panel is open */}
        {!hasPendingChanges && !showPrePrintPanel && !prePrintPanelClosing && !sectionPrePrintOpen && (
          <div className={`${desktopMode ? "absolute" : "fixed"} top-4 right-4 z-50 no-print`}>
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
          {desktopMode && screenResponsiveness !== "desktop" ? (
            <DeviceFramePreview
              device={screenResponsiveness}
              invitation={invitation}
              pendingChanges={pendingChanges}
              pendingEntourageChanges={pendingEntourageChanges}
              localVisibleSections={localVisibleSections}
              hasPendingChanges={hasPendingChanges}
              accentColor={accentColor}
              isDarkMode={isDarkMode}
              onChange={handleChange}
              onHasUnsavedChangesChange={onHasUnsavedChangesChange}
              onPendingChangesChange={onPendingChangesChange}
              onHeroHasUnsavedChangesChange={onHeroHasUnsavedChangesChange}
              onHeroPendingChangesChange={onHeroPendingChangesChange}
            />
          ) : (
            <InvitationTemplate
              invitation={{ ...invitation, data: mergedData }}
              previewMode={true}
              editMode={true}
              isDarkMode={isDarkMode}
              onChange={handleChange}
              printResizeScale={printResizeScale}
              prePrintActive={showPrePrintPanel}
              tempRemoveBackground={tempRemoveBackground}
              tempBackgroundImage={tempBackgroundImage}
              tempBackgroundYPosition={tempBackgroundYPosition}
              tempBackgroundXPosition={tempBackgroundXPosition}
              tempBackgroundZoom={tempBackgroundZoom}
              tempColorOverlayEnabled={tempColorOverlayEnabled}
              tempOverlayType={tempOverlayType}
              tempOverlayColor1={tempOverlayColor1}
              tempOverlayColor2={tempOverlayColor2}
              tempOverlayOpacity1={tempOverlayOpacity1}
              tempOverlayOpacity2={tempOverlayOpacity2}
              tempTextColor={tempTextColor}
              tempLogoTransparency={tempLogoTransparency}
              accentColor={accentColor}
              desktopMode={desktopMode}
              panelPosition={panelPosition}
              onSectionPanelOpen={handleSectionPanelOpen}
              onSectionPanelClose={handleSectionPanelClose}
              onPrePrintPanelChange={handleSectionPrePrintPanelChange}
              pendingEntourageChanges={pendingEntourageChanges}
              localVisibleSections={localVisibleSections}
              onHasUnsavedChangesChange={onHasUnsavedChangesChange}
              onPendingChangesChange={onPendingChangesChange}
              onHeroHasUnsavedChangesChange={onHeroHasUnsavedChangesChange}
              onHeroPendingChangesChange={onHeroPendingChangesChange}
            />
          )}
        </div>
      </div>

      {/* Pre-print Settings panel */}
      {showPrePrintPanel && (
        <>
          {/* Backdrop */}
          {!prePrintPanelClosing && <div className="fixed inset-0 bg-transparent z-40" onMouseDown={showPrePrintToast} onWheel={showPrePrintToast} />}

          {/* Sheet */}
          <div
            className={`fixed z-50 shadow-2xl flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"} ${
              desktopMode
                ? `top-0 bottom-0 ${panelPosition === "left" ? "left-0 border-r" : "right-0 border-l"} ${prePrintPanelClosing ? (panelPosition === "left" ? "animate-slide-out-side" : "animate-slide-out-side-right") : (panelPosition === "left" ? "animate-slide-in-side" : "animate-slide-in-side-right")}`
                : `bottom-0 left-0 right-0 rounded-t-3xl ${prePrintPanelClosing ? "animate-slide-down" : "animate-slide-up"}`
            } no-print`}
            style={desktopMode ? { width: "400px" } : { maxWidth: 480, margin: "0 auto", maxHeight: "50vh" }}
            onMouseDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
          >
            {/* Handle bar - only show in mobile mode */}
            {!desktopMode && (
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className={`w-10 h-1 rounded-full ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`} />
              </div>
            )}

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
              <p className={`text-xs text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                ADJUST TO FIT ON YOUR PRINT. ADJUSTMENTS ARE TEMPORARY AND WILL REVERT ONCE PANEL IS CLOSED.
              </p>

              {/* Temporarily Remove Background Toggle */}
              <button
                onClick={() => setTempRemoveBackground((prev) => !prev)}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${
                  tempRemoveBackground
                    ? "text-white"
                    : isDarkMode
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                style={{ backgroundColor: tempRemoveBackground ? accentColor : undefined, fontFamily: "Inter, sans-serif" }}
              >
                Temporarily Remove Background
              </button>

              {/* Temporary Add Different Background Button */}
              <button
                onClick={handleOpenTempBackgroundPicker}
                className="w-full py-3 text-white rounded-lg font-medium transition-colors"
                style={{ backgroundColor: accentColor, fontFamily: "Inter, sans-serif" }}
              >
                Temporary Add Different Background
              </button>

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
                  style={{
                    accentColor: accentColor,
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((printResizeScale - 20) / 180) * 100}%, ${isDarkMode ? "#374151" : "#e5e7eb"} ${((printResizeScale - 20) / 180) * 100}%, ${isDarkMode ? "#374151" : "#e5e7eb"} 100%)`
                  }}
                />
              </div>

              {/* Temporary Background Zoom Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Temporary Background Zoom</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{tempBackgroundZoom}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="200"
                  value={tempBackgroundZoom}
                  onChange={(e) => setTempBackgroundZoom(Number(e.target.value))}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`}
                  style={{
                    accentColor: accentColor,
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${((tempBackgroundZoom + 50) / 250) * 100}%, ${isDarkMode ? "#374151" : "#e5e7eb"} ${((tempBackgroundZoom + 50) / 250) * 100}%, ${isDarkMode ? "#374151" : "#e5e7eb"} 100%)`
                  }}
                />
              </div>

              {/* Temporary Background Y-Position Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Adjust UP - DOWN</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{tempBackgroundYPosition}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={tempBackgroundYPosition}
                  onChange={(e) => setTempBackgroundYPosition(Number(e.target.value))}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`}
                  style={{
                    accentColor: accentColor,
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${tempBackgroundYPosition + 50}%, ${isDarkMode ? "#374151" : "#e5e7eb"} ${tempBackgroundYPosition + 50}%, ${isDarkMode ? "#374151" : "#e5e7eb"} 100%)`
                  }}
                />
              </div>

              {/* Temporary Background X-Position Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Adjust LEFT - RIGHT</label>
                  <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>{tempBackgroundXPosition}%</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  value={tempBackgroundXPosition}
                  onChange={(e) => setTempBackgroundXPosition(Number(e.target.value))}
                  className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`}
                  style={{
                    accentColor: accentColor,
                    background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${tempBackgroundXPosition + 50}%, ${isDarkMode ? "#374151" : "#e5e7eb"} ${tempBackgroundXPosition + 50}%, ${isDarkMode ? "#374151" : "#e5e7eb"} 100%)`
                  }}
                />
              </div>

              {/* Temporary Color */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-300" : "text-gray-600"}`} style={{ fontFamily: "Inter, sans-serif" }}>Temporary Color</label>
                  <button
                    onClick={() => setTempColorOverlayEnabled((prev) => !prev)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      tempColorOverlayEnabled ? '' : (isDarkMode ? "bg-gray-600" : "bg-gray-200")
                    }`}
                    style={{ backgroundColor: tempColorOverlayEnabled ? accentColor : undefined }}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        tempColorOverlayEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {tempColorOverlayEnabled && (
                  <>
                    {/* TEXT COLOR */}
                    <ColorControl
                      label="TEXT COLOR"
                      value={tempTextColor ?? ""}
                      onChange={(value) => setTempTextColor(value || null)}
                      isDarkMode={isDarkMode}
                      accentColor={accentColor}
                      predefinedColors={predefinedSectionColors.map(c => c.value)}
                    />

                    {/* LOGO TRANSPARENCY */}
                    <div className="space-y-2">
                      <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>LOGO TRANSPARENCY</label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={tempLogoTransparency}
                        onChange={(e) => setTempLogoTransparency(parseInt(e.target.value))}
                        className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
                        style={{
                          accentColor: accentColor,
                          background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${tempLogoTransparency}%, ${isDarkMode ? "#374151" : "#e5e7eb"} ${tempLogoTransparency}%, ${isDarkMode ? "#374151" : "#e5e7eb"} 100%)`
                        }}
                      />
                      <div className={`text-xs text-center ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                        {tempLogoTransparency}%
                      </div>
                    </div>

                    {/* Overlay Type */}
                    <div className="space-y-1">
                      <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Overlay Type</label>
                      <select
                        value={tempOverlayType}
                        onChange={(e) => setTempOverlayType(e.target.value as "solid" | "gradient")}
                        className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none transition-colors ${isDarkMode ? "border-gray-700 text-gray-200" : "border-gray-200"}`}
                        style={{ ...(isDarkMode ? { backgroundColor: "#1C2531" } : { backgroundColor: "#F3F4F6" }), fontFamily: "Inter, sans-serif" }}
                      >
                        <option value="solid">Solid Color</option>
                        <option value="gradient">Gradient</option>
                      </select>
                    </div>

                    {/* Overlay Color 1 */}
                    <ColorControl
                      label="Overlay Color 1"
                      value={tempOverlayColor1 ?? ""}
                      onChange={(value) => setTempOverlayColor1(value || null)}
                      isDarkMode={isDarkMode}
                      accentColor={accentColor}
                      predefinedColors={predefinedSectionColors.map(c => c.value)}
                    />

                    {/* Transparency for Color 1 */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Transparency</label>
                        <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                          {Math.round(tempOverlayOpacity1 * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={tempOverlayOpacity1}
                        onChange={(e) => setTempOverlayOpacity1(parseFloat(e.target.value))}
                        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${tempOverlayOpacity1 * 100}%, rgba(255,255,255,0.3) ${tempOverlayOpacity1 * 100}%, rgba(255,255,255,0.3) 100%)`,
                        }}
                      />
                    </div>

                    {/* Overlay Color 2 - only for gradient */}
                    {tempOverlayType === "gradient" && (
                      <ColorControl
                        label="Overlay Color 2"
                        value={tempOverlayColor2 ?? ""}
                        onChange={(value) => setTempOverlayColor2(value || null)}
                        isDarkMode={isDarkMode}
                        accentColor={accentColor}
                        predefinedColors={predefinedSectionColors.map(c => c.value)}
                      />
                    )}

                    {/* Transparency for Color 2 - only for gradient */}
                    {tempOverlayType === "gradient" && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className={`block text-xs tracking-wide uppercase text-left ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>Transparency</label>
                          <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} style={{ fontFamily: "Inter, sans-serif" }}>
                            {Math.round(tempOverlayOpacity2 * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={tempOverlayOpacity2}
                          onChange={(e) => setTempOverlayOpacity2(parseFloat(e.target.value))}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, ${accentColor} 0%, ${accentColor} ${tempOverlayOpacity2 * 100}%, rgba(255,255,255,0.3) ${tempOverlayOpacity2 * 100}%, rgba(255,255,255,0.3) 100%)`,
                          }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* BEGIN PRINT Button */}
              <button
                onClick={handleBeginPrint}
                className="w-full py-3 text-white rounded-lg font-medium transition-colors"
                style={{ fontFamily: "Inter, sans-serif", backgroundColor: accentColor }}
              >
                BEGIN PRINT
              </button>

              {/* CLOSE Button */}
              <button
                onClick={() => {
                  setPrintResizeScale(60);
                  setTempRemoveBackground(false);
                  setTempBackgroundImage(null);
                  setTempBackgroundYPosition(0);
                  setTempBackgroundXPosition(0);
                  setTempBackgroundZoom(0);
                  setShowTempBackgroundPicker(false);
                  setIsTempBackgroundPickerClosing(false);
                  setTempColorOverlayEnabled(false);
                  setTempOverlayType("solid");
                  setTempOverlayColor1(null);
                  setTempOverlayColor2(null);
                  setTempOverlayOpacity1(0.7);
                  setTempOverlayOpacity2(0.7);
                  setTempTextColor(null);
                  setTempLogoTransparency(100);
                  handleClosePrePrintPanel();
                }}
                className={`w-full py-3 rounded-lg font-medium transition-colors ${isDarkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                CLOSE
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
                <div className="w-5 h-5" style={{ backgroundColor: accentColor, WebkitMaskImage: 'url(/assets/ico-dir.png)', maskImage: 'url(/assets/ico-dir.png)', WebkitMaskSize: 'contain', maskSize: 'contain', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat', WebkitMaskPosition: 'center', maskPosition: 'center' }} />
                <span className="text-sm" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#e5e5e5" : "#5c4a3a" }}>Directory</span>
              </button>
              <div className={`my-2 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`} />
              {desktopMode && !isEmbeddedFrame && (
                <>
                  <div>
                    <button
                      onClick={() => setIsResponsivenessMenuOpen((prev) => !prev)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                        <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                        <line x1="12" y1="18" x2="12" y2="18.01" />
                      </svg>
                      <span className="text-sm" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#e5e5e5" : "#5c4a3a" }}>Screen Responsiveness</span>
                      <svg className={`ml-auto w-4 h-4 transform transition-transform ${isResponsivenessMenuOpen ? "rotate-180" : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {isResponsivenessMenuOpen && (
                      <div className={`space-y-1 pb-2 pt-1 rounded-lg overflow-hidden ${isDarkMode ? "bg-gray-700/40" : "bg-gray-100/60"}`}>
                        {([
                          { value: "desktop", label: "Desktop" },
                          { value: "mobile", label: "Mobile" },
                          { value: "tablet", label: "Tablet/iPad" },
                        ] as const).map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setScreenResponsiveness(option.value);
                              setIsResponsivenessMenuOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${isDarkMode ? "hover:bg-gray-600 text-gray-200" : "hover:bg-gray-200 text-gray-700"}`}
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            <span>{option.label}</span>
                            {screenResponsiveness === option.value && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className={`my-2 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`} />
                </>
              )}
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
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${showScreenDimensions ? "bg-[#6998EE]" : "bg-gray-300"}`} style={{ backgroundColor: showScreenDimensions ? accentColor : undefined }}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${showScreenDimensions ? "translate-x-6" : "translate-x-0"}`} />
                  </div>
                </div>
              </button>
              {/* Open editor button - only show when panel is closed and in desktop mode */}
              {desktopMode && !panelOpen && !isEmbeddedFrame && (
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
              <div>
                <button
                  onClick={() => {
                    setIsShareMenuOpen((prev) => !prev);
                    setIsPrintMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  <span className="text-sm" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#e5e5e5" : "#5c4a3a" }}>Share</span>
                  <svg className={`ml-auto w-4 h-4 transform transition-transform ${isShareMenuOpen ? "rotate-180" : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {isShareMenuOpen && (
                  <div className={`space-y-1 pb-2 pt-1 rounded-lg overflow-hidden ${isDarkMode ? "bg-gray-700/40" : "bg-gray-100/60"}`}>
                    <button
                      onClick={handleOpenLink}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${isDarkMode ? "hover:bg-gray-600 text-gray-200" : "hover:bg-gray-200 text-gray-700"}`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Open Link
                    </button>
                    <button
                      onClick={handleCopyLink}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${isDarkMode ? "hover:bg-gray-600 text-gray-200" : "hover:bg-gray-200 text-gray-700"}`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Copy Link
                    </button>
                  </div>
                )}
              </div>
              <div>
                <button
                  onClick={() => {
                    setIsPrintMenuOpen((prev) => !prev);
                    setIsShareMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                    <polyline points="6 9 6 2 18 2 18 9" />
                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                    <rect x="6" y="14" width="12" height="8" />
                  </svg>
                  <span className="text-sm" style={{ fontFamily: "Inter, sans-serif", color: isDarkMode ? "#e5e5e5" : "#5c4a3a" }}>Print</span>
                  <svg className={`ml-auto w-4 h-4 transform transition-transform ${isPrintMenuOpen ? "rotate-180" : ""}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {isPrintMenuOpen && (
                  <div className={`space-y-1 pb-2 pt-1 rounded-lg overflow-hidden ${isDarkMode ? "bg-gray-700/40" : "bg-gray-100/60"}`}>
                    <button
                      onClick={handleOpenMainInvitationPrint}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${isDarkMode ? "hover:bg-gray-600 text-gray-200" : "hover:bg-gray-200 text-gray-700"}`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Main Invitation / Hero Section
                    </button>
                    <button
                      onClick={handleOpenEntourageListPrint}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${isDarkMode ? "hover:bg-gray-600 text-gray-200" : "hover:bg-gray-200 text-gray-700"}`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      Entourage List
                    </button>
                    <button
                      onClick={handleOpenRSVPPrint}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${isDarkMode ? "hover:bg-gray-600 text-gray-200" : "hover:bg-gray-200 text-gray-700"}`}
                      style={{ fontFamily: "Inter, sans-serif" }}
                    >
                      R.S.V.P
                    </button>
                  </div>
                )}
              </div>

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

              {!isDemoMode ? (
                <>
                  <div className={`my-2 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`} />
                  <button
                    onClick={() => {
                      localStorage.removeItem('invitation');
                      localStorage.removeItem('appSettings');
                      localStorage.removeItem('weddingChecklist');
                      localStorage.removeItem('weddingBudget');
                      window.location.href = '/tools';
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${isDarkMode ? "hover:bg-red-900/30 text-red-400" : "hover:bg-red-50 text-red-600"}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span className="text-sm" style={{ fontFamily: "Inter, sans-serif" }}>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <div className={`my-2 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`} />
                  <button
                    onClick={() => {
                      setShowSettingsPanel(false);
                      setShowLoginDialog(true);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-900"}`}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10,17 15,12 10,7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    <span className="text-sm" style={{ fontFamily: "Inter, sans-serif" }}>Sign In</span>
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
                    placeholder="#6998EE"
                  />
                </div>
              </div>

              {/* Quick pick color circles */}
              <div className="space-y-2">
                <label className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>Quick Pick</label>
                <div className="flex gap-2 flex-wrap">
                  {["#6998EE", "#1E3A8A", "#06B6D4", "#10B981", "#84CC16", "#D97706", "#DC2626", "#DB2777", "#FBBF24"].map((color) => (
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

      <LoginDialog isOpen={showLoginDialog} onClose={() => setShowLoginDialog(false)} isDarkMode={isDarkMode} accentColor={accentColor} />

      {/* Image picker sheet (portal-like, outside scroll) */}
      {activeField && (
        <ImagePickerSheet
          editField={activeField}
          galleryImages={mergedData.galleryImages || []}
          currentSrc={getCurrentSrc()}
          currentTransform={getCurrentTransform()}
          onSelect={handleSelect}
          onTransformChange={handleTransformChange}
          onClose={() => setActiveField(null)}
        />
      )}

      {/* Temporary hero background picker */}
      {showTempBackgroundPicker && createPortal(
        <PhotoGalleryPicker
          galleryImages={mergedData.galleryImages || []}
          selectedUrl={tempBackgroundImage || ""}
          isDarkMode={isDarkMode}
          accentColor={accentColor}
          desktopMode={desktopMode}
          panelPosition={panelPosition}
          isClosing={isTempBackgroundPickerClosing}
          onSelect={(url) => {
            setTempBackgroundImage(url || null);
            handleCloseTempBackgroundPicker();
          }}
          onClose={handleCloseTempBackgroundPicker}
        />,
        document.body
      )}
    </EditModeContext.Provider>
  );
}

import { useState, useEffect, useRef, useMemo } from "react";
import type { InvitationData } from "@/lib/types/invitation";
import EntourageEditor from "./EntourageEditor";
import GuestEditor from "./GuestEditor";
import RSVPResponseEditor from "./RSVPResponseEditor";
import MediaEditor from "./MediaEditor";
import SettingsEditor from "./SettingsEditor";
import ChecklistEditor from "./ChecklistEditor";
import BudgetEditor from "./BudgetEditor";
import TableMapEditor from "./TableMapEditor";
import WeddingProgramEditor from "./WeddingProgramEditor";
import StoryTimelineEditor from "./StoryTimelineEditor";
import { getFontFamily } from "@/lib/utils/fonts";
import SaveConfirmationDialog from "@/components/shared/SaveConfirmationDialog";

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface ToolsTabProps {
  data: InvitationData;
  slug: string;
  invitationId: string;
  onChange: (field: keyof InvitationData, value: InvitationData[keyof InvitationData]) => void;
  isDarkMode?: boolean;
  accentColor?: string;
  onOpenEditor?: () => void;
  onSettingsChange?: (settings: { isDarkMode: boolean; accentColor: string; hideSaveConfirmationDialog?: boolean; hideInstructions?: boolean; showScreenDimensions?: boolean }) => void;
  onSave?: (updatedData: InvitationData) => Promise<void>;
  hideSaveConfirmationDialog?: boolean;
  hideInstructions?: boolean;
  showScreenDimensions?: boolean;
  isDemoMode?: boolean;
}

interface ToolTileProps {
  icon: string;
  label: string;
  onClick: () => void;
  isDarkMode?: boolean;
  accentColor?: string;
}

function ToolTile({ icon, label, onClick, isDarkMode = false, accentColor = "#6998EE" }: ToolTileProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`aspect-square flex flex-col items-center justify-center gap-3 p-6 rounded-xl transition-all duration-200 ${
        isDarkMode
          ? "bg-gray-700 hover:bg-gray-600"
          : "bg-gray-50 hover:bg-gray-100"
      }`}
      style={{ border: `1px solid ${hovered ? hexToRgba(accentColor, 0.8) : hexToRgba(accentColor, 0.3)}` }}
    >
      <div className="w-12 h-12" style={{
        backgroundColor: accentColor,
        WebkitMaskImage: `url(${icon})`,
        WebkitMaskSize: "contain",
        WebkitMaskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        maskImage: `url(${icon})`,
        maskSize: "contain",
        maskPosition: "center",
        maskRepeat: "no-repeat"
      }} />
      <span className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-700"}`} style={{ fontFamily: "Inter, sans-serif" }}>
        {label}
      </span>
    </button>
  );
}

export default function ToolsTab({ data, slug, invitationId, onChange, isDarkMode = true, accentColor = "#6998EE", onOpenEditor, onSettingsChange, onSave, hideSaveConfirmationDialog, hideInstructions, showScreenDimensions, isDemoMode = false }: ToolsTabProps) {
  const [showEntourageEditor, setShowEntourageEditor] = useState(false);
  const [showGuestEditor, setShowGuestEditor] = useState(false);
  const [showRSVPResponseEditor, setShowRSVPResponseEditor] = useState(false);
  const [showMediaEditor, setShowMediaEditor] = useState(false);
  const [showSettingsEditor, setShowSettingsEditor] = useState(false);
  const [showChecklistEditor, setShowChecklistEditor] = useState(false);
  const [showBudgetEditor, setShowBudgetEditor] = useState(false);
  const [showTableMapEditor, setShowTableMapEditor] = useState(false);
  const [showWeddingProgramEditor, setShowWeddingProgramEditor] = useState(false);
  const [showStoryTimelineEditor, setShowStoryTimelineEditor] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isMobile, setIsMobile] = useState(false);

  // Snapshot of data for change detection at tools level
  const dataSnapshot = useRef(JSON.stringify(data));
  // State version to force recompute of changedSections after save updates the ref
  const [snapshotVersion, setSnapshotVersion] = useState(0);

  // Detect which sections have changed by comparing current data against snapshot
  const changedSections = useMemo(() => {
    // Include snapshotVersion in deps so memo recomputes after save
    void snapshotVersion;
    const snapshot = JSON.parse(dataSnapshot.current);
    const sections: string[] = [];

    // Entourage
    if (JSON.stringify(data.entourage) !== JSON.stringify(snapshot.entourage)) sections.push("Entourage");
    // Guest List
    if (JSON.stringify(data.rsvpInvitees) !== JSON.stringify(snapshot.rsvpInvitees) ||
        JSON.stringify(data.rsvpEntourageHonorifics) !== JSON.stringify(snapshot.rsvpEntourageHonorifics) ||
        JSON.stringify(data.rsvpEntourageGuestDetails) !== JSON.stringify(snapshot.rsvpEntourageGuestDetails) ||
        JSON.stringify(data.rsvpGuestDetails) !== JSON.stringify(snapshot.rsvpGuestDetails)) sections.push("Guest List");
    // Media
    if (data.heroIcon !== snapshot.heroIcon ||
        JSON.stringify(data.galleryImages) !== JSON.stringify(snapshot.galleryImages) ||
        JSON.stringify(data.venueImages) !== JSON.stringify(snapshot.venueImages) ||
        data.customHeadingFont !== snapshot.customHeadingFont ||
        data.customBodyFont !== snapshot.customBodyFont ||
        JSON.stringify(data.backgroundMusic) !== JSON.stringify(snapshot.backgroundMusic) ||
        JSON.stringify(data.backgroundMusicFileNames) !== JSON.stringify(snapshot.backgroundMusicFileNames)) sections.push("Media");
    // Wedding Program
    if (JSON.stringify(data.weddingProgram) !== JSON.stringify(snapshot.weddingProgram)) sections.push("Wedding Program");
    // Story Timeline
    if (JSON.stringify(data.storyTimeline) !== JSON.stringify(snapshot.storyTimeline)) sections.push("Story Timeline");
    // Table Map
    if (JSON.stringify(data.venueLayout) !== JSON.stringify(snapshot.venueLayout)) sections.push("Table Map");
    // Settings (exclude isDarkMode/accentColor which are app settings, not invitation data)
    const settingsFields = ['musicEnabled', 'musicTrack', 'musicVolume', 'rsvpEnabled', 'rsvpDeadline', 'rsvpAllowPlusOne', 'rsvpAskPlusOneName', 'rsvpAllowKids', 'rsvpAskMealPreference', 'rsvpMealOptions', 'rsvpCustomQuestions', 'rsvpCollectPhone', 'rsvpCollectAddress', 'rsvpShowGuestCount', 'rsvpButtonText', 'rsvpSubmitMessage', 'rsvpClosedMessage'];
    const hasSettingsChanges = settingsFields.some(f => JSON.stringify((data as any)[f]) !== JSON.stringify((snapshot as any)[f]));
    if (hasSettingsChanges) sections.push("Settings");

    return sections;
  }, [data, snapshotVersion]);

  const hasUnsavedChanges = changedSections.length > 0;
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

  // Handle tools-level save
  const handleToolsSave = async () => {
    if (onSave) {
      await onSave(data);
      dataSnapshot.current = JSON.stringify(data);
      setSnapshotVersion(v => v + 1);
    }
  };

  // Handle discard - revert all changes back to the saved snapshot
  const handleToolsDiscard = () => {
    const snapshot = JSON.parse(dataSnapshot.current);
    // Revert each field that has changed
    if (JSON.stringify(data.entourage) !== JSON.stringify(snapshot.entourage)) {
      onChange("entourage" as keyof InvitationData, snapshot.entourage);
    }
    if (JSON.stringify(data.rsvpInvitees) !== JSON.stringify(snapshot.rsvpInvitees)) {
      onChange("rsvpInvitees" as keyof InvitationData, snapshot.rsvpInvitees);
    }
    if (JSON.stringify(data.rsvpEntourageHonorifics) !== JSON.stringify(snapshot.rsvpEntourageHonorifics)) {
      onChange("rsvpEntourageHonorifics" as keyof InvitationData, snapshot.rsvpEntourageHonorifics);
    }
    if (JSON.stringify(data.rsvpEntourageGuestDetails) !== JSON.stringify(snapshot.rsvpEntourageGuestDetails)) {
      onChange("rsvpEntourageGuestDetails" as keyof InvitationData, snapshot.rsvpEntourageGuestDetails);
    }
    if (JSON.stringify(data.rsvpGuestDetails) !== JSON.stringify(snapshot.rsvpGuestDetails)) {
      onChange("rsvpGuestDetails" as keyof InvitationData, snapshot.rsvpGuestDetails);
    }
    if (data.heroIcon !== snapshot.heroIcon) {
      onChange("heroIcon" as keyof InvitationData, snapshot.heroIcon);
    }
    if (JSON.stringify(data.galleryImages) !== JSON.stringify(snapshot.galleryImages)) {
      onChange("galleryImages" as keyof InvitationData, snapshot.galleryImages);
    }
    if (JSON.stringify(data.venueImages) !== JSON.stringify(snapshot.venueImages)) {
      onChange("venueImages" as keyof InvitationData, snapshot.venueImages);
    }
    if (data.customHeadingFont !== snapshot.customHeadingFont) {
      onChange("customHeadingFont" as keyof InvitationData, snapshot.customHeadingFont);
    }
    if (data.customBodyFont !== snapshot.customBodyFont) {
      onChange("customBodyFont" as keyof InvitationData, snapshot.customBodyFont);
    }
    if (JSON.stringify(data.backgroundMusic) !== JSON.stringify(snapshot.backgroundMusic)) {
      onChange("backgroundMusic" as keyof InvitationData, snapshot.backgroundMusic);
    }
    if (JSON.stringify(data.backgroundMusicFileNames) !== JSON.stringify(snapshot.backgroundMusicFileNames)) {
      onChange("backgroundMusicFileNames" as keyof InvitationData, snapshot.backgroundMusicFileNames);
    }
    if (JSON.stringify(data.weddingProgram) !== JSON.stringify(snapshot.weddingProgram)) {
      onChange("weddingProgram" as keyof InvitationData, snapshot.weddingProgram);
    }
    if (JSON.stringify(data.storyTimeline) !== JSON.stringify(snapshot.storyTimeline)) {
      onChange("storyTimeline" as keyof InvitationData, snapshot.storyTimeline);
    }
    if (JSON.stringify(data.venueLayout) !== JSON.stringify(snapshot.venueLayout)) {
      onChange("venueLayout" as keyof InvitationData, snapshot.venueLayout);
    }
    // Settings fields
    const settingsFields = ['musicEnabled', 'musicTrack', 'musicVolume', 'rsvpEnabled', 'rsvpDeadline', 'rsvpAllowPlusOne', 'rsvpAskPlusOneName', 'rsvpAllowKids', 'rsvpAskMealPreference', 'rsvpMealOptions', 'rsvpCustomQuestions', 'rsvpCollectPhone', 'rsvpCollectAddress', 'rsvpShowGuestCount', 'rsvpButtonText', 'rsvpSubmitMessage', 'rsvpClosedMessage'] as const;
    settingsFields.forEach(f => {
      if (JSON.stringify((data as any)[f]) !== JSON.stringify((snapshot as any)[f])) {
        onChange(f as keyof InvitationData, (snapshot as any)[f]);
      }
    });
  };

  // Handle save bubble click - show confirmation dialog unless setting says always save
  const handleSaveBubbleClick = () => {
    if (hideSaveConfirmationDialog) {
      handleToolsSave();
    } else {
      setShowSaveConfirmation(true);
    }
  };

  // Handle hide save confirmation dialog change
  const handleHideSaveConfirmationDialogChange = (value: boolean) => {
    if (onSettingsChange) {
      onSettingsChange({ isDarkMode, accentColor, hideSaveConfirmationDialog: value, hideInstructions, showScreenDimensions });
    }
  };

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate time remaining for countdown
  const getTimeLeft = () => {
    if (!data.date) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const weddingDate = new Date(data.date);
    const now = new Date();
    const diff = weddingDate.getTime() - now.getTime();
    
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
  };

  // Parse date components for date display
  const parseDateComponents = (dateStr: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return {
        month: date.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        monthFull: date.toLocaleString('en-US', { month: 'long' }),
        day: date.toLocaleString('en-US', { weekday: 'short' }).toUpperCase(),
        dayFull: date.toLocaleString('en-US', { weekday: 'long' }),
        date: date.getDate(),
        year: date.getFullYear()
      };
    } catch {
      return null;
    }
  };

  const getOrdinalSuffix = (n: string) => {
    const num = parseInt(n);
    if (num > 3 && num < 21) return 'th';
    switch (num % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const dateComponents = parseDateComponents(data.date);

  // Check if celebrant names are missing
  const hasCelebrantNames = data.nameType === "couple" 
    ? (data.hisName && data.hisName.trim() !== "") || (data.herName && data.herName.trim() !== "")
    : (data.coupleName && data.coupleName.trim() !== "");

  // Determine if countdown should be shown
  // Show countdown if names are available (even if countdown section is disabled)
  const showCountdown = hasCelebrantNames && data.date;

  // Update countdown every second
  useEffect(() => {
    setTimeLeft(getTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, [data.date]);

  const handleEntourageListClick = () => {
    setShowEntourageEditor(true);
  };

  const handleGuestListClick = () => {
    setShowGuestEditor(true);
  };

  const handleRSVPResponseClick = () => {
    setShowRSVPResponseEditor(true);
  };

  const handleMediaClick = () => {
    setShowMediaEditor(true);
  };

  const handleWeddingWebsiteClick = () => {
    if (onOpenEditor) {
      onOpenEditor();
    }
  };

  const handleSettingsClick = () => {
    setShowSettingsEditor(true);
  };

  const handleChecklistClick = () => {
    setShowChecklistEditor(true);
  };

  const handleBudgetClick = () => {
    setShowBudgetEditor(true);
  };

  const handleTableMapClick = () => {
    setShowTableMapEditor(true);
  };

  const handleWeddingProgramClick = () => {
    setShowWeddingProgramEditor(true);
  };

  const handleStoryTimelineClick = () => {
    setShowStoryTimelineEditor(true);
  };

  if (showEntourageEditor) {
    return (
      <EntourageEditor
        data={data}
        onChange={onChange}
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        onClose={() => setShowEntourageEditor(false)}
        onSave={onSave}
      />
    );
  }

  if (showGuestEditor) {
    return (
      <GuestEditor
        data={data}
        onChange={onChange}
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        onClose={() => setShowGuestEditor(false)}
        onSave={onSave}
      />
    );
  }

  if (showRSVPResponseEditor) {
    return (
      <RSVPResponseEditor
        data={data}
        invitationId={invitationId}
        onChange={onChange}
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        onClose={() => setShowRSVPResponseEditor(false)}
      />
    );
  }

  if (showMediaEditor) {
    return (
      <MediaEditor
        data={data}
        onChange={onChange}
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        onClose={() => setShowMediaEditor(false)}
        invitationId={invitationId}
        onSave={onSave}
        isDemoMode={isDemoMode}
      />
    );
  }

  if (showSettingsEditor) {
    return (
      <SettingsEditor
        data={data}
        onChange={onChange}
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        onClose={() => setShowSettingsEditor(false)}
        onSettingsChange={onSettingsChange}
        hideSaveConfirmationDialog={hideSaveConfirmationDialog}
        hideInstructions={hideInstructions}
        showScreenDimensions={showScreenDimensions}
        invitationId={invitationId}
        isDemoMode={isDemoMode}
        slug={slug}
      />
    );
  }

  if (showChecklistEditor) {
    return (
      <ChecklistEditor
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        onClose={() => setShowChecklistEditor(false)}
      />
    );
  }

  if (showBudgetEditor) {
    return (
      <BudgetEditor
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        onClose={() => setShowBudgetEditor(false)}
      />
    );
  }

  if (showTableMapEditor) {
    return (
      <TableMapEditor
        data={data}
        onChange={onChange}
        onImmediateSave={onSave}
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        onClose={() => setShowTableMapEditor(false)}
      />
    );
  }

  if (showWeddingProgramEditor) {
    return (
      <WeddingProgramEditor
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        onClose={() => setShowWeddingProgramEditor(false)}
        data={data}
        onChange={onChange}
        onSave={onSave}
      />
    );
  }

  if (showStoryTimelineEditor) {
    return (
      <StoryTimelineEditor
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        onClose={() => setShowStoryTimelineEditor(false)}
        galleryImages={data.galleryImages || []}
        data={data}
        onChange={onChange}
        onSave={onSave}
      />
    );
  }

  return (
    <div className="flex flex-col h-dvh lg:h-full">
      {/* Save bubble - shows when there are unsaved changes at tools level */}
      {hasUnsavedChanges && (
        <button
          onClick={handleSaveBubbleClick}
          aria-label={`Save ${changedSections.length} unsaved change${changedSections.length === 1 ? "" : "s"}`}
          title={`Save changes (${changedSections.join(", ")})`}
          className="fixed top-4 right-4 z-[60] no-print p-4 rounded-full shadow-lg transition-opacity backdrop-blur-sm"
          style={{ backgroundColor: accentColor }}
        >
          <div className="relative">
            <img
              src="/assets/ico-sav.png"
              alt="Save"
              className="w-7 h-7"
            />
            <span
              className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold rounded-full bg-white/80 border"
              style={{ color: accentColor, borderColor: accentColor, fontFamily: "Inter, sans-serif" }}
            >
              {changedSections.length}
            </span>
          </div>
        </button>
      )}

      {/* Custom Hero Preview - fixed, no scroll */}
      <div className="relative h-[28vh] overflow-hidden w-full shrink-0">
        {/* Background */}
        <div 
          className="absolute inset-0 z-0"
          style={{ 
            backgroundColor: data.mainColor1,
            backgroundImage: (() => {
              const imagesToUse = isMobile ? data.heroBackgroundImagesMobile : data.heroBackgroundImages;
              // Find the last non-empty image in the array
              if (imagesToUse && imagesToUse.length > 0) {
                const lastImage = [...imagesToUse].reverse().find(img => img && img.trim() !== '');
                if (lastImage) {
                  return `url(${lastImage})`;
                }
              }
              return undefined;
            })(),
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        {/* Overlay */}
        <div 
          className="absolute inset-0 z-0"
          style={{ 
            backgroundColor: data.mainColor1
              ? `${data.mainColor1}${Math.round((data.heroOverlayOpacity1 ?? 0.5) * 255).toString(16).padStart(2, '0')}`
              : undefined 
          }}
        />
        
        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center gap-0 px-4" style={{ transform: 'scale(0.65)', transformOrigin: 'center' }}>
          {/* Couple Name */}
          {hasCelebrantNames ? (
            <h1 
              className="text-3xl md:text-5xl lg:text-6xl leading-tight text-center mb-8"
              style={{
                fontFamily: getFontFamily(data.heroDisplayNameTypography || data.headingFont, "heading"),
                color: data.heroIconTextColor || "white",
                whiteSpace: data.heroAmpersandPosition === "default" ? "nowrap" : "pre-line",
                textShadow: `0 2px 4px rgba(0, 0, 0, ${data.heroTextShadowOpacity ?? 0.1})`,
              }}
              dangerouslySetInnerHTML={{
                __html: (() => {
                  if (data.nameType === "couple") {
                    const name1 = data.heroIconName2First ? (data.herName || "") : (data.hisName || "");
                    const name2 = data.heroIconName2First ? (data.hisName || "") : (data.herName || "");
                    const andText = data.andText || "&";
                    const ampersandScale = (data.heroAmpersandSize || 100) / 100;
                    const ampersandOpacity = (data.heroAmpersandOpacity || 100) / 100;
                    
                    switch (data.heroAmpersandPosition) {
                      case "first-line":
                        return `${name1} <span style="display: inline-block; transform: scale(${ampersandScale}); opacity: ${ampersandOpacity}; font-family: ${getFontFamily(data.heroAmpersandTypography || data.headingFont, "heading")};">${andText}</span><br/>${name2}`.trim();
                      case "middle-line":
                        return `${name1}<br/><span style="display: inline-block; transform: scale(${ampersandScale}); opacity: ${ampersandOpacity}; font-family: ${getFontFamily(data.heroAmpersandTypography || data.headingFont, "heading")};">${andText}</span><br/>${name2}`.trim();
                      case "second-line":
                        return `${name1}<br/><span style="display: inline-block; transform: scale(${ampersandScale}); opacity: ${ampersandOpacity}; font-family: ${getFontFamily(data.heroAmpersandTypography || data.headingFont, "heading")};">${andText}</span> ${name2}`.trim();
                      case "default":
                      default:
                        return `${name1} <span style="display: inline-block; transform: scale(${ampersandScale}); opacity: ${ampersandOpacity}; font-family: ${getFontFamily(data.heroAmpersandTypography || data.headingFont, "heading")};">${andText}</span> ${name2}`.trim();
                    }
                  }
                  return data.coupleName || "";
                })()
              }}
            />
          ) : (
            <div className="text-center flex flex-col items-center gap-0">
              <div className="flex flex-col items-center gap-0">
                <h1 
                  className="text-4xl md:text-6xl lg:text-7xl leading-none m-0"
                  style={{
                    fontFamily: "Praise, cursive",
                    color: data.heroIconTextColor || "white",
                    textShadow: `0 2px 4px rgba(0, 0, 0, ${data.heroTextShadowOpacity ?? 0.1})`,
                  }}
                >
                  Your
                </h1>
                <h1 
                  className="text-4xl md:text-6xl lg:text-7xl leading-none m-0"
                  style={{
                    fontFamily: "Praise, cursive",
                    color: data.heroIconTextColor || "white",
                    textShadow: `0 2px 4px rgba(0, 0, 0, ${data.heroTextShadowOpacity ?? 0.1})`,
                  }}
                >
                  All-in-One
                </h1>
                <h1 
                  className="text-4xl md:text-6xl lg:text-7xl leading-none m-0 mb-[-20px]"
                  style={{
                    fontFamily: "Praise, cursive",
                    color: data.heroIconTextColor || "white",
                    textShadow: `0 2px 4px rgba(0, 0, 0, ${data.heroTextShadowOpacity ?? 0.1})`,
                  }}
                >
                  Event Planner
                </h1>
              </div>
              <div 
                className="w-48 h-48 md:w-56 md:h-56 m-0 mt-[-20px]"
                style={{
                  backgroundColor: data.heroIconTextColor || "white",
                  WebkitMaskImage: "url(/assets/fsentiment-01.png)",
                  WebkitMaskSize: "contain",
                  WebkitMaskPosition: "center",
                  WebkitMaskRepeat: "no-repeat",
                  maskImage: "url(/assets/fsentiment-01.png)",
                  maskSize: "contain",
                  maskPosition: "center",
                  maskRepeat: "no-repeat",
                }}
              />
            </div>
          )}

          {/* Countdown */}
          {showCountdown && data.date && (
            <div className="flex justify-center gap-2 md:gap-4 mt-8">
              {[
                { value: timeLeft.days, label: "D" },
                { value: timeLeft.hours, label: "H" },
                { value: timeLeft.minutes, label: "M" },
                { value: timeLeft.seconds, label: "S" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center min-w-[40px] md:min-w-[50px]"
                >
                  <div
                    className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg mb-1"
                    style={{
                      backgroundColor: `${data.countdownCrystalColor || data.mainColor2}20`,
                      border: `1px solid ${data.countdownCrystalColor || data.mainColor2}40`,
                      color: data.countdownCrystalColor || data.mainColor2,
                      fontFamily: data.headingFont,
                    }}
                  >
                    <span className="text-lg md:text-xl font-bold">
                      {String(item.value).padStart(2, "0")}
                    </span>
                  </div>
                  <span
                    className="text-[10px] uppercase tracking-wider"
                    style={{
                      color: data.heroIconTextColor || "white",
                      opacity: 0.7,
                      fontFamily: data.bodyFont,
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Date Display */}
          {showCountdown && data.countdownShowDate && dateComponents && (
            <div className="mt-4">
              {/* Default Structure - Box Layout */}
              {data.countdownDateStructure !== "alternative" && data.countdownDateStructure !== "icon" && data.countdownDateStructure !== "elegant" && data.countdownDateStructure !== "modern" && (
                <div className="flex flex-col items-center gap-1">
                  <div className="text-sm md:text-base tracking-[0.2em] uppercase font-bold text-center" style={{ color: data.heroIconTextColor || "white" }}>
                    {dateComponents.month}
                  </div>
                  <div className="flex items-center gap-0 w-full max-w-[350px]">
                    <div className="flex items-center justify-end shrink-0 w-28">
                      <div className="w-24 h-[1px] bg-gradient-to-r from-transparent to-current opacity-50" style={{ color: data.heroIconTextColor || "white" }} />
                      <div className="text-sm tracking-[0.2em] uppercase text-right" style={{ color: data.heroIconTextColor || "white" }}>
                        {dateComponents.day}
                      </div>
                    </div>
                    <div className="flex justify-center shrink-0">
                      <div className="w-5 h-[1px] bg-current opacity-50" style={{ color: data.heroIconTextColor || "white" }} />
                    </div>
                    <div className="flex-1 flex items-center justify-center text-4xl md:text-5xl font-bold tracking-[0.1em]" style={{ color: data.heroIconTextColor || "white" }}>
                      {dateComponents.date}
                    </div>
                    <div className="flex justify-center shrink-0">
                      <div className="w-5 h-[1px] bg-current opacity-50" style={{ color: data.heroIconTextColor || "white" }} />
                    </div>
                    <div className="flex items-center justify-start shrink-0 w-28">
                      <div className="text-sm tracking-[0.2em] uppercase text-left whitespace-nowrap" style={{ color: data.heroIconTextColor || "white" }}>
                        {data.time || "4:00 PM"}
                      </div>
                      <div className="w-24 h-[1px] bg-gradient-to-l from-transparent to-current opacity-50" style={{ color: data.heroIconTextColor || "white" }} />
                    </div>
                  </div>
                  <div className="text-[10px] md:text-xs tracking-[0.2em] uppercase font-bold text-center" style={{ color: data.heroIconTextColor || "white" }}>
                    {dateComponents.year}
                  </div>
                </div>
              )}

              {/* Alternative Structure */}
              {data.countdownDateStructure === "alternative" && (
                <div className="flex flex-col items-center gap-1 text-center">
                  <div className="text-xs md:text-sm tracking-[0.1em]" style={{ color: data.heroIconTextColor || "white" }}>
                    On the {dateComponents.date}{getOrdinalSuffix(String(dateComponents.date))} of {dateComponents.monthFull || dateComponents.month} {dateComponents.year}
                  </div>
                  <div className="text-[10px] md:text-xs tracking-[0.1em]" style={{ color: data.heroIconTextColor || "white" }}>
                    {dateComponents.dayFull || dateComponents.day} @ {data.time || "4:00 PM"}
                  </div>
                </div>
              )}

              {/* Icon Structure */}
              {data.countdownDateStructure === "icon" && (
                <div className="flex flex-col items-center gap-1 text-center">
                  <div
                    className="w-6 h-6"
                    style={{
                      backgroundColor: data.heroIconTextColor || "white",
                      WebkitMaskImage: "url(/assets/date.svg)",
                      WebkitMaskSize: "contain",
                      WebkitMaskPosition: "center",
                      WebkitMaskRepeat: "no-repeat",
                      maskImage: "url(/assets/date.svg)",
                      maskSize: "contain",
                      maskPosition: "center",
                      maskRepeat: "no-repeat"
                    }}
                  />
                  <div className="text-xs md:text-sm tracking-[0.1em]" style={{ color: data.heroIconTextColor || "white" }}>
                    The {dateComponents.date}{getOrdinalSuffix(String(dateComponents.date))} of {dateComponents.monthFull || dateComponents.month} {dateComponents.year}
                  </div>
                  <div className="text-[10px] md:text-xs tracking-[0.1em]" style={{ color: data.heroIconTextColor || "white" }}>
                    {dateComponents.dayFull || dateComponents.day} @ {data.time || "4:00 PM"}
                  </div>
                </div>
              )}

              {/* Elegant Structure */}
              {data.countdownDateStructure === "elegant" && (
                <div className="inline-flex items-center text-center p-4">
                  <div className="text-right text-xs md:text-sm tracking-[0.2em] uppercase font-light" style={{ width: '2.5rem', color: data.heroIconTextColor || "white" }}>
                    {dateComponents.month}
                  </div>
                  <div className="text-xs md:text-sm font-light mx-0.5" style={{ color: data.heroIconTextColor || "white" }}>|</div>
                  <div className="text-center text-2xl md:text-3xl font-light tracking-[0.1em]" style={{ width: '3rem', color: data.heroIconTextColor || "white" }}>
                    {String(dateComponents.date).padStart(2, '0')}
                  </div>
                  <div className="text-xs md:text-sm font-light mx-0.5" style={{ color: data.heroIconTextColor || "white" }}>|</div>
                  <div className="text-left text-xs md:text-sm tracking-[0.2em] uppercase font-light" style={{ width: '2.5rem', color: data.heroIconTextColor || "white" }}>
                    {dateComponents.year}
                  </div>
                </div>
              )}

              {/* Modern Structure */}
              {data.countdownDateStructure === "modern" && (
                <div className="inline-flex items-center text-center p-4">
                  <div className="text-right flex flex-col items-end gap-0" style={{ width: '3rem' }}>
                    <div className="text-[8px] md:text-[10px] tracking-[0.2em] uppercase font-light" style={{ color: data.heroIconTextColor || "white" }}>
                      {dateComponents.dayFull || dateComponents.day}
                    </div>
                    <div className="text-[8px] md:text-[10px] tracking-[0.2em] uppercase font-light" style={{ color: data.heroIconTextColor || "white" }}>
                      {data.time ? data.time.split(' ')[0] : "2:00"}
                    </div>
                  </div>
                  <div className="text-[8px] md:text-[10px] font-light mx-0.5" style={{ color: data.heroIconTextColor || "white" }}>|</div>
                  <div className="text-center text-xl md:text-2xl font-light tracking-[0.1em]" style={{ width: '3rem', color: data.heroIconTextColor || "white" }}>
                    {String(dateComponents.date).padStart(2, '0')}
                  </div>
                  <div className="text-[8px] md:text-[10px] font-light mx-0.5" style={{ color: data.heroIconTextColor || "white" }}>|</div>
                  <div className="text-left flex flex-col items-start gap-0" style={{ width: '3rem' }}>
                    <div className="text-[8px] md:text-[10px] tracking-[0.2em] uppercase font-light" style={{ color: data.heroIconTextColor || "white" }}>
                      {dateComponents.month}
                    </div>
                    <div className="text-[8px] md:text-[10px] tracking-[0.2em] uppercase font-light" style={{ color: data.heroIconTextColor || "white" }}>
                      {dateComponents.year}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <ToolTile
            icon="/assets/ico-entourage.png"
            label="Entourage List"
            onClick={handleEntourageListClick}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
          />
          <ToolTile
            icon="/assets/ico-guest.png"
            label="Guest List"
            onClick={handleGuestListClick}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
          />
          <ToolTile
            icon="/assets/ico-rsvp.png"
            label="Responses"
            onClick={handleRSVPResponseClick}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
          />
          <ToolTile
            icon="/assets/ico-med.png"
            label="Media"
            onClick={handleMediaClick}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
          />
          <ToolTile
            icon="/assets/ico-event.png"
            label="Checklist"
            onClick={handleChecklistClick}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
          />
          <ToolTile
            icon="/assets/ico-budget.png"
            label="Budget List"
            onClick={handleBudgetClick}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
          />
          <ToolTile
            icon="/assets/ico-table.png"
            label="Table Map"
            onClick={handleTableMapClick}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
          />
          <ToolTile
            icon="/assets/ico-event.png"
            label="Wedding Program"
            onClick={handleWeddingProgramClick}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
          />
          <ToolTile
            icon="/assets/ico-event.png"
            label="Story Timeline"
            onClick={handleStoryTimelineClick}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
          />
          <ToolTile
            icon="/assets/ico-mail.png"
            label="Wedding Website"
            onClick={handleWeddingWebsiteClick}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
          />
          <ToolTile
            icon="/assets/ico-settings.png"
            label="Settings"
            onClick={handleSettingsClick}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
          />
        </div>
      </div>

      {/* Save confirmation dialog */}
      <SaveConfirmationDialog
        isOpen={showSaveConfirmation}
        pendingChangesCount={changedSections.length}
        isDarkMode={isDarkMode}
        accentColor={accentColor}
        hideSaveConfirmationDialog={hideSaveConfirmationDialog}
        onSave={handleToolsSave}
        onDiscard={handleToolsDiscard}
        onClose={() => setShowSaveConfirmation(false)}
        onHideSaveConfirmationDialogChange={handleHideSaveConfirmationDialogChange}
      />
    </div>
  );
}
